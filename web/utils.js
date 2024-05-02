class KpData {
    constructor() {
        this.gitapi = "https://api.github.com/repos/bmax121/KernelPatch/releases";
        this.data = null;
        this.fetchDataPromise = this.fetchData();
    }

    fetchData() {
        return fetch(this.gitapi)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            this.data = data;
            console.log('Data fetched successfully', this.data);
        })
        .catch(error => {
            console.error('Error while fetching data: ', error);
        });
    }

    async getLatestTag(prerelease) {
        await this.fetchDataPromise;
        if (this.data) {
            if (prerelease) {
                return this.data[0].tag_name;
            } else {
                for (let release of this.data) {
                    if (!release.prerelease) {
                        return release.tag_name;
                    }
                }
            }
        }
        return null;
    }

    async getLatestDownloadUrl(prerelease) {
        await this.fetchDataPromise;

        var r = null;
        if (this.data) {
            if (prerelease) {
                r = this.data[0];
            } else {
                for (let release of this.data) {
                    if (!release.prerelease) {
                        r = release;
                        break;
                    }
                }
            }
        }
        console.log('latest release:', r);

        for (let asset of r.assets) {
            if (asset.name.startsWith('kpimg-android')) {
                return asset.browser_download_url;
            }
        }
        return null;
    }
}