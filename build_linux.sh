#!/usr/bin/env bash

export PATH="$HOME/ondk/toolchains/llvm.dir/bin:$PATH"

cmake -B build \
    -DCMAKE_BUILD_TYPE="Release" \
    -DCMAKE_SYSTEM_NAME="Linux" \
    -DCMAKE_SYSTEM_PROCESSOR="x86_64" \
    -DCMAKE_C_COMPILER="clang" \
    -DCMAKE_C_COMPILER_TARGET="x86_64-linux-android24" \
    -DCMAKE_CXX_COMPILER="clang++" \
    -DCMAKE_CXX_COMPILER_TARGET="x86_64-linux-android24" \
    && cmake --build build || echo "Faild to build"