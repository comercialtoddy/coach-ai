#include "NapiDesktopDuplicator.h"

/**
 * Ponto de entrada principal do módulo nativo
 * 
 * Este arquivo registra o módulo com Node.js e expõe
 * as funcionalidades do DesktopDuplicator para JavaScript.
 */

// Função de inicialização do módulo
Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
    // Inicializar a classe NapiDesktopDuplicator
    return NapiDesktopDuplicator::Init(env, exports);
}

// Registrar o módulo com Node.js
NODE_API_MODULE(native_screenshot_module, InitAll) 