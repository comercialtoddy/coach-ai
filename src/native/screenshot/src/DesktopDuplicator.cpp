#include "DesktopDuplicator.h"
#include <iostream>
#include <sstream>

DesktopDuplicator::DesktopDuplicator() :
    m_pD3D11Device(nullptr),
    m_pD3D11DeviceContext(nullptr),
    m_pDXGIOutputDuplication(nullptr),
    m_pDesktopTexture(nullptr),
    m_pStagingTexture(nullptr),
    m_OutputWidth(0),
    m_OutputHeight(0),
    m_OutputIndex(0),
    m_IsInitialized(false),
    m_AccessLost(false),
    m_TotalFramesCaptured(0),
    m_TotalErrors(0)
{
    // Inicializar performance counters
    QueryPerformanceFrequency(&m_Frequency);
    QueryPerformanceCounter(&m_LastCaptureTime);
}

DesktopDuplicator::~DesktopDuplicator() {
    ReleaseResources();
}

void DesktopDuplicator::Initialize(int outputIdx) {
    ReleaseResources(); // Garantir estado limpo

    HRESULT hr = S_OK;
    m_OutputIndex = outputIdx;

    try {
        // 1. Criar D3D11 Device
        D3D_FEATURE_LEVEL featureLevels[] = {
            D3D_FEATURE_LEVEL_11_0,
            D3D_FEATURE_LEVEL_10_1,
            D3D_FEATURE_LEVEL_10_0
        };
        UINT numFeatureLevels = ARRAYSIZE(featureLevels);

        hr = D3D11CreateDevice(
            nullptr,                    // Default adapter
            D3D_DRIVER_TYPE_HARDWARE,   // Use hardware acceleration
            nullptr,                    // No software module
            0,                          // No flags
            featureLevels,              // Feature levels to try
            numFeatureLevels,           // Number of feature levels
            D3D11_SDK_VERSION,          // SDK version
            &m_pD3D11Device,            // Out: D3D11 Device
            nullptr,                    // Out: Actual feature level used
            &m_pD3D11DeviceContext      // Out: D3D11 Device Context
        );
        THROW_IF_FAILED(hr, "Failed to create D3D11 Device.");

        // 2. Get DXGI Factory
        IDXGIDevice* pDXGIDevice = nullptr;
        hr = m_pD3D11Device->QueryInterface(__uuidof(IDXGIDevice), (void**)&pDXGIDevice);
        THROW_IF_FAILED(hr, "Failed to query IDXGIDevice.");

        IDXGIAdapter* pDXGIAdapter = nullptr;
        hr = pDXGIDevice->GetParent(__uuidof(IDXGIAdapter), (void**)&pDXGIAdapter);
        SAFE_RELEASE(pDXGIDevice);
        THROW_IF_FAILED(hr, "Failed to get IDXGIAdapter.");

        IDXGIFactory1* pDXGIFactory = nullptr;
        hr = pDXGIAdapter->GetParent(__uuidof(IDXGIFactory1), (void**)&pDXGIFactory);
        SAFE_RELEASE(pDXGIAdapter);
        THROW_IF_FAILED(hr, "Failed to get IDXGIFactory1.");

        // 3. Enumerate Outputs and Duplicate
        IDXGIOutput* pDXGIOutput = nullptr;
        hr = pDXGIFactory->EnumOutputs(outputIdx, &pDXGIOutput);
        SAFE_RELEASE(pDXGIFactory);
        THROW_IF_FAILED(hr, "Failed to enumerate output. Check outputIdx.");

        IDXGIOutput1* pDXGIOutput1 = nullptr;
        hr = pDXGIOutput->QueryInterface(__uuidof(IDXGIOutput1), (void**)&pDXGIOutput1);
        SAFE_RELEASE(pDXGIOutput);
        THROW_IF_FAILED(hr, "Failed to query IDXGIOutput1.");

        DXGI_OUTPUT_DESC outputDesc;
        hr = pDXGIOutput1->GetDesc(&outputDesc);
        THROW_IF_FAILED(hr, "Failed to get output description.");

        m_OutputWidth = outputDesc.DesktopCoordinates.right - outputDesc.DesktopCoordinates.left;
        m_OutputHeight = outputDesc.DesktopCoordinates.bottom - outputDesc.DesktopCoordinates.top;

        hr = pDXGIOutput1->DuplicateOutput(m_pD3D11Device, &m_pDXGIOutputDuplication);
        SAFE_RELEASE(pDXGIOutput1);
        THROW_IF_FAILED(hr, "Failed to duplicate output. Ensure WDDM 1.2+ driver and no other duplication apps.");

        // 4. Create staging texture
        CreateStagingTexture();

        m_IsInitialized = true;
        m_AccessLost = false;
        
        std::cout << "DesktopDuplicator initialized successfully for display " << outputIdx 
                  << " (" << m_OutputWidth << "x" << m_OutputHeight << ")" << std::endl;

    } catch (const std::exception& e) {
        ReleaseResources();
        m_IsInitialized = false;
        throw; // Re-throw exception
    }
}

