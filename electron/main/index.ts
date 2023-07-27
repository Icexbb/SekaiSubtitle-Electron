import {app, BrowserWindow, shell, ipcMain, dialog, Notification, ipcRenderer} from 'electron'
import {release} from 'node:os'
import {join} from 'node:path'
import path from 'path';
import cp from 'child_process';
import * as fs from 'fs';

const axios = require("axios")
const WebSocket = require('ws')
const semver = require("semver")
// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.ts    > Electron-Main
// │ └─┬ preload
// │   └── index.ts    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '..')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
    ? join(process.env.DIST_ELECTRON, '../public')
    : process.env.DIST
const USER_HOME = process.env.HOME || process.env.USERPROFILE
const PROGRAM_DIR = process.platform === 'win32'
    ? path.join(USER_HOME, 'Documents', 'SekaiSubtitle')
    : path.join(USER_HOME, 'SekaiSubtitle')
const EXTRA_RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath)
    : path.join(__dirname, '../../extra');
const getExtraResourcesPath = (...paths: string[]): string => {
    return path.join(EXTRA_RESOURCES_PATH, ...paths);
};

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
    app.quit()
    process.exit(0)
}

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')
let running = true;
const CoreBin: string = path.join(PROGRAM_DIR, "core", process.platform === 'win32' ? 'core.exe' : 'core.bin');

let CoreVersion;

function initCoreVersion() {
    const CoreBinPacked: string = getExtraResourcesPath(process.platform === 'win32' ? 'core.exe' : 'core.bin');
    if (fs.existsSync(CoreBin)) {
        CoreVersion = cp.execSync(`"${CoreBin}" -v`).toString()
    }
    if (fs.existsSync(CoreBinPacked)) {
        let CorePackedVersion;
        cp.exec(`"${CoreBinPacked}" -v`, (error, stdout, stderr) => {
            CorePackedVersion = stdout;
            let replace = false;
            if (!fs.existsSync(CoreBin)) replace = true;
            else if (semver.gt(CorePackedVersion, CoreVersion, true)) replace = true;
            else if (fs.statSync(CoreBinPacked).mtimeMs > fs.statSync(CoreBin).mtimeMs) replace = true;

            if (replace) {
                CoreVersion = CorePackedVersion;
                fs.cp(CoreBinPacked, CoreBin, (err) => {
                    if (err == null) if (app.isPackaged) fs.unlinkSync(CoreBinPacked);
                });
            }
        })
    }
}


let CoreLatestVersion;
const AppVersion = JSON.parse(fs.readFileSync(path.join(__dirname, "../../package.json")).toString()).version;
let AppLatestVersion;
let CoreProcess: cp.ChildProcess = null;
let CorePort: number = null;
let CoreConnected: Boolean = false;
let CoreWebSocket: WebSocket = null;
let CoreLogs: string[] = [];
let CoreTaskLogs: object = {};
let CoreTasks: object = {};

async function createWindow() {
    win = new BrowserWindow({
        title: 'Sekai Subtitle',
        icon: join(process.env.PUBLIC, 'favicon.ico'),
        webPreferences: {
            preload,
            nodeIntegration: true,
            contextIsolation: false,
            sandbox: false,
            webSecurity: false,
        },
        // frame: false,
        // titleBarStyle: 'hidden'
    })
    win.setMenuBarVisibility(false)

    if (!app.isPackaged) { // electron-vite-vue#298
        await win.loadURL(`http://127.0.0.1:50023`)
        // Open devTool if the app is not packaged
        win.webContents.openDevTools()
    } else {
        await win.loadFile(indexHtml)
    }

    // Test actively push message to the Electron-Renderer
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', new Date().toLocaleString())
    })

    // Make all links open with the browser, not with the application
    win.webContents.setWindowOpenHandler(({url}) => {
        if (url.startsWith('https:')) shell.openExternal(url)
        return {action: 'deny'}
    })
    // win.webContents.on('will-navigate', (event, url) => {
    // }) // #344
}

