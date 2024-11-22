#!/usr/bin/env bash

# Notice
# If you run this script on windows
# must run on msys2 environment
# and install python cmake wget

toolchain_dir="./toolchain"

abort() {
    echo "Error: $1" >/dev/stderr
    exit 1
}

fetch_cross_toolchains() {
    # download different toolchain for native platform
    if [ "$OS" == "Windows_NT" ]; then
        host="mingw-w64"
    elif [ "$(uname -s)" == "Linux" ]; then
        host="linux"
    elif [ "$(uname -s)" == "Darwin" ]; then
        host="darwin"
    fi

    [ -z "$host" ] && abort "Cannot determine host platform"
    arch="$(uname -m)"
    # Replace on windows platform
    if [ "$host" == "mingw-w64" ]; then
        arch="i686"
    fi


    if [ ! "$host" == "mingw-w64" ]; then
        if [ ! "$arch" == "x86_64" ] && [ ! "$arch" == "aarch64" ]; then 
            abort "Can only cross compile at 64bit machine"
        fi
    fi

    prefix=""
    padding=""
    case $host in
    mingw-w64)
        prefix="${host}-"
        padding=".zip"
        ;;
    linux)
        prefix=
        padding=".tar.xz"
        ;;
    darwin)
        prefix="${host}-"
        padding=".tar.xz"
        ;;
    *)
        abort "There is no more platform valid"
        ;; 
    esac

    download_url="https://armkeil.blob.core.windows.net/developer/Files/downloads/gnu/12.2.rel1/binrel/arm-gnu-toolchain-12.2.rel1-${prefix}${arch}-aarch64-none-elf${padding}"

    arm_toolchain_dir="$toolchain_dir/arm-toolchain/"
    if [ ! -d "$arm_toolchain_dir" ]; then
        if [ ! -d "$arm_toolchain_dir" ]; then
            mkdir -p "$arm_toolchain_dir"
        fi
        file_name="$toolchain_dir/arm-gnu-toolchain-12.2.rel1-${prefix}${arch}-aarch64-none-elf${padding}"
        top="arm-gnu-toolchain-12.2.rel1-${prefix}${arch}-aarch64-none-elf"
        wget "$download_url" -O "$file_name"

        if [ "$host" == "mingw-w64" ]; then
            python ./extract_on_windows.py "$file_name" "$arm_toolchain_dir"
        else
            tar -xvf "$file_name" --strip-components=1 -C "$arm_toolchain_dir"
        fi

    fi
}

build() {
    if [ "$OS" == "Windows_NT" ]; then
        make="mingw32-make"
    else
        make="make"
    fi

    if [ ! -d "out" ]; then
        mkdir -p out
    fi

    $make -C kp/kernel TARGET_COMPILE=placeholder clean
    $make -C kp/kernel -j$(nproc --all) \
        TARGET_COMPILE="$(readlink -f toolchain/arm-toolchain)/bin/aarch64-none-elf-" \
        ANDROID=1
    
    cp -f kp/kernel/kpimg out/kpimg-android

    $make -C kp/kernel TARGET_COMPILE=placeholder clean
    $make -C kp/kernel -j$(nproc --all) \
        TARGET_COMPILE="$(readlink -f toolchain/arm-toolchain)/bin/aarch64-none-elf-"
    
    cp -f kp/kernel/kpimg out/kpimg-linux

}

if [ -d "build" ]; then
    rm -rf "build"
fi

fetch_cross_toolchains
build