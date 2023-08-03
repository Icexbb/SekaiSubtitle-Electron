import {app, BrowserWindow, dialog, ipcMain, Notification, shell} from 'electron'
import {release} from 'node:os'
import {join} from 'node:path'
import path from 'path';
import cp from 'child_process';
import * as fs from 'fs';
import getPort from "./port"

import axios from "axios";
import WebSocket from 'ws';
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

const EXECUTABLE_EXT = process.platform === 'win32' ? "exe" : "bin"
const USER_HOME = process.env.HOME || process.env.USERPROFILE
const PROGRAM_DIR = process.platform === 'win32'
    ? path.join(USER_HOME, 'Documents', 'SekaiSubtitle')
    : path.join(USER_HOME, 'SekaiSubtitle')
const CORE_PATH = app.isPackaged
    ? path.join(process.resourcesPath, `../core.${EXECUTABLE_EXT}`)
    : path.join(__dirname, `../../lib/${process.platform}/core.${EXECUTABLE_EXT}`);

const APP_VER: string = JSON.parse(fs.readFileSync(path.join(__dirname, "../../package.json")).toString()).version;
const CORE_VER: string = (fs.existsSync(CORE_PATH)) ? cp.execSync(`"${CORE_PATH}" -v`).toString() : "";

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

let AppLatestVersion: string;
let AppRunning: boolean = true;
let AppLogs: string[] = [];

let CoreLatestVersion: string;
let CoreProcess: cp.ChildProcess = null;
let CorePort: number = null;
let CoreConnected: Boolean = false;
let CoreWebSocket: WebSocket = null;
let CoreLogs: string[] = [];
let CoreTaskLogs: object = {};
let CoreTasks: object = {};

interface NotificationOption {
    title: string,
    body: string
}

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

function appLog(message: string) {
    AppLogs.push(message)
    if (!app.isPackaged) console.log(message)
}

function coreLog(data: Buffer) {
    const iconv = require('iconv-lite');
    const encoding = getEncoding();
    let logString: string = iconv.decode(data, encoding['WebName']);
    let logArr = logString.split('\n')
        .map(value => value.replace('\r', ""))
    let logSet = new Set<string>(logArr)
    Array.from(logSet).forEach(value => {
        if (value.length) {
            CoreLogs.push(value);
        }
    })
}