std::unique_ptr<CapturedFrame> DesktopDuplicator::CaptureFrame(int timeoutMs) {
    if (!m_IsInitialized || !m_pDXGIOutputDuplication || !m_pD3D11DeviceContext || !m_pStagingTexture) {
        throw std::runtime_error("Duplicator not initialized. Call Initialize() first.");
    }

    if (m_AccessLost) {
        throw std::runtime_error("Desktop duplication access lost. Call Reinitialize().");
    }

    HRESULT hr = S_OK;
    DXGI_OUTDUPL_FRAME_INFO frameInfo;
    IDXGIResource* pDesktopResource = nullptr;

    try {
        // Acquire the next frame
        hr = m_pDXGIOutputDuplication->AcquireNextFrame(timeoutMs, &frameInfo, &pDesktopResource);

        if (hr == DXGI_ERROR_WAIT_TIMEOUT) {
            // No new frame available within the timeout - normal for real-time scenarios
            return nullptr;
        } else if (hr == DXGI_ERROR_ACCESS_LOST) {
            // Desktop duplication source lost (e.g., resolution change, alt-tab)
            m_AccessLost = true;
            SAFE_RELEASE(pDesktopResource);
            throw std::runtime_error("Desktop duplication access lost (DXGI_ERROR_ACCESS_LOST). Call Reinitialize().");
        } else if (FAILED(hr)) {
            SAFE_RELEASE(pDesktopResource);
            m_TotalErrors++;
            throw std::runtime_error("Failed to acquire next frame. HRESULT: " + std::to_string(hr));
        }

        // Get the desktop texture
        hr = pDesktopResource->QueryInterface(__uuidof(ID3D11Texture2D), (void**)&m_pDesktopTexture);
        SAFE_RELEASE(pDesktopResource);
        THROW_IF_FAILED(hr, "Failed to query ID3D11Texture2D from desktop resource.");

        // Copy the desktop texture to the staging texture
        m_pD3D11DeviceContext->CopyResource(m_pStagingTexture, m_pDesktopTexture);
        SAFE_RELEASE(m_pDesktopTexture);

        // Map the staging texture to CPU memory
        D3D11_MAPPED_SUBRESOURCE mappedResource;
        hr = m_pD3D11DeviceContext->Map(m_pStagingTexture, 0, D3D11_MAP_READ, 0, &mappedResource);
        THROW_IF_FAILED(hr, "Failed to map staging texture.");

        // Create CapturedFrame object
        auto frame = std::make_unique<CapturedFrame>();
        frame->width = m_OutputWidth;
        frame->height = m_OutputHeight;
        frame->stride = mappedResource.RowPitch;

        // Copy pixel data (BGRA format)
        frame->pixels.resize(frame->height * frame->stride);
        memcpy(frame->pixels.data(), mappedResource.pData, frame->height * frame->stride);

        // Unmap the staging texture
        m_pD3D11DeviceContext->Unmap(m_pStagingTexture, 0);

        // Release the frame
        hr = m_pDXGIOutputDuplication->ReleaseFrame();
        THROW_IF_FAILED(hr, "Failed to release frame.");

        // Update performance tracking
        m_TotalFramesCaptured++;
        QueryPerformanceCounter(&m_LastCaptureTime);

        return frame;

    } catch (const std::exception& e) {
        // Cleanup on error
        if (pDesktopResource) {
            SAFE_RELEASE(pDesktopResource);
        }
        if (m_pDesktopTexture) {
            SAFE_RELEASE(m_pDesktopTexture);
        }
        
        // Try to release frame if we got it
        if (m_pDXGIOutputDuplication) {
            m_pDXGIOutputDuplication->ReleaseFrame();
        }
        
        m_TotalErrors++;
        throw;
    }
}

bool DesktopDuplicator::IsInitialized() const {
    return m_IsInitialized && !m_AccessLost && m_pDXGIOutputDuplication != nullptr;
}

