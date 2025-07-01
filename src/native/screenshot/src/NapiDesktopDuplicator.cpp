#include "NapiDesktopDuplicator.h"
#include <iostream>

// ====== CaptureWorker Implementation ======

CaptureWorker::CaptureWorker(Napi::Function& callback, DesktopDuplicator* duplicator, int timeoutMs)
    : Napi::AsyncWorker(callback), m_duplicator(duplicator), m_timeoutMs(timeoutMs) {}

CaptureWorker::~CaptureWorker() {}

void CaptureWorker::Execute() {
    try {
        // Esta execução acontece em thread separada - não pode usar NAPI calls aqui
        m_capturedFrame = m_duplicator->CaptureFrame(m_timeoutMs);
    } catch (const std::runtime_error& e) {
        SetError(e.what()); // Definir mensagem de erro que será processada em OnError()
    } catch (const std::exception& e) {
        SetError(std::string("Screenshot capture failed: ") + e.what());
    } catch (...) {
        SetError("Unknown error during screenshot capture");
    }
}

void CaptureWorker::OnOK() {
    Napi::Env env = Env();
    
    if (m_capturedFrame && !m_capturedFrame->pixels.empty()) {
        // Captura bem-sucedida - criar Napi::Buffer dos pixels
        // IMPORTANTE: Usar finalizer para gerenciar memory lifecycle
        auto framePtr = m_capturedFrame.release(); // Release ownership do unique_ptr
        
        Napi::Buffer<uint8_t> buffer = Napi::Buffer<uint8_t>::New(
            env,
            framePtr->pixels.data(),
            framePtr->pixels.size(),
            // Finalizer: chamado quando o buffer é garbage collected
            [](Napi::Env env, uint8_t* data, CapturedFrame* frame) {
                delete frame; // Deletar CapturedFrame quando buffer for coletado
            },
            framePtr // Passar pointer para o finalizer
        );

        // Criar objeto de resultado com metadados
        Napi::Object result = Napi::Object::New(env);
        result.Set("width", Napi::Number::New(env, framePtr->width));
        result.Set("height", Napi::Number::New(env, framePtr->height));
        result.Set("stride", Napi::Number::New(env, framePtr->stride));
        result.Set("format", Napi::String::New(env, "BGRA"));
        result.Set("pixels", buffer);
        result.Set("timestamp", Napi::Number::New(env, GetTickCount64()));

        // Chamar callback JavaScript com (null, result)
        Callback().Call({env.Null(), result});
    } else {
        // Sem novo frame (timeout) - retornar null
        Callback().Call({env.Null(), env.Null()});
    }
}

void CaptureWorker::OnError(Napi::Error const &error) {
    // Erro durante captura - chamar callback com (error, null)
    Callback().Call({error.Value(), Env().Null()});
}

// ====== NapiDesktopDuplicator Implementation ======

Napi::Object NapiDesktopDuplicator::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "DesktopDuplicator", {
        // Instance methods
        InstanceMethod("initialize", &NapiDesktopDuplicator::Initialize),
        InstanceMethod("captureFrame", &NapiDesktopDuplicator::CaptureFrame),
        InstanceMethod("reinitialize", &NapiDesktopDuplicator::Reinitialize),
        InstanceMethod("isInitialized", &NapiDesktopDuplicator::IsInitialized),
        
        // Instance accessors (read-only properties)
        InstanceAccessor("width", &NapiDesktopDuplicator::GetWidth, nullptr),
        InstanceAccessor("height", &NapiDesktopDuplicator::GetHeight, nullptr),
        InstanceAccessor("stats", &NapiDesktopDuplicator::GetStats, nullptr),
        
        // Static methods
        StaticMethod("getAvailableDisplays", &NapiDesktopDuplicator::GetAvailableDisplays)
    });

    // Store constructor reference para uso futuro
    Napi::FunctionReference* constructor = new Napi::FunctionReference();
    *constructor = Napi::Persistent(func);
    env.SetInstanceData(constructor);

    exports.Set("DesktopDuplicator", func);
    return exports;
}

