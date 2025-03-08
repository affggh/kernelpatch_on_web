# Kernelpatch on web
- You can visit demo here 👉 [kernelpatch](https://kernelpatch-on-web.pages.dev) 👈

- This website based on `magiskboot` and `kptools`，    
which tools to patch boot image.

## How to build
### Fetch the source
- You can fetch source by **following** commands
```bash
git clone https://github.com/affggh/kernelpatch-on-web
# and then
cd kernelpatch-on-web
git submodule update --init

# and patch the source
git apply --directory kp patch/*.patch
git apply --directory zlib patch/zlib/*.patch
```

### Prepare compiler toolchians
- Install emscripten, ninja and cmake on your env    
this is a `demo` on msys2 clang64 environment.
```bash
pacman -Syyuu
pacman -S pactoys
pacboy -S toolchian emscripten cmake ninja
```

### Build
- Use emcmake to setup cmake env and build.
```bash
emcmake cmake -B build -G Ninja -DCMAKE_BUILD_TYPE="Release"
cmake --build build
```