void DesktopDuplicator::Reinitialize() {
    std::cout << "Reinitializing DesktopDuplicator..." << std::endl;
    try {
        Initialize(m_OutputIndex);
    } catch (const std::exception& e) {
        std::cerr << "Failed to reinitialize DesktopDuplicator: " << e.what() << std::endl;
        throw;
    }
}

std::vector<std::string> DesktopDuplicator::GetAvailableDisplays() {
    std::vector<std::string> displays;
    
    try {
        // Create temporary DXGI factory to enumerate displays
        IDXGIFactory1* pDXGIFactory = nullptr;
        HRESULT hr = CreateDXGIFactory1(__uuidof(IDXGIFactory1), (void**)&pDXGIFactory);
        if (FAILED(hr)) {
            return displays;
        }

        // Enumerate adapters
        IDXGIAdapter* pAdapter = nullptr;
        for (UINT adapterIdx = 0; pDXGIFactory->EnumAdapters(adapterIdx, &pAdapter) != DXGI_ERROR_NOT_FOUND; ++adapterIdx) {
            // Enumerate outputs for this adapter
            IDXGIOutput* pOutput = nullptr;
            for (UINT outputIdx = 0; pAdapter->EnumOutputs(outputIdx, &pOutput) != DXGI_ERROR_NOT_FOUND; ++outputIdx) {
                DXGI_OUTPUT_DESC desc;
                if (SUCCEEDED(pOutput->GetDesc(&desc))) {
                    std::wstring deviceName(desc.DeviceName);
                    std::string deviceNameStr(deviceName.begin(), deviceName.end());
                    
                    int width = desc.DesktopCoordinates.right - desc.DesktopCoordinates.left;
                    int height = desc.DesktopCoordinates.bottom - desc.DesktopCoordinates.top;
                    
                    std::stringstream ss;
                    ss << "Display " << displays.size() << ": " << deviceNameStr 
                       << " (" << width << "x" << height << ")";
                    displays.push_back(ss.str());
                }
                SAFE_RELEASE(pOutput);
            }
            SAFE_RELEASE(pAdapter);
        }
        SAFE_RELEASE(pDXGIFactory);
        
    } catch (...) {
        // Ignore errors during enumeration
    }
    
    return displays;
}

void DesktopDuplicator::ReleaseResources() {
    SAFE_RELEASE(m_pDXGIOutputDuplication);
    SAFE_RELEASE(m_pStagingTexture);
    SAFE_RELEASE(m_pDesktopTexture);
    SAFE_RELEASE(m_pD3D11DeviceContext);
    SAFE_RELEASE(m_pD3D11Device);
    
    m_OutputWidth = 0;
    m_OutputHeight = 0;
    m_IsInitialized = false;
    m_AccessLost = false;
}

void DesktopDuplicator::CreateStagingTexture() {
    if (!m_pD3D11Device) {
        throw std::runtime_error("D3D11 device not created");
    }

    // Create staging texture for CPU access
    D3D11_TEXTURE2D_DESC desc;
    desc.Width = m_OutputWidth;
    desc.Height = m_OutputHeight;
    desc.MipLevels = 1;
    desc.ArraySize = 1;
    desc.Format = DXGI_FORMAT_B8G8R8A8_UNORM; // Common format for desktop capture
    desc.SampleDesc.Count = 1;
    desc.SampleDesc.Quality = 0;
    desc.Usage = D3D11_USAGE_STAGING; // Staging texture for CPU read
    desc.BindFlags = 0;
    desc.CPUAccessFlags = D3D11_CPU_ACCESS_READ; // Enable CPU read access
    desc.MiscFlags = 0;

    HRESULT hr = m_pD3D11Device->CreateTexture2D(&desc, nullptr, &m_pStagingTexture);
    THROW_IF_FAILED(hr, "Failed to create staging texture.");
}

bool DesktopDuplicator::IsDesktopDuplicationAvailable() {
    // Check Windows version (Windows 8+)
    OSVERSIONINFOEX osvi;
    ZeroMemory(&osvi, sizeof(OSVERSIONINFOEX));
    osvi.dwOSVersionInfoSize = sizeof(OSVERSIONINFOEX);
    osvi.dwMajorVersion = 6;
    osvi.dwMinorVersion = 2; // Windows 8

    DWORDLONG dwlConditionMask = 0;
    VER_SET_CONDITION(dwlConditionMask, VER_MAJORVERSION, VER_GREATER_EQUAL);
    VER_SET_CONDITION(dwlConditionMask, VER_MINORVERSION, VER_GREATER_EQUAL);

    return VerifyVersionInfo(&osvi, VER_MAJORVERSION | VER_MINORVERSION, dwlConditionMask);
} 