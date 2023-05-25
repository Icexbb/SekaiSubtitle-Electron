import {app, BrowserWindow, shell, ipcMain, dialog, Notification} from 'electron'
import {release} from 'node:os'
import {join} from 'node:path'
import path from 'path';
import cp from 'child_process';
import * as fs from 'fs';

const WebSocket = require('ws')
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
const CoreBin: string = getExtraResourcesPath(process.platform === 'win32' ? 'core.exe' : 'core.bin');
const CoreVersion = cp.execSync(`"${CoreBin}" -v`).toString()
const AppVersion = require(getExtraResourcesPath(app.isPackaged ? "package.json" : "../package.json")).version;
let CoreProcess: cp.ChildProcess = null;
let CoreConnected = false;
let CoreAliveSocket = null;

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


    if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
        await win.loadURL(url)
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
    win.webContents.on('will-navigate', (event, url) => {
    }) // #344
}

function initSocket() {
    CoreAliveSocket = new WebSocket('ws://localhost:50000/alive')

    CoreAliveSocket.onopen = () => {
        console.log("WebSocket Connected")
        CoreConnected = true;
        CoreAliveSocket.send(JSON.stringify({type: "alive"}));
    }
    CoreAliveSocket.onclose = () => {
        CoreConnected = false;
        if (running) setTimeout(initSocket, 500);
    }
    CoreAliveSocket.onmessage = () => {
        if (!CoreConnected) CoreConnected = true;
        CoreAliveSocket.send(JSON.stringify({type: "alive"}));
    }
    CoreAliveSocket.onerror = (res) => {
        CoreConnected = false;
        console.log('WebSocket Error');
    }
}

let CoreLogs: string[] = [];

function appendLog(data: Buffer) {
    let logString = data.toString()
    let logArr = logString.split('\n')
        .map(value => value.replace('\r', ""))
    let logSet = new Set<string>(logArr)
    Array.from(logSet).forEach(value => {
        if (value.length) {
            CoreLogs.push(value);
        }
    })
}

app.whenReady().then(() => {
    if (fs.existsSync(CoreBin)) {
        CoreProcess = cp.spawn(`"${CoreBin}"`, {shell: true})
        CoreProcess.stderr.on("data", appendLog)

    }
}).then(() => {
    setTimeout(initSocket, 1500)
}).then(createWindow)
app.on('window-all-closed', () => {
    running = false
    win = null
    try {
        CoreProcess.kill();
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
        createWindow().then(r => {
        })
    }
})

process.on('uncaughtException', function (err) {
    console.log(err);
});

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
        childWindow.loadURL(`${url}#${arg}`).then(r => {
        })
    } else {
        childWindow.loadFile(indexHtml, {hash: arg}).then(r => {
        })
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
    if (!fs.existsSync(PROGRAM_DIR)) {
        fs.mkdir(PROGRAM_DIR, (err) => {
            if (err) console.log(err)
        })
    }
    if (fs.existsSync(PROGRAM_DIR)) {
        fs.writeFile(path.join(PROGRAM_DIR, 'setting.json'), JSON.stringify(args), err => {
            if (err) {
                console.log(err);
                alert(`设置文件保存失败:${err}`)
            }
        })
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

interface NotificationOption {
    title: string,
    body: string
}

ipcMain.on('notification-show', (event, args: [NotificationOption, string]) => {
    const notification = new Notification(args[0])
    notification.on("click", (event) => {
        shell.showItemInFolder(process.platform === "win32" ? args[1].replace('/', '\\') : args[1])
        require('child_process').exec(`explorer.exe /select,${args[1]}`)
    })
    notification.show()
})

ipcMain.on("get-core-logs", (event) => {
    event.sender.send('get-core-logs-result', CoreLogs)
})
ipcMain.on("get-core-version", (event) => {
    event.sender.send("get-core-version-result", CoreVersion)
})

ipcMain.on("get-core-alive", (event) => {
    event.sender.send("get-core-alive-result", CoreConnected)
})

ipcMain.on("get-app-version", (event) => {
    event.sender.send("get-app-version-result", AppVersion)
})