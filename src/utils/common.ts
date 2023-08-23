export var systemFonts: string[] = [];
import {getFonts} from 'font-list'

getFonts().then((fonts) => {
    systemFonts = fonts
})

export function ArrSplit(strings: string[]): string[] {
    let result: string[] = []
    strings.forEach(s => {
        let st = s.trim()
        if (st.length > 0) result.push(st)
    })
    return result
}