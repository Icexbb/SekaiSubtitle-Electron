import axios from "axios";
import fs from 'fs';
import os from "os";
import {ipcRenderer} from "electron"
const releaseUrl: string = "https://api.github.com/repos/Icexbb/SekaiSubtitle-Core-Go/releases"

const CoreBin: string = ipcRenderer.sendSync("get-core-path")

export async function downloadLatestCore(progress) {
    const coreUrlResp = await axios.get(releaseUrl)
    let assetList :object[] = coreUrlResp.data[0]['assets']
    assetList.forEach(value => {
        let coreName:string = value['name']
        let found = false;
        if (os.platform()=="win32"&& coreName.toLowerCase().endsWith(".exe")) found = true;

        if (found){
            let coreUrl :string= value['browser_download_url']
            ipcRenderer.send("stop-core")
            return axios.get(coreUrl, {
                responseType: "arraybuffer",
                onDownloadProgress: (event) => {
                    progress(event)
                }
            }).then((resp) => {
                const data = Buffer.from(resp.data, 'binary');
                fs.writeFileSync(CoreBin, data);
                ipcRenderer.send("restart-core")
            })
        }

    })

}
