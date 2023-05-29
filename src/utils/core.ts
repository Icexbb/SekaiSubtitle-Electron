import axios from "axios";

const fs = require('fs')
import {ipcRenderer} from "electron"

const releaseUrl: string = "https://api.github.com/repos/Icexbb/SekaiSubtitle-core/releases"

const CoreBin: string = ipcRenderer.sendSync("get-core-path")

export async function downloadLatestCore(progress) {
    const coreUrlResp = await axios.get(releaseUrl)
    let coreUrl = coreUrlResp.data[0]['assets'][0]['browser_download_url']
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
