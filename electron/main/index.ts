import {app, BrowserWindow, shell, ipcMain, dialog, Notification} from 'electron'
import {release} from 'node:os'
import {join} from 'node:path'
import path from 'path';
import cp from 'child_process';
import * as fs from 'fs';

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
const backendBin: string = getExtraResourcesPath(process.platform === 'win32' ? 'core.exe' : 'core.bin');
let backendCP: cp.ChildProcess = null;
// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
    app.quit()
    process.exit(0)
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')
let running = true;


async function createWindow() {
    win = new BrowserWindow({
        title: 'Sekai Subtitle',
        icon: join(process.env.PUBLIC, 'favicon.ico'),
        webPreferences: {
            preload,
            // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
            // Consider using contextBridge.exposeInMainWorld
            // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
            nodeIntegration: true,
            contextIsolation: false,
            sandbox: false
        },
        // frame: false,
        // titleBarStyle: 'hidden'

    })
    win.setMenuBarVisibility(false)


    if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
        win.loadURL(url)
        // Open devTool if the app is not packaged
        win.webContents.openDevTools()
    } else {
        win.loadFile(indexHtml)
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

    fs.stat(backendBin, (err) => {
        if (err) {
            console.log(err)
        } else {
            try {
                backendCP = cp.execFile(backendBin, (error, stdout, stderr) => {
                    if (running) {
                        if (error)
                            console.log('Error:', error);
                        if (stdout)
                            console.log("Stdout:", stdout);
                        if (stderr)
                            console.log("Stderr", stderr);
                    }
                })
            } catch (e) {
                alert(e)
                app.quit()
            }
        }
    })
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => {
    running = false
    win = null
    try {
        backendCP.kill();
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
    if ((typeof args) === 'string') {
        event.sender.send('get-setting-result', setting[args])
    } else if ((typeof args) === 'object') {
        let result = {}
        Object.keys(args).forEach((value) => {
            result[value] = setting[value]
        })
        event.sender.send('get-setting-result', result)
    } else {
        event.sender.send('get-setting-result', setting)
    }
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