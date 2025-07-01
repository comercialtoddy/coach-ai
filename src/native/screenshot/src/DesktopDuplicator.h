#pragma once

#include <windows.h>
#include <dxgi1_2.h>  // Para IDXGIOutputDuplication
#include <d3d11.h>    // Para ID3D11Device, ID3D11Texture2D
#include <vector>
#include <memory>     // Para std::unique_ptr, std::shared_ptr
#include <stdexcept>  // Para std::runtime_error
#include <string>

// Macro para COM object safe release
#ifndef SAFE_RELEASE
#define SAFE_RELEASE(p) { if (p) { (p)->Release(); (p) = NULL; } }
#endif

// Error handling macro
#define THROW_IF_FAILED(hr, msg) \
    if (FAILED(hr)) { \
        throw std::runtime_error(std::string(msg) + " HRESULT: " + std::to_string(hr)); \
    }

// Structure para hold captured frame data
struct CapturedFrame {
    std::vector<uint8_t> pixels;
    int width;
    int height;
    int stride; // Bytes per row
    
    CapturedFrame() : width(0), height(0), stride(0) {}
    
    CapturedFrame(int w, int h, int s) : width(w), height(h), stride(s) {
        pixels.resize(h * s);
    }
};

/**
 * DesktopDuplicator - Classe para capturar desktop usando DXGI Desktop Duplication API
 * 
 * Esta classe encapsula toda a lógica de DXGI e D3D11 necessária para
 * capturar frames do desktop de forma eficiente e com baixa latência.
 * 
 * Características:
 * - Hardware accelerated via DXGI
 * - Baixa latência para real-time capture
 * - Anti-cheat compliant (usa APIs oficiais do Windows)
 * - Suporte a múltiplos monitores
 * - Error handling robusto com re-inicialização automática
 */
class DesktopDuplicator {
public:
    /**
     * Construtor padrão
     */
    DesktopDuplicator();
    
    /**
     * Destructor - limpa todos os recursos COM
     */
    ~DesktopDuplicator();

    /**
     * Inicializa o duplicator para um monitor específico
     * @param outputIdx Índice do monitor (0 = primário)
     * @throws std::runtime_error se a inicialização falhar
     */
    void Initialize(int outputIdx = 0);

    /**
     * Captura um único frame do desktop
     * @param timeoutMs Timeout em milissegundos para aguardar novo frame
     * @return unique_ptr para CapturedFrame ou nullptr se timeout/no new frame
     * @throws std::runtime_error se ocorrer erro crítico
     */
    std::unique_ptr<CapturedFrame> CaptureFrame(int timeoutMs = 100);

    /**
     * Obtém largura do display capturado
     * @return Largura em pixels
     */
    int GetWidth() const { return m_OutputWidth; }

    /**
     * Obtém altura do display capturado
     * @return Altura em pixels
     */
    int GetHeight() const { return m_OutputHeight; }

    /**
     * Verifica se o duplicator está inicializado
     * @return true se inicializado e pronto para captura
     */
    bool IsInitialized() const;

    /**
     * Força re-inicialização do duplicator
     * Útil quando DXGI_ERROR_ACCESS_LOST é detectado
     */
    void Reinitialize();

    /**
     * Obtém informações sobre displays disponíveis
     * @return Vector com informações dos displays
     */
    static std::vector<std::string> GetAvailableDisplays();

private:
    /**
     * Libera todos os recursos COM
     */
    void ReleaseResources();

    /**
     * Cria staging texture para CPU access
     */
    void CreateStagingTexture();

    /**
     * Verifica se DXGI Desktop Duplication está disponível
     */
    bool IsDesktopDuplicationAvailable();

    // DirectX 11 Objects
    ID3D11Device* m_pD3D11Device;
    ID3D11DeviceContext* m_pD3D11DeviceContext;
    
    // DXGI Objects
    IDXGIOutputDuplication* m_pDXGIOutputDuplication;
    
    // Textures
    ID3D11Texture2D* m_pDesktopTexture;  // Holds acquired desktop image
    ID3D11Texture2D* m_pStagingTexture;  // CPU-accessible copy
    
    // Display information
    int m_OutputWidth;
    int m_OutputHeight;
    int m_OutputIndex;
    
    // State tracking
    bool m_IsInitialized;
    bool m_AccessLost;
    
    // Performance tracking
    uint64_t m_TotalFramesCaptured;
    uint64_t m_TotalErrors;
    LARGE_INTEGER m_LastCaptureTime;
    LARGE_INTEGER m_Frequency;
}; 