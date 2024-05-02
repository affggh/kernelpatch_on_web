cmake_minimum_required(VERSION 3.12)

project(kptools C CXX)

set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

#set(CMAKE_C_COMPILER "clang")
#set(CMAKE_CXX_COMPILER "clang++")

if (CMAKE_BUILD_TYPE STREQUAL "Release")
    include(CheckIPOSupported)
    check_ipo_supported(RESULT ipo_supported OUTPUT error)

    if (ipo_supported)
        set(CMAKE_INTERPROCEDURAL_OPTIMIZATION TRUE)
        message(STATUS "LTO enabled")
    else()
        message(WARNING "LTO is not supported: ${error}")
    endif()
endif()

option(STATIC_BUILD "Build a static binary." ON)

if (STATIC_BUILD)
        set(CMAKE_EXE_LINKER_FLAGS "-static")
        set(CMAKE_FIND_LIBRARY_SUFFIXES ".a" CONFIG)
        set(BUILD_SHARED_LIBS OFF)
endif()

# Default build kptools
option(BUILD_KPTOOLS "Build kptools" ON)

if (BUILD_KPTOOLS)
    configure_file("kp/kernel/include/preset.h" "${CMAKE_BINARY_DIR}/include/preset.h" COPYONLY)

    add_executable(kptools
        "kp/tools/image.c"
        "kp/tools/kallsym.c"
        "kp/tools/kptools.c"
        "kp/tools/order.c"
        "kp/tools/insn.c"
        "kp/tools/patch.c"
        "kp/tools/symbol.c"
        "kp/tools/kpm.c"
        "kp/tools/common.c"
        "kp/tools/sha256.c"
    )

    target_include_directories(
        kptools
        PUBLIC
        "${CMAKE_BINARY_DIR}/include"
    )

    set(CMAKE_C_FLAGS "-Wall -Wextra -Wno-unused -Wno-unused-parameter")
    set(CMAKE_C_FLAGS_DEBUG "-g")

    if (CMAKE_CXX_COMPILER_ID STREQUAL "Clang")
        target_link_options(kptools PUBLIC "-fuse-ld=lld")
    endif ()

    if (CMAKE_BUILD_TYPE STREQUAL "Release") 
        target_link_options(kptools PUBLIC "-s")
    endif ()

    if (CMAKE_BUILD_TYPE STREQUAL "Debug")
        target_compile_definitions(kptools PUBLIC "-DDEBUG")
    endif ()

    # if build for wasm, then build as a module
    if (CMAKE_SYSTEM_NAME STREQUAL Emscripten)
        message("Detected Emscripten compiler")
        target_compile_options(kptools PUBLIC "-fPIC")
        target_link_options(kptools PUBLIC
            "-lproxyfs.js"
            "-lidbfs.js"
            "-pre-js=${CMAKE_SOURCE_DIR}/src/preload.js"
            "-sMODULARIZE=1" 
            "-sEXPORT_NAME=kptools"
            "-sALLOW_MEMORY_GROWTH"
            "-sFORCE_FILESYSTEM"
            "-sEXPORTED_RUNTIME_METHODS=['FS','PROXYFS','IDBFS','out','err','ccall','cwrap','setValue','getValue','UTF8ToString','UTF8ArrayToString','stringToUTF8Array','FS_createPath','FS_createDataFile','removeRunDependency','addRunDependency','addFunction','safeSetTimeout','runtimeKeepalivePush','runtimeKeepalivePop','maybeExit','wasmMemory','wasmExports','callMain']"
        )
    endif ()
endif ()