function initSocket() {
    CoreWebSocket = new WebSocket(`ws://127.0.0.1:${CorePort}/`)

    CoreWebSocket.onopen = () => {
        console.log("WebSocket Connected")
        CoreConnected = true;
        CoreWebSocket.send(JSON.stringify({type: "alive"}));
    }
    CoreWebSocket.onclose = () => {
        CoreConnected = false;
        if (fs.existsSync(CoreBin) && CoreProcess && running) {
            setTimeout(initSocket, 1500);
        }
        CoreTasks = []
        CoreTaskLogs = {}
    }
    CoreWebSocket.onmessage = (m) => {
        if (!CoreConnected) CoreConnected = true;
        let msg = JSON.parse(m.data)

        switch (msg.type) {
            case "log":
                let msgData = JSON.parse(msg.data)
                let taskId = msgData.id
                let taskLog = msgData.message
                if (CoreTaskLogs.hasOwnProperty(taskId)) {
                    CoreTaskLogs[taskId] = [...CoreTaskLogs[taskId], taskLog]
                } else {
                    CoreTaskLogs[taskId] = [taskLog]
                }

                win.webContents.send(`task-log-${taskId}`, taskLog)
                break;
            case "tasks":
                CoreTasks = JSON.parse(msg.data)
                win.webContents.send("task-status-change", CoreTasks)
                break;
            case "alive":
                setTimeout(() => {
                    CoreWebSocket.send(JSON.stringify({type: "alive"}));
                }, 500);
                break;
        }
    }
    CoreWebSocket.onerror = (res) => {
        if (!fs.existsSync(CoreBin)) {
            CoreConnected = false;
            //TODO
        } else {
            CoreConnected = false;
            console.log('WebSocket Error: ', Object.keys(res));
        }
    }
}


function appendLog(data: Buffer) {
    const iconv = require('iconv-lite');

    let logString: string = iconv.decode(data, 'gbk');
    let logArr = logString.split('\n')
        .map(value => value.replace('\r', ""))
    let logSet = new Set<string>(logArr)
    Array.from(logSet).forEach(value => {
        if (value.length) {
            CoreLogs.push(value);
        }
    })
}


function startReleaseCore() {
    if (fs.existsSync(CoreBin)) {
        CoreProcess = cp.spawn(`"${CoreBin}" -p ${CorePort}`, {shell: true})
        CoreProcess.stderr.on("data", appendLog)
        CoreProcess.stdout.on("data", appendLog)
        console.log("Core Started")
    } else
        console.log("Core Not Found")
}

import getPort from "./port"

function initCore() {
    initCoreVersion()
    let devPort = 50000;
    getPort({port: devPort}).then((port) => {
        if (port === devPort) {
            console.log("Using Release Core")
            getPort().then(port => {
                CorePort = port
            }).then(startReleaseCore)
        } else {
            console.log("Using Dev Core")
            CorePort = 50000
        }
    }).finally(() => {
        setTimeout(initSocket, 1500)
    })

}

app.whenReady().then(createWindow).then(initCore).then(() => {
    const setting = fs.existsSync(path.join(PROGRAM_DIR, 'setting.json'))
        ? JSON.parse(fs.readFileSync(path.join(PROGRAM_DIR, 'setting.json')).toString())
        : {}
    setProxy(setting)
})

app.on('window-all-closed', () => {
    running = false
    win = null
    try {
        CoreWebSocket.close()
        if (CoreProcess) CoreProcess.kill();
    } finally {
        app.quit();
    }
})

app.on('second-instance', () => {
    if (win) {
        // Focus on the main window if the user tried to open another
        if (win.isMinimized()) win.restore()
        win.focus()
    }
})

app.on('activate', () => {
    const allWindows = BrowserWindow.getAllWindows()
    if (allWindows.length) {
        allWindows[0].focus()
    } else {
        createWindow().then(() => {
        })
    }
})

process.on('uncaughtException', function (err) {
    console.log(err);
});

interface NotificationOption {
    title: string,
    body: string
}

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
    const childWindow = new BrowserWindow({
        webPreferences: {
            preload,
            nodeIntegration: true,
            contextIsolation: false,
        },
    })
    if (process.env.VITE_DEV_SERVER_URL) {
        childWindow.loadURL(`${url}#${arg}`).then()
    } else {
        childWindow.loadFile(indexHtml, {hash: arg}).then()
    }
})

