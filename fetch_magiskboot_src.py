from urllib import request
import json
import os

API = "https://api.github.com/repos/CircleCashTeam/magiskboot_build/releases/latest"

# fetch magiskboot source
resp = request.urlopen(API)

jsonData = resp.read()

release = json.loads(jsonData)

for asset in release['assets']:
    if asset['name'].endswith('src.tar.xz'):
        os.system(f"wget {asset['browser_download_url']}")
