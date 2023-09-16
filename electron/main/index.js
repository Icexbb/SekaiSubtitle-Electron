var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { app, BrowserWindow, dialog, ipcMain, Notification, shell } from 'electron';
import { release } from 'node:os';
import { join } from 'node:path';
import path from 'path';
import cp from 'child_process';
import * as fs from 'fs';
import getPort from "./port";
import axios from "axios";
import WebSocket from 'ws';
import sudo from "@kerin/sudo-prompt";
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
process.env.DIST_ELECTRON = join(__dirname, '..');
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist');
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
    ? join(process.env.DIST_ELECTRON, '../public')
    : process.env.DIST;
var EXECUTABLE_EXT = process.platform === 'win32' ? "exe" : "bin";
var USER_HOME = process.env.HOME || process.env.USERPROFILE;
var PROGRAM_DIR = process.platform === 'win32'
    ? path.join(USER_HOME, 'Documents', 'SekaiSubtitle')
    : path.join(USER_HOME, 'SekaiSubtitle');
var CORE_PATH = app.isPackaged
    ? path.join(process.resourcesPath, "../core.".concat(EXECUTABLE_EXT))
    : path.join(__dirname, "../../lib/".concat(process.platform, "/core.").concat(EXECUTABLE_EXT));
var APP_VER = JSON.parse(fs.readFileSync(path.join(__dirname, "../../package.json")).toString()).version;
var CORE_VER = (fs.existsSync(CORE_PATH)) ? cp.execSync("\"".concat(CORE_PATH, "\" -v")).toString() : "";
// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1'))
    app.disableHardwareAcceleration();
// Set application name for Windows 10+ notifications
if (process.platform === 'win32')
    app.setAppUserModelId(app.getName());