ipcMain.on('select-file-exist-video', function (event) {
    dialog.showOpenDialog({
        title: '选择视频文件',
        properties: ['openFile',],
        filters: [{name: 'Movies', extensions: ['mkv', 'avi', 'mp4', "wmv"]}]
    }).then(result => {
        event.sender.send('selected-video', result)
    })
});
ipcMain.on('select-file-exist-json', function (event) {
    dialog.showOpenDialog({
        title: '选择数据文件',
        properties: ['openFile'],
        filters: [{name: '世界计划数据文件', extensions: ['json', 'asset']}]
    }).then(result => {
        event.sender.send('selected-json', result)
    })
});
ipcMain.on('select-file-exist-translate', function (event) {
    dialog.showOpenDialog({
        title: '选择翻译文件',
        properties: ['openFile',],
        filters: [{name: '世界计划翻译文件', extensions: ['yml', 'txt']}]
    }).then(result => {
        event.sender.send('selected-translate', result)
    })
});
ipcMain.on('select-file-save-subtitle', function (event) {
    dialog.showSaveDialog({
        title: '选择字幕文件保存位置',
        properties: ['createDirectory',],
        filters: [{name: 'Movies', extensions: ['mkv', 'avi', 'mp4', "wmv"]}]
    }).then(result => {
        event.sender.send('selected-subtitle-path', result)
    })
});

ipcMain.on('select-file-exist-story', function (event) {
    dialog.showOpenDialog({
        title: '选择数据文件',
        properties: ['openFile'],
        filters: [{name: '世界计划数据文件', extensions: ['json', 'asset','pjs.txt']}]
    }).then(result => {
        event.sender.send('selected-story', result)
    })
});

ipcMain.on('get-system-font', function (event) {
    let fontList = require('font-list')
    fontList.getFonts()
        .then(fonts => {
            event.sender.send("system-font", fonts)
        })
});
ipcMain.on('read-file-json', function (event) {
    dialog.showOpenDialog({
        title: '选择文件',
        properties: ['openFile'],
        filters: [{name: 'Json文件', extensions: ['json']}]
    }).then(result => {
        event.sender.send('read-file-json-result', result)
    })
});
ipcMain.on('save-file-json', function (event, args) {
    dialog.showSaveDialog({
        properties: ['createDirectory',],
        filters: [{name: 'Json文件', extensions: ['json']}]
    }).then(result => {
        if (!result.canceled) {
            fs.writeFile(result.filePath, JSON.stringify(args), err => {
                if (err) console.log(err)
                else console.log("Saved!")
            })
        }
    })
});
ipcMain.on('save-setting', (event, args) => {
    if (!fs.existsSync(PROGRAM_DIR)) fs.mkdirSync(PROGRAM_DIR)

    if (fs.existsSync(PROGRAM_DIR)) {
        fs.writeFileSync(path.join(PROGRAM_DIR, 'setting.json'), JSON.stringify(args))
        setProxy(args)
    } else {
        alert(`配置文件夹创建失败！`)
    }
})

function setProxy(setting) {
    switch (setting['proxy']) {
        case null:
            win.webContents.session.setProxy({mode: 'direct'}).then();
            break;
        case "system":
            win.webContents.session.setProxy({mode: 'system'}).then();
            break;
        default:
            win.webContents.session.setProxy({mode: 'fixed_servers', proxyRules: setting['proxy']}).then();
    }
}

ipcMain.on('get-setting', (event, args) => {
    const setting = fs.existsSync(path.join(PROGRAM_DIR, 'setting.json'))
        ? JSON.parse(fs.readFileSync(path.join(PROGRAM_DIR, 'setting.json')).toString())
        : {}
    let result;
    if ((typeof args) === 'string') {
        result = setting[args]
        event.sender.send('get-setting-result', setting[args])
    } else if ((typeof args) === 'object') {
        result = {}
        Object.keys(args).forEach((value) => {
            result[value] = setting[value]
        })
    } else {
        result = setting
    }
    event.sender.send('get-setting-result', result)
    event.returnValue = result
})
ipcMain.on('drag-start', (event, filePath) => {
    event.sender.startDrag({
        file: filePath,
        icon: path.join(__dirname, '../../public/DragDrop.png')
    })
    event.sender.send('drag-finished')
})
ipcMain.on('notification-show', (event, args: [NotificationOption, string]) => {
    const notification = new Notification(args[0])
    let targetPath = args[1];
    if (process.platform.includes("win32")) {
        while (targetPath.includes('/')) {
            targetPath = targetPath.replace('/', '\\')
        }
    }
    notification.on("click", () => {
        shell.showItemInFolder(targetPath)
    })
    notification.show()
})
ipcMain.on("get-core-logs", (event) => {
    event.sender.send('get-core-logs-result', CoreLogs)
})
ipcMain.on("get-core-exist", (event) => {
    event.returnValue = fs.existsSync(CoreBin);
    event.sender.send("get-core-exist-result",)
})

