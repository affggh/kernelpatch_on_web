
importScripts(
    'kptools.js',
    'magiskboot.js'
);

self.onmessage = function (event) {
    // get file input
    const bootimg = event.data[0];
    const kpimg = event.data[1];
    const superkey = event.data[2];
    const kpmfiles = event.data[3];

    var command = [];

    // precheck
    if (!bootimg && !kpimg && !superkey) {
        printmsg('cannot get message');
        printmsg(bootimg);
        printmsg(kpimg);
        printmsg(superkey);
        return;
    }

    function printmsg(msg) {
        self.postMessage(msg);
    }

    function printcommand(command) {
        self.postMessage("Run command:" + command.join(' '));
    }

    magiskboot({
        noInitialRun: true,
        print: printmsg,
        printErr: printmsg
    }).then(
        function (mod1) {
            function readFileAsync(file) {
                return new Promise((resolve, reject) => {
                    var reader = new FileReader();

                    reader.onload = function (event) {
                        resolve(event.target.result);
                    };

                    reader.onerror = function (error) {
                        reject(error);
                    };
                    reader.readAsArrayBuffer(file);
                });
            }

            // chdir to /home/web_user
            mod1.FS.chdir('/home/web_user');

            // upload boot and kpimg
            var f1reader = new FileReader();
            var f2reader = new FileReader();

            f1reader.onload = function (event) {
                const data = new Uint8Array(event.target.result);
                mod1.FS.writeFile('/home/web_user/boot.img', data);
                console.log('Write boot image');
                f2reader.onload = function (event) {

                    const data = new Uint8Array(event.target.result);
                    mod1.FS.writeFile('/home/web_user/kpimg', data);
                    console.log('Write kpimg');

                    // patch
                    // unpack boot image
                    command = ['unpack', 'boot.img'];
                    printcommand(command);
                    mod1.callMain(command);
                    kptools(
                        {
                            noInitialRun: true,
                            print: printmsg,
                            printErr: printmsg
                        }
                    ).then(function (mod2) {
                        // share mod1 FS
                        mod2.FS.mount(mod2.PROXYFS, {
                            root: "/home/web_user",
                            fs: mod1.FS
                        }, "/home/web_user");

                        mod2.FS.chdir('/home/web_user');
                        try {
                            mod1.FS.stat('/home/web_user/kernel');
                        } catch (error) {
                            printmsg(error);
                            return;
                        }
                        mod1.FS.rename('kernel', 'kernel.ori');

                        command = [
                            '-p',
                            '-i', 'kernel.ori',
                            '-o', 'kernel',
                            '-s', superkey,
                            '-k', 'kpimg'
                        ];
                        // kpm addtional
                        var writeKpmPrimises = [];
                        var kpm_dir = '/home/web_user/kpm/';
                        mod1.FS.mkdir(kpm_dir);
                        for (let kpm of kpmfiles) {
                            writeKpmPrimises.push(
                                readFileAsync(kpm).then(fileData => {
                                    mod1.FS.writeFile(kpm_dir + kpm.name, new Uint8Array(fileData));
                                    console.log('Write kpm file:', kpm.name);
                                })
                                    .catch(error => {
                                        printmsg(error);
                                        return;
                                    }));
                            command = command.concat(
                                [
                                    '-M', kpm_dir + kpm.name,
                                    '-V', 'pre-kernel-init',
                                    '-T', 'kpm'
                                ]);
                        }

                        Promise.all(writeKpmPrimises).then(
                            () => {
                                printcommand(command);
                                mod2.callMain(command);

                                // repack
                                command = ['repack', 'boot.img'];
                                printcommand(command)
                                mod1.callMain(command);

                                // download
                                try {
                                    mod1.FS.stat('/home/web_user/new-boot.img');
                                } catch (error) {
                                    printmsg("Seems Faild!");
                                }

                                const newdata = mod1.FS.readFile('/home/web_user/new-boot.img');
                                const blob = new Blob([newdata], { type: 'application/octet-stream' });

                                this.postMessage(blob);
                            }
                        );
                    });
                }
                f2reader.readAsArrayBuffer(kpimg);
            }
            f1reader.readAsArrayBuffer(bootimg);

        }
    );
}