NapiDesktopDuplicator::NapiDesktopDuplicator(const Napi::CallbackInfo& info) 
    : Napi::ObjectWrap<NapiDesktopDuplicator>(info) {
    // Criar instância do DesktopDuplicator C++
    m_duplicator = new DesktopDuplicator();
    std::cout << "NapiDesktopDuplicator created" << std::endl;
}

NapiDesktopDuplicator::~NapiDesktopDuplicator() {
    delete m_duplicator;
    std::cout << "NapiDesktopDuplicator destroyed" << std::endl;
}

Napi::Value NapiDesktopDuplicator::Initialize(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    // Parâmetro opcional: outputIdx (monitor index)
    int outputIdx = 0;
    if (info.Length() > 0 && info[0].IsNumber()) {
        outputIdx = info[0].As<Napi::Number>().Int32Value();
    }
    
    try {
        m_duplicator->Initialize(outputIdx);
        std::cout << "DesktopDuplicator initialized for display " << outputIdx << std::endl;
        return env.Undefined();
    } catch (const std::runtime_error& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    } catch (const std::exception& e) {
        std::string errorMsg = std::string("Initialize failed: ") + e.what();
        Napi::Error::New(env, errorMsg).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value NapiDesktopDuplicator::CaptureFrame(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    // Verificar se callback foi fornecido
    if (info.Length() < 1 || !info[0].IsFunction()) {
        Napi::TypeError::New(env, "Callback function expected").ThrowAsJavaScriptException();
        return env.Undefined();
    }
    
    Napi::Function callback = info[0].As<Napi::Function>();
    
    // Parâmetro opcional: timeout em ms
    int timeoutMs = 16; // Default: 16ms para ~60 FPS
    if (info.Length() > 1 && info[1].IsNumber()) {
        timeoutMs = info[1].As<Napi::Number>().Int32Value();
    }
    
    // Criar e executar worker assíncrono
    CaptureWorker* worker = new CaptureWorker(callback, m_duplicator, timeoutMs);
    worker->Queue();
    
    return env.Undefined();
}

Napi::Value NapiDesktopDuplicator::Reinitialize(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        m_duplicator->Reinitialize();
        return env.Undefined();
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Undefined();
    }
}

Napi::Value NapiDesktopDuplicator::IsInitialized(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Boolean::New(env, m_duplicator->IsInitialized());
}

Napi::Value NapiDesktopDuplicator::GetWidth(const Napi::CallbackInfo& info) {
    return Napi::Number::New(info.Env(), m_duplicator->GetWidth());
}

Napi::Value NapiDesktopDuplicator::GetHeight(const Napi::CallbackInfo& info) {
    return Napi::Number::New(info.Env(), m_duplicator->GetHeight());
}

Napi::Value NapiDesktopDuplicator::GetStats(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    // Criar objeto com estatísticas básicas
    Napi::Object stats = Napi::Object::New(env);
    stats.Set("initialized", Napi::Boolean::New(env, m_duplicator->IsInitialized()));
    stats.Set("width", Napi::Number::New(env, m_duplicator->GetWidth()));
    stats.Set("height", Napi::Number::New(env, m_duplicator->GetHeight()));
    
    return stats;
}

Napi::Value NapiDesktopDuplicator::GetAvailableDisplays(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    try {
        auto displays = DesktopDuplicator::GetAvailableDisplays();
        
        Napi::Array result = Napi::Array::New(env, displays.size());
        for (size_t i = 0; i < displays.size(); ++i) {
            result.Set(i, Napi::String::New(env, displays[i]));
        }
        
        return result;
    } catch (const std::exception& e) {
        Napi::Error::New(env, e.what()).ThrowAsJavaScriptException();
        return env.Null();
    }
} 