ipcMain.on("get-core-url", (event) => {
    event.returnValue = `127.0.0.1:${CorePort}`
})
ipcMain.on("get-core-version", (event) => {
    if (CoreLatestVersion == null)
        axios.get("https://api.github.com/repos/Icexbb/SekaiSubtitle-core/releases").then(resp => {
            CoreLatestVersion = resp.data[0].tag_name;
            event.sender.send("get-core-version-result", [CoreVersion, CoreLatestVersion])
        }).catch()
    else
        event.sender.send("get-core-version-result", [CoreVersion, CoreLatestVersion])
})
ipcMain.on("get-core-alive", (event) => {
    event.sender.send("get-core-alive-result", CoreConnected)
})
ipcMain.on("get-core-path", (event) => {
    let CorePath = CoreBin;
    if (process.platform.includes("win32")) {
        while (CorePath.includes('/')) {
            CorePath = CorePath.replace('/', '\\')
        }
    }
    if (!fs.existsSync(path.dirname(CorePath))) fs.mkdirSync(path.dirname(CorePath))
    event.returnValue = CorePath
})
ipcMain.on("get-asset-path", (event) => {
    let AssetDir: string = process.platform === 'win32'
        ? path.join(String(USER_HOME), 'Documents', 'SekaiSubtitle', "data")
        : path.join(String(USER_HOME), 'SekaiSubtitle', "data")

    if (process.platform.includes("win32")) {
        while (AssetDir.includes('/')) {
            AssetDir = AssetDir.replace('/', '\\')
        }
    }
    if (!fs.existsSync(AssetDir)) fs.mkdirSync(AssetDir)
    event.returnValue = AssetDir
})
ipcMain.on("get-app-version", (event) => {
    if (CoreLatestVersion == null)
        axios.get("https://api.github.com/repos/Icexbb/SekaiSubtitle-electron/releases").then(resp => {
            AppLatestVersion = resp.data[0].tag_name;
            event.sender.send("get-app-version-result", [AppVersion, AppLatestVersion])
        }).catch()
    else
        event.sender.send("get-app-version-result", [AppVersion, AppLatestVersion])
})
ipcMain.on("restart-core", (event) => {
    try {
        CoreWebSocket.close()
        CoreProcess.kill()
        CoreProcess = null;
    } catch (e) {
    }
    initCore();
    event.sender.send("restart-core-result", CoreConnected)
    event.returnValue = CoreConnected
})
ipcMain.on("stop-core", (event, args) => {
    try {
        CoreWebSocket.close()
        CoreProcess.kill()
        CoreProcess = null;
    } catch (e) {
        console.log(e)
    }
})

ipcMain.on("get-task-log", (event, args) => {
    event.returnValue = CoreTaskLogs[args]
})
ipcMain.on("get-task-status", (event, args) => {
    event.returnValue = CoreTasks
})
ipcMain.on("task-operate", (event, args) => {
    if (CoreWebSocket.readyState == CoreWebSocket.OPEN) {
        CoreWebSocket.send(JSON.stringify({type: args[1], data: args[0]}))
    }
})

ipcMain.on("task-new", (event, args) => {
    if (CoreWebSocket.readyState == CoreWebSocket.OPEN) {
        CoreWebSocket.send(JSON.stringify({
            type: "new",
            data: JSON.stringify({config: JSON.parse(args[0]), runAfterCreate: args[1]})
        }))
    }
})