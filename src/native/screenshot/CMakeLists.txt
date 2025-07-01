cmake_minimum_required(VERSION 3.10)

# Projeto do módulo nativo de screenshot
project(native_screenshot_module)

# Definir versão do C++
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Encontrar Node.js
execute_process(COMMAND node -p "require('node-addon-api').include"
        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
        OUTPUT_VARIABLE NODE_ADDON_API_DIR
        OUTPUT_STRIP_TRAILING_WHITESPACE)
        
execute_process(COMMAND node -p "process.versions.node"
        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
        OUTPUT_VARIABLE NODE_VERSION
        OUTPUT_STRIP_TRAILING_WHITESPACE)

# Configurar include directories
include_directories(${NODE_ADDON_API_DIR})

# Definir macros necessárias
add_definitions(-DNAPI_VERSION=8)
add_definitions(-DNAPI_CPP_EXCEPTIONS)

# Windows-specific configuration
if(WIN32)
    # Definir versão do Windows para APIs
    add_definitions(-DWIN32_LEAN_AND_MEAN)
    add_definitions(-DNOMINMAX)
    add_definitions(-D_WIN32_WINNT=0x0A00) # Windows 10+
    
    # Configurações do compilador MSVC
    if(MSVC)
        set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /EHsc")
        set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} /MT")
        set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} /MTd")
    endif()
endif()

# Source files
set(SOURCES
    src/main.cpp
    src/DesktopDuplicator.cpp
    src/NapiDesktopDuplicator.cpp
)

# Headers
set(HEADERS
    src/DesktopDuplicator.h
    src/NapiDesktopDuplicator.h
)

# Criar biblioteca compartilhada
add_library(${PROJECT_NAME} SHARED ${SOURCES} ${HEADERS})

# Nome do arquivo de saída (.node é necessário para Node.js)
set_target_properties(${PROJECT_NAME} PROPERTIES
    PREFIX ""
    SUFFIX ".node"
    OUTPUT_NAME "${PROJECT_NAME}"
)

# Windows-specific libraries
if(WIN32)
    target_link_libraries(${PROJECT_NAME} 
        dxgi.lib
        d3d11.lib
        kernel32.lib
        user32.lib
        gdi32.lib
    )
endif()

# Configurações específicas para Node.js addon
if(MSVC AND CMAKE_JS_NODELIB_DEF AND CMAKE_JS_NODELIB_TARGET)
    # Linking with node.exe
    execute_process(COMMAND ${CMAKE_JS_NODELIB_TARGET} ${CMAKE_JS_NODELIB_DEF}
                    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR})
endif()

# Output directory
set_target_properties(${PROJECT_NAME} PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_SOURCE_DIR}/../../../build/Release"
    LIBRARY_OUTPUT_DIRECTORY "${CMAKE_SOURCE_DIR}/../../../build/Release"
    ARCHIVE_OUTPUT_DIRECTORY "${CMAKE_SOURCE_DIR}/../../../build/Release"
)

# Debug output
message(STATUS "Node.js version: ${NODE_VERSION}")
message(STATUS "Node-addon-api include dir: ${NODE_ADDON_API_DIR}")
message(STATUS "Project source dir: ${CMAKE_SOURCE_DIR}")
message(STATUS "Build type: ${CMAKE_BUILD_TYPE}")

# Instalar target
install(TARGETS ${PROJECT_NAME}
    DESTINATION "${CMAKE_SOURCE_DIR}/../../../build/Release"
) 