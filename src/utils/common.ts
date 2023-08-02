import { ipcRenderer } from "electron";

export var systemFonts: string[] = [];

// 获取系统字体列表
ipcRenderer.send('get-system-font');
ipcRenderer.on('system-font', (e, fonts: string[] = []) => {
    systemFonts = fonts;
});

export function ArrSplit(strings: string[]): string[] {
    let result:string[] = []
    strings.forEach(s => {
        let st = s.trim()
        if (st.length > 0)result.push(st)
    })
	return result
}