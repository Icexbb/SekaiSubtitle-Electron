import { ipcRenderer } from "electron";

export var systemFonts: string[] = [];

// 获取系统字体列表
ipcRenderer.send('get-system-font');
ipcRenderer.on('system-font', (e, fonts: string[] = []) => {
    systemFonts = fonts;
});