function setProxy(setting: { [x: string]: any; }) {
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

function initSocket() {
    CoreWebSocket = new WebSocket(`ws://127.0.0.1:${CorePort}/`)
    CoreWebSocket.onopen = () => {
        appLog("WebSocket Connected")
        CoreConnected = true;
        CoreWebSocket.send(JSON.stringify({type: "alive"}));
    }
    CoreWebSocket.onclose = () => {
        CoreConnected = false;
        if (fs.existsSync(CORE_PATH) && CoreProcess && AppRunning) {
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
        if (!fs.existsSync(CORE_PATH)) {
            CoreConnected = false;
            //TODO
        } else {
            CoreConnected = false;
            appLog(`WebSocket Error: ${Object.keys(res)}`);
        }
    }
}

function getEncoding() {
    const stdout = cp.execSync('powershell [System.Text.Encoding]::Default')
    const strEncoding = stdout.toString()
    const encoding: any = {}
    for (let line of strEncoding.split(/\r\n/g)) {
        if (line) {
            let [key, value] = line.split(':')
            encoding[key.trim()] = value.trim()
        }
    }
    return encoding
}

function startReleaseCore() {
    if (fs.existsSync(CORE_PATH)) {
        CoreProcess = cp.spawn(`"${CORE_PATH}" -p ${CorePort}`, {shell: true})
        CoreProcess.stderr.on("data", coreLog)
        CoreProcess.stdout.on("data", coreLog)
        appLog("Core Started")
    } else
        appLog("Core Not Found")
}

function initCore() {
    let devPort = 50000;
    getPort({port: devPort}).then((port) => {
        if (port === devPort) {
            appLog("Using Release Core")
            getPort().then(port => {
                CorePort = port
            }).then(startReleaseCore)
        } else {
            appLog("Using Dev Core")
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
    AppRunning = false
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
    appLog(`Uncaught Exception: ${err}`);
});


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
        filters: [{name: '世界计划翻译文件', extensions: ['txt']}]
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
        filters: [{name: '世界计划数据文件', extensions: ['json', 'asset', 'pjs.txt']}]
    }).then(result => {
        event.sender.send('selected-story', result)
    })
});
ipcMain.on('select-file-exist-translated', function (event) {
    dialog.showOpenDialog({
        title: '选择已翻译文件',
        properties: ['openFile'],
        filters: [{name: '世界计划数据文件', extensions: [ 'txt', 'pjs.txt']}]
    }).then(result => {
        event.sender.send('selected-translated', result)
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
ipcMain.on('save-file-json', function (_, args) {
    dialog.showSaveDialog({
        properties: ['createDirectory',],
        filters: [{name: 'Json文件', extensions: ['json']}]
    }).then(result => {
        if (!result.canceled) {
            fs.writeFile(result.filePath, JSON.stringify(args), err => {
                if (err) appLog(`Save-file-json Error:${err}`)
                else appLog("Save-file-json Successed!")
            })
        }
    })
});

ipcMain.on('select-file-save-translate-new', function (event) {
    dialog.showSaveDialog({
        title: '选择翻译文件保存位置',
        properties: ['createDirectory',],
        filters: [{name: 'SekaiSubtitle翻译文件', extensions: ["pjs.txt"]}]
    }).then(result => {
        event.sender.send('selected-translate-path-new', result)
    })
});
ipcMain.on('select-file-save-translate-legacy', function (event) {
    dialog.showSaveDialog({
        title: '选择翻译文件保存位置',
        properties: ['createDirectory',],
        filters: [{name: 'SekaiSubtitle翻译文件', extensions: ["txt"]}]
    }).then(result => {
        event.sender.send('selected-translate-path-legacy', result)
    })
});
ipcMain.on('save-setting', (_, args) => {
    if (!fs.existsSync(PROGRAM_DIR)) fs.mkdirSync(PROGRAM_DIR)
    if (fs.existsSync(PROGRAM_DIR)) {
        fs.writeFileSync(path.join(PROGRAM_DIR, 'setting.json'), JSON.stringify(args))
        setProxy(args)
    } else {
        alert(`配置文件夹创建失败！`)
    }
})


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
ipcMain.on('notification-show', (_, args: [NotificationOption, string]) => {
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
    event.returnValue = fs.existsSync(CORE_PATH);
    event.sender.send("get-core-exist-result",)
})

ipcMain.on("get-core-url", (event) => {
    event.returnValue = `127.0.0.1:${CorePort}`
})
ipcMain.on("get-core-version", (event) => {
    if (CoreLatestVersion == null)
        axios.get("https://api.github.com/repos/Icexbb/SekaiSubtitle-Core-GO/releases").then(resp => {
            CoreLatestVersion = resp.data[0].tag_name;
            event.sender.send("get-core-version-result", [CORE_VER, CoreLatestVersion])
        }).catch()
    else
        event.sender.send("get-core-version-result", [CORE_VER, CoreLatestVersion])
})
ipcMain.on("get-core-alive", (event) => {
    event.sender.send("get-core-alive-result", CoreConnected)
})

ipcMain.on("get-core-path", (event) => {
    let CorePath = CORE_PATH;
    if (process.platform.includes("win32")) while (CorePath.includes('/')) CorePath = CorePath.replace('/', '\\')
    if (!fs.existsSync(path.dirname(CorePath))) fs.mkdirSync(path.dirname(CorePath))
    event.returnValue = CorePath
})

ipcMain.on("get-asset-path", (event) => {
    let AssetDir: string = path.join(PROGRAM_DIR, "data")
    if (process.platform.includes("win32"))
        while (AssetDir.includes('/'))
            AssetDir = AssetDir.replace('/', '\\')
    if (!fs.existsSync(AssetDir)) fs.mkdirSync(AssetDir)
    event.returnValue = AssetDir
})
ipcMain.on("get-app-version", (event) => {
    if (CoreLatestVersion == null)
        axios.get("https://api.github.com/repos/Icexbb/SekaiSubtitle-electron/releases").then(resp => {
            AppLatestVersion = resp.data[0].tag_name;
            event.sender.send("get-app-version-result", [APP_VER, AppLatestVersion])
        }).catch()
    else
        event.sender.send("get-app-version-result", [APP_VER, AppLatestVersion])
})
ipcMain.on("restart-core", (event) => {
    appLog("Restart Core")
    try {
        if (CoreWebSocket != null) CoreWebSocket.close()
        if (CoreProcess != null) CoreProcess.kill()
        CoreProcess = null;
    } catch (e) {
        appLog(e)
    }
    initCore();
    event.sender.send("restart-core-result", CoreConnected)
    event.returnValue = CoreConnected
})
ipcMain.on("stop-core", (event) => {
    appLog("Close Core")
    try {
        if (CoreWebSocket != null) CoreWebSocket.close()
        if (CoreProcess != null) CoreProcess.kill()
        CoreProcess = null;
    } catch (e) {
        appLog(e)
    }
    event.sender.send("stop-core-result", CoreConnected)
    event.returnValue = CoreProcess == null
})
ipcMain.on("write-new-core", (_, args) => {
    try {
        if (CoreWebSocket != null) CoreWebSocket.close()
        if (CoreProcess != null) CoreProcess.kill()
        CoreProcess = null;
    } catch (e) {
        appLog(e)
    }
    fs.writeFileSync(CORE_PATH, args);
    if (app.isPackaged) app.relaunch();
    app.exit();
})
ipcMain.on("get-task-log", (event, args) => {
    event.returnValue = CoreTaskLogs[args]
})
ipcMain.on("get-task-status", (event) => {
    event.returnValue = CoreTasks
})
ipcMain.on("task-operate", (_, args) => {
    if (CoreWebSocket.readyState == CoreWebSocket.OPEN) {
        CoreWebSocket.send(JSON.stringify({type: args[1], data: args[0]}))
    }
})

ipcMain.on("task-new", (_, args) => {
    if (CoreWebSocket.readyState == CoreWebSocket.OPEN) {
        CoreWebSocket.send(JSON.stringify({
            type: "new",
            data: JSON.stringify({config: JSON.parse(args[0]), runAfterCreate: args[1]})
        }))
    }
})