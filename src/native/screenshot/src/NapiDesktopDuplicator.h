#pragma once

#include <napi.h>
#include "DesktopDuplicator.h"

/**
 * CaptureWorker - AsyncWorker para captura não-bloqueante
 * 
 * Executa a captura de screenshot em thread separada para não bloquear
 * o event loop do Node.js - essencial para aplicações real-time.
 */
class CaptureWorker : public Napi::AsyncWorker {
public:
    CaptureWorker(Napi::Function& callback, DesktopDuplicator* duplicator, int timeoutMs);
    ~CaptureWorker();

    // Executa em thread separada
    void Execute() override;

    // Executa na main thread após Execute() completar com sucesso
    void OnOK() override;

    // Executa na main thread se Execute() falhar
    void OnError(Napi::Error const &error) override;

private:
    DesktopDuplicator* m_duplicator;
    std::unique_ptr<CapturedFrame> m_capturedFrame;
    int m_timeoutMs;
};

/**
 * NapiDesktopDuplicator - Wrapper ObjectWrap para DesktopDuplicator
 * 
 * Expõe a funcionalidade do DesktopDuplicator para JavaScript através
 * de node-addon-api, gerenciando o lifecycle do objeto C++.
 */
class NapiDesktopDuplicator : public Napi::ObjectWrap<NapiDesktopDuplicator> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    
    NapiDesktopDuplicator(const Napi::CallbackInfo& info);
    ~NapiDesktopDuplicator();

private:
    // JavaScript-exposed methods
    Napi::Value Initialize(const Napi::CallbackInfo& info);
    Napi::Value CaptureFrame(const Napi::CallbackInfo& info);
    Napi::Value Reinitialize(const Napi::CallbackInfo& info);
    Napi::Value IsInitialized(const Napi::CallbackInfo& info);
    
    // JavaScript-exposed accessors
    Napi::Value GetWidth(const Napi::CallbackInfo& info);
    Napi::Value GetHeight(const Napi::CallbackInfo& info);
    Napi::Value GetStats(const Napi::CallbackInfo& info);
    
    // Static methods
    static Napi::Value GetAvailableDisplays(const Napi::CallbackInfo& info);

    DesktopDuplicator* m_duplicator;
};

// Module initialization function
Napi::Object InitAll(Napi::Env env, Napi::Object exports); 