if (!app.requestSingleInstanceLock()) {
    app.quit();
    process.exit(0);
}
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
var win = null;
// Here, you can also use other preload
var preload = join(__dirname, '../preload/index.js');
var url = process.env.VITE_DEV_SERVER_URL;
var indexHtml = join(process.env.DIST, 'index.html');
var AppLatestVersion;
var AppRunning = true;
var AppLogs = [];
var CoreLatestVersion;
var CoreProcess = null;
var CorePort = null;
var CoreConnected = false;
var CoreWebSocket = null;
var CoreLogs = [];
var CoreTaskLogs = {};
var CoreTasks = {};
function createWindow() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    win = new BrowserWindow({
                        title: 'Sekai Subtitle',
                        icon: join(process.env.PUBLIC, 'favicon.ico'),
                        webPreferences: {
                            preload: preload,
                            nodeIntegration: true,
                            contextIsolation: false,
                            sandbox: false,
                            webSecurity: false,
                        },
                        // frame: false,
                        // titleBarStyle: 'hidden'
                    });
                    win.setMenuBarVisibility(false);
                    if (!!app.isPackaged) return [3 /*break*/, 2];
                    return [4 /*yield*/, win.loadURL("http://127.0.0.1:50023")
                        // Open devTool if the app is not packaged
                    ];
                case 1:
                    _a.sent();
                    // Open devTool if the app is not packaged
                    win.webContents.openDevTools();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, win.loadFile(indexHtml)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    // Test actively push message to the Electron-Renderer
                    win.webContents.on('did-finish-load', function () {
                        win === null || win === void 0 ? void 0 : win.webContents.send('main-process-message', new Date().toLocaleString());
                    });
                    // Make all links open with the browser, not with the application
                    win.webContents.setWindowOpenHandler(function (_a) {
                        var url = _a.url;
                        if (url.startsWith('https:'))
                            shell.openExternal(url);
                        return { action: 'deny' };
                    });
                    return [2 /*return*/];
            }
        });
    });
}
function appLog(message) {
    AppLogs.push(message);
    if (!app.isPackaged)
        console.log(message);
}
function coreLog(data) {
    var iconv = require('iconv-lite');
    var encoding = getEncoding();
    var logString = iconv.decode(data, encoding['WebName']);
    var logArr = logString.split('\n')
        .map(function (value) { return value.replace('\r', ""); });
    var logSet = new Set(logArr);
    Array.from(logSet).forEach(function (value) {
        if (value.length) {
            CoreLogs.push(value);
        }
    });
}
function setProxy(setting) {
    switch (setting['proxy']) {
        case null:
            win.webContents.session.setProxy({ mode: 'direct' }).then();
            break;
        case "system":
            win.webContents.session.setProxy({ mode: 'system' }).then();
            break;
        default:
            win.webContents.session.setProxy({ mode: 'fixed_servers', proxyRules: setting['proxy'] }).then();
    }
}
function initSocket() {
    CoreWebSocket = new WebSocket("ws://127.0.0.1:".concat(CorePort, "/"));
    CoreWebSocket.onopen = function () {
        appLog("WebSocket Connected");
        CoreConnected = true;
        CoreWebSocket.send(JSON.stringify({ type: "alive" }));
    };
    CoreWebSocket.onclose = function () {
        CoreConnected = false;
        if (fs.existsSync(CORE_PATH) && CoreProcess && AppRunning) {
            setTimeout(initSocket, 1500);
        }
        CoreTasks = [];
        CoreTaskLogs = {};
    };
    CoreWebSocket.onmessage = function (m) {
        if (!CoreConnected)
            CoreConnected = true;
        var msg = JSON.parse(m.data);
        switch (msg.type) {
            case "log":
                var msgData = JSON.parse(msg.data);
                var taskId = msgData.id;
                var taskLog = msgData.message;
                if (CoreTaskLogs.hasOwnProperty(taskId)) {
                    CoreTaskLogs[taskId] = __spreadArray(__spreadArray([], CoreTaskLogs[taskId], true), [taskLog], false);
                }
                else {
                    CoreTaskLogs[taskId] = [taskLog];
                }
                win.webContents.send("task-log-".concat(taskId), taskLog);
                break;
            case "tasks":
                CoreTasks = JSON.parse(msg.data);
                win.webContents.send("task-status-change", CoreTasks);
                break;
            case "alive":
                setTimeout(function () {
                    CoreWebSocket.send(JSON.stringify({ type: "alive" }));
                }, 500);
                break;
        }
    };
    CoreWebSocket.onerror = function (res) {
        if (!fs.existsSync(CORE_PATH)) {
            CoreConnected = false;
            //TODO
        }
        else {
            CoreConnected = false;
            appLog("WebSocket Error: ".concat(Object.keys(res)));
        }
    };
}
function getEncoding() {
    var stdout = cp.execSync('powershell [System.Text.Encoding]::Default');
    var strEncoding = stdout.toString();
    var encoding = {};
    for (var _i = 0, _a = strEncoding.split(/\r\n/g); _i < _a.length; _i++) {
        var line = _a[_i];
        if (line) {
            var _b = line.split(':'), key = _b[0], value = _b[1];
            encoding[key.trim()] = value.trim();
        }
    }
    return encoding;
}
function startReleaseCore() {
    if (fs.existsSync(CORE_PATH)) {
        CoreProcess = cp.spawn("\"".concat(CORE_PATH, "\" -p ").concat(CorePort), { shell: true });
        CoreProcess.stderr.on("data", coreLog);
        CoreProcess.stdout.on("data", coreLog);
        appLog("Core Started");
    }
    else
        appLog("Core Not Found");
}
function initCore() {
    var devPort = 50000;
    getPort({ port: devPort }).then(function (port) {
        if (port === devPort) {
            appLog("Using Release Core");
            getPort().then(function (port) {
                CorePort = port;
            }).then(startReleaseCore);
        }
        else {
            appLog("Using Dev Core");
            CorePort = 50000;
        }
    }).finally(function () {
        setTimeout(initSocket, 1500);
    });
}
app.whenReady().then(createWindow).then(initCore).then(function () {
    var setting = fs.existsSync(path.join(PROGRAM_DIR, 'setting.json'))
        ? JSON.parse(fs.readFileSync(path.join(PROGRAM_DIR, 'setting.json')).toString())
        : {};
    setProxy(setting);
}).then(updateNameTranslation);
app.on('window-all-closed', function () {
    AppRunning = false;
    win = null;
    try {
        CoreWebSocket.close();
        if (CoreProcess)
            CoreProcess.kill();
    }
    finally {
        app.quit();
    }
});
app.on('second-instance', function () {
    if (win) {
        // Focus on the main window if the user tried to open another
        if (win.isMinimized())
            win.restore();
        win.focus();
    }
});
app.on('activate', function () {
    var allWindows = BrowserWindow.getAllWindows();
    if (allWindows.length) {
        allWindows[0].focus();
    }
    else {
        createWindow().then(function () {
        });
    }
});
process.on('uncaughtException', function (err) {
    appLog("Uncaught Exception: ".concat(err));
});
ipcMain.handle('open-win', function (_, arg) {
    var childWindow = new BrowserWindow({
        webPreferences: {
            preload: preload,
            nodeIntegration: true,
            contextIsolation: false,
        },
    });
    if (process.env.VITE_DEV_SERVER_URL) {
        childWindow.loadURL("".concat(url, "#").concat(arg)).then();
    }
    else {
        childWindow.loadFile(indexHtml, { hash: arg }).then();
    }
});
ipcMain.on('select-file-exist-video', function (event) {
    dialog.showOpenDialog({
        title: '选择视频文件',
        properties: ['openFile',],
        filters: [{ name: 'Movies', extensions: ['mkv', 'avi', 'mp4', "wmv"] }]
    }).then(function (result) {
        event.sender.send('selected-video', result);
    });
});
ipcMain.on('select-file-exist-json', function (event) {
    dialog.showOpenDialog({
        title: '选择数据文件',
        properties: ['openFile'],
        filters: [{ name: '世界计划数据文件', extensions: ['json', 'asset'] }]
    }).then(function (result) {
        event.sender.send('selected-json', result);
    });
});
ipcMain.on('select-file-exist-translate', function (event) {
    dialog.showOpenDialog({
        title: '选择翻译文件',
        properties: ['openFile',],
        filters: [{ name: '世界计划翻译文件', extensions: ['txt'] }]
    }).then(function (result) {
        event.sender.send('selected-translate', result);
    });
});
ipcMain.on('select-file-save-subtitle', function (event) {
    dialog.showSaveDialog({
        title: '选择字幕文件保存位置',
        properties: ['createDirectory',],
        filters: [{ name: 'Movies', extensions: ['mkv', 'avi', 'mp4', "wmv"] }]
    }).then(function (result) {
        event.sender.send('selected-subtitle-path', result);
    });
});
ipcMain.on('select-file-exist-story', function (event) {
    dialog.showOpenDialog({
        title: '选择数据文件',
        properties: ['openFile'],
        filters: [{ name: '世界计划数据文件', extensions: ['json', 'asset', 'pjs.txt'] }]
    }).then(function (result) {
        event.sender.send('selected-story', result);
    });
});
ipcMain.on('select-file-exist-translated', function (event) {
    dialog.showOpenDialog({
        title: '选择已翻译文件',
        properties: ['openFile'],
        filters: [{ name: '世界计划数据文件', extensions: ['txt', 'pjs.txt'] }]
    }).then(function (result) {
        event.sender.send('selected-translated', result);
    });
});
ipcMain.on('read-file-json', function (event) {
    dialog.showOpenDialog({
        title: '选择文件',
        properties: ['openFile'],
        filters: [{ name: 'Json文件', extensions: ['json'] }]
    }).then(function (result) {
        event.sender.send('read-file-json-result', result);
    });
});
ipcMain.on('save-file-json', function (_, args) {
    dialog.showSaveDialog({
        properties: ['createDirectory',],
        filters: [{ name: 'Json文件', extensions: ['json'] }]
    }).then(function (result) {
        if (!result.canceled) {
            fs.writeFile(result.filePath, JSON.stringify(args), function (err) {
                if (err)
                    appLog("Save-file-json Error:".concat(err));
                else
                    appLog("Save-file-json Successed!");
            });
        }
    });
});
ipcMain.on('select-file-save-translate-new', function (event) {
    dialog.showSaveDialog({
        title: '选择翻译文件保存位置',
        properties: ['createDirectory',],
        filters: [{ name: 'SekaiSubtitle翻译文件', extensions: ["pjs.txt"] }]
    }).then(function (result) {
        event.sender.send('selected-translate-path-new', result);
    });
});
ipcMain.on('select-file-save-translate-legacy', function (event) {
    dialog.showSaveDialog({
        title: '选择翻译文件保存位置',
        properties: ['createDirectory',],
        filters: [{ name: 'SekaiSubtitle翻译文件', extensions: ["txt"] }]
    }).then(function (result) {
        event.sender.send('selected-translate-path-legacy', result);
    });
});
function defaultSetting() {
    return {
        ProxyScheme: 'none',
        ProxyHost: "127.0.0.1",
        ProxyPort: 1080,
        proxy: null,
        SubtitleAlwaysOverwrite: true,
        SubtitleRunAfterCreate: false,
        SubtitleTyperFade: 50,
        SubtitleTyperInterval: 80,
        SubtitleCustomFontSettable: false
    };
}
ipcMain.on("default-setting", function (event) {
    event.returnValue = defaultSetting();
    event.sender.send('default-setting', defaultSetting());
});
ipcMain.on('save-setting', function (_, args) {
    if (!fs.existsSync(PROGRAM_DIR))
        fs.mkdirSync(PROGRAM_DIR);
    if (fs.existsSync(PROGRAM_DIR)) {
        fs.writeFileSync(path.join(PROGRAM_DIR, 'setting.json'), JSON.stringify(args));
        setProxy(args);
    }
    else {
        alert("\u914D\u7F6E\u6587\u4EF6\u5939\u521B\u5EFA\u5931\u8D25\uFF01");
    }
});
ipcMain.on('get-setting', function (event, args) {
    var setting = fs.existsSync(path.join(PROGRAM_DIR, 'setting.json'))
        ? JSON.parse(fs.readFileSync(path.join(PROGRAM_DIR, 'setting.json')).toString())
        : function () {
            var defaults = defaultSetting();
            if (!fs.existsSync(PROGRAM_DIR))
                fs.mkdirSync(PROGRAM_DIR);
            if (fs.existsSync(PROGRAM_DIR)) {
                fs.writeFileSync(path.join(PROGRAM_DIR, 'setting.json'), JSON.stringify(defaults));
            }
            return defaults;
        };
    var result;
    if ((typeof args) === 'string') {
        result = setting[args];
        event.sender.send('get-setting-result', setting[args]);
    }
    else if ((typeof args) === 'object') {
        result = {};
        Object.keys(args).forEach(function (value) {
            result[value] = setting[value];
        });
    }
    else {
        result = setting;
    }
    event.sender.send('get-setting-result', result);
    event.returnValue = result;
});
ipcMain.on('drag-start', function (event, filePath) {
    event.sender.startDrag({
        file: filePath,
        icon: path.join(__dirname, '../../public/DragDrop.png')
    });
    event.sender.send('drag-finished');
});
ipcMain.on('notification-show', function (_, args) {
    var notification = new Notification(args[0]);
    var targetPath = args[1];
    if (process.platform.includes("win32")) {
        while (targetPath.includes('/')) {
            targetPath = targetPath.replace('/', '\\');
        }
    }
    notification.on("click", function () {
        shell.showItemInFolder(targetPath);
    });
    notification.show();
});
ipcMain.on("get-core-logs", function (event) {
    event.sender.send('get-core-logs-result', CoreLogs);
});
ipcMain.on("get-core-exist", function (event) {
    event.returnValue = fs.existsSync(CORE_PATH);
    event.sender.send("get-core-exist-result");
});
ipcMain.on("get-core-url", function (event) {
    event.returnValue = "127.0.0.1:".concat(CorePort);
});
ipcMain.on("get-core-version", function (event) {
    if (CoreLatestVersion == null)
        axios.get("https://api.github.com/repos/Icexbb/SekaiSubtitle-Core-GO/releases").then(function (resp) {
            CoreLatestVersion = resp.data[0].tag_name;
            event.sender.send("get-core-version-result", [CORE_VER, CoreLatestVersion]);
        }).catch();
    else
        event.sender.send("get-core-version-result", [CORE_VER, CoreLatestVersion]);
});
ipcMain.on("get-core-alive", function (event) {
    event.sender.send("get-core-alive-result", CoreConnected);
});
ipcMain.on("get-core-path", function (event) {
    var CorePath = CORE_PATH;
    if (process.platform.includes("win32"))
        while (CorePath.includes('/'))
            CorePath = CorePath.replace('/', '\\');
    if (!fs.existsSync(path.dirname(CorePath)))
        fs.mkdirSync(path.dirname(CorePath));
    event.returnValue = CorePath;
});
ipcMain.on("get-asset-path", function (event) {
    var AssetDir = path.join(PROGRAM_DIR, "data");
    if (process.platform.includes("win32"))
        while (AssetDir.includes('/'))
            AssetDir = AssetDir.replace('/', '\\');
    if (!fs.existsSync(AssetDir))
        fs.mkdirSync(AssetDir);
    event.returnValue = AssetDir;
});
ipcMain.on("get-app-version", function (event) {
    if (CoreLatestVersion == null)
        axios.get("https://api.github.com/repos/Icexbb/SekaiSubtitle-electron/releases").then(function (resp) {
            AppLatestVersion = resp.data[0].tag_name;
            event.sender.send("get-app-version-result", [APP_VER, AppLatestVersion]);
        }).catch();
    else
        event.sender.send("get-app-version-result", [APP_VER, AppLatestVersion]);
});
ipcMain.on("restart-core", function (event) {
    appLog("Restart Core");
    try {
        if (CoreWebSocket != null)
            CoreWebSocket.close();
        if (CoreProcess != null)
            CoreProcess.kill();
        CoreProcess = null;
    }
    catch (e) {
        appLog(e);
    }
    initCore();
    event.sender.send("restart-core-result", CoreConnected);
    event.returnValue = CoreConnected;
});
ipcMain.on("stop-core", function (event) {
    appLog("Close Core");
    try {
        if (CoreWebSocket != null)
            CoreWebSocket.close();
        if (CoreProcess != null)
            CoreProcess.kill();
        CoreProcess = null;
    }
    catch (e) {
        appLog(e);
    }
    event.sender.send("stop-core-result", CoreConnected);
    event.returnValue = CoreProcess == null;
});
ipcMain.on("write-new-core", function (_, args) {
    var tmpPath = path.join(app.getPath('temp'), 'core.exe').replace('/', '\\');
    var dirPath = path.dirname(CORE_PATH).replace('/', '\\');
    if (fs.existsSync(tmpPath))
        fs.unlinkSync(tmpPath);
    fs.writeFile(tmpPath, args, null, function () {
        try {
            if (CoreWebSocket != null)
                CoreWebSocket.close();
            if (CoreProcess != null)
                CoreProcess.kill();
            CoreProcess = null;
        }
        catch (e) {
            appLog(e);
        }
        finally {
            sudo.exec("del \"".concat(CORE_PATH, "\" /f && xcopy \"").concat(tmpPath, "\" \"").concat(dirPath, "\" /Y && del \"").concat(tmpPath, "\" /f"), { name: 'Sekai Subtitle' }, function () {
                if (app.isPackaged) {
                    app.relaunch();
                    app.exit(0);
                }
            });
        }
    });
});
ipcMain.on("get-task-log", function (event, args) {
    event.returnValue = CoreTaskLogs[args];
});
ipcMain.on("get-task-status", function (event) {
    event.returnValue = CoreTasks;
});
ipcMain.on("task-operate", function (_, args) {
    if (CoreWebSocket.readyState == CoreWebSocket.OPEN) {
        CoreWebSocket.send(JSON.stringify({ type: args[1], data: args[0] }));
    }
});
ipcMain.on("task-new", function (_, args) {
    if (CoreWebSocket.readyState == CoreWebSocket.OPEN) {
        CoreWebSocket.send(JSON.stringify({
            type: "new",
            data: JSON.stringify({ config: JSON.parse(args[0]), runAfterCreate: args[1] })
        }));
    }
});
function updateNameTranslation() {
    return __awaiter(this, void 0, void 0, function () {
        var url, filepath, resp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = "https://gist.githubusercontent.com/Icexbb/a973047364266e600dcc9db71417f431/raw/prsk_name_translation_jp_cn.json";
                    filepath = path.join(PROGRAM_DIR, "prsk_name_translation_jp_cn.json");
                    return [4 /*yield*/, axios.get(url)];
                case 1:
                    resp = _a.sent();
                    fs.writeFileSync(filepath, JSON.stringify(resp.data));
                    return [2 /*return*/];
            }
        });
    });
}
ipcMain.on("update-name-translation", function (event) {
    event.returnValue = updateNameTranslation();
});
ipcMain.on("get-name-translation", function (event) {
    var filepath = path.join(PROGRAM_DIR, "prsk_name_translation_jp_cn.json");
    var data = {};
    if (fs.existsSync(filepath))
        data = JSON.parse(fs.readFileSync(filepath, "utf8"));
    event.returnValue = data;
    event.sender.send("name-translation", data);
});
