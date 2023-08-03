import * as fs from 'fs';
import {ArrSplit} from "./common"

const C2Did_to_Cid = {
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    11: 11,
    12: 12,
    13: 13,
    14: 14,
    15: 15,
    16: 16,
    17: 17,
    18: 18,
    19: 19,
    20: 20,
    21: 21,
    22: 21,
    23: 21,
    24: 21,
    25: 21,
    26: 21,
    27: 22,
    28: 23,
    29: 24,
    30: 25,
    31: 26,
    32: 1,
    33: 2,
    34: 3,
    35: 4,
    36: 5,
    37: 6,
    38: 7,
    39: 8,
    40: 9,
    41: 10,
    42: 11,
    43: 12,
    44: 13,
    45: 14,
    46: 15,
    47: 16,
    48: 17,
    49: 18,
    50: 19,
    51: 20,
    52: 21,
    53: 22,
    54: 23,
    55: 24,
    57: 26,
    58: 27,
    59: 28,
    60: 29,
    61: 30,
    62: 31,
    63: 32,
    64: 33,
    65: 34,
    66: 35,
    67: 36,
    68: 37,
    69: 38,
    70: 39,
    71: 40,
    72: 41,
    73: 42,
    74: 43,
    75: 44,
    76: 45,
    77: 46,
    78: 47,
    79: 48,
    80: 49,
    81: 50,
    82: 51,
    83: 52,
    84: 53,
    85: 54,
    86: 55,
    87: 56,
    88: 57,
    89: 58,
    90: 59,
    91: 60,
    92: 61,
    93: 62,
    94: 63,
    95: 64,
    96: 65,
    97: 66,
    98: 67,
    99: 68,
    100: 69,
    101: 70,
    102: 71,
    103: 72,
    104: 73,
    105: 74,
    106: 75,
    107: 22,
    108: 23,
    109: 76,
    110: 77,
    111: 78,
    112: 79,
    113: 7,
    114: 25,
    115: 15,
    116: 80,
    117: 13,
    118: 25,
    119: 24,
    120: 22,
    121: 22,
    122: 81,
    123: 82,
    124: 83,
    125: 84,
    126: 13,
    127: 2,
    128: 24,
    129: 85,
    130: 25,
    131: 86,
    132: 87,
    133: 26,
    134: 25,
    135: 88,
    136: 89,
    137: 17,
    138: 24,
    139: 22,
    140: 90,
    141: 11,
    142: 91,
    143: 23,
    144: 4,
    145: 8,
    146: 18,
    147: 26,
    148: 16,
    149: 23,
    150: 22,
    151: 23,
    152: 24,
    153: 24,
    154: 25,
    155: 26,
    156: 21,
    157: 26,
    158: 92,
    159: 93,
    160: 25,
    161: 22,
    162: 23,
    163: 23,
    164: 24,
    165: 22,
    166: 23,
    167: 24,
    168: 25,
    169: 26,
    170: 94,
    171: 95,
    172: 1,
    173: 2,
    174: 3,
    175: 4,
    176: 21,
    177: 22,
    178: 23,
    179: 24,
    180: 25,
    181: 26,
    182: 5,
    183: 5,
    184: 6,
    185: 6,
    186: 7,
    187: 7,
    188: 8,
    189: 8,
    190: 21,
    191: 21,
    192: 22,
    193: 22,
    194: 23,
    195: 23,
    196: 24,
    197: 24,
    198: 25,
    199: 25,
    200: 26,
    201: 26,
    202: 17,
    203: 18,
    204: 19,
    205: 20,
    206: 21,
    207: 22,
    208: 24,
    209: 25,
    210: 96,
    211: 97,
    212: 98,
    213: 99,
    214: 100,
    215: 101,
    216: 102,
    217: 103,
    218: 104,
    219: 22,
    220: 22,
    221: 22,
    222: 22,
    223: 22,
    224: 23,
    225: 23,
    226: 23,
    227: 23,
    228: 24,
    229: 24,
    230: 24,
    231: 24,
    232: 24,
    233: 25,
    234: 25,
    235: 25,
    236: 25,
    237: 25,
    238: 26,
    239: 26,
    240: 26,
    241: 26,
    248: 105,
    249: 106,
    250: 107,
    251: 108,
    252: 23,
    253: 10,
    254: 109,
    255: 110,
    256: 111,
    257: 6,
    258: 80,
    259: 113,
    260: 114,
    261: 115,
    262: 26,
    263: 116,
    264: 17,
    265: 21,
    266: 22,
    267: 23,
    268: 24,
    269: 25,
    270: 26,
    271: 116,
    272: 118,
    273: 119,
    274: 120,
    275: 121,
    276: 122,
    900000: 900000,
}

class VoiceData {
    Character2dId: number
    VoiceId: string
    CharacterId: number

    constructor(obj: object) {
        this.Character2dId = obj['Character2dId']
        this.VoiceId = obj["VoiceId"]
        this.CharacterId = this.GetCharacterId()
    }

    GetCharacterId() {
        let l2dCid = C2Did_to_Cid[this.Character2dId]
        if (l2dCid >= 1 && l2dCid <= 26) {
            return l2dCid
        }
        let VoiceIdParts = this.VoiceId.split("_")
        let ns: number[] = []
        VoiceIdParts.forEach(p => {
            let num = parseInt(p);
            if (num != 0) {
                ns.push(num)
            }
        })
        if (ns.length > 0) {
            return ns[ns.length - 1]
        }
        return 0
    }
}

class SnippetItem {
    Action: number

    constructor(obj: object) {
        this.Action = obj["Action"]
    }
}

class TalkDataItem {
    WindowDisplayName: string
    Body: string
    WhenFinishCloseWindow: number
    Voices: VoiceData[]

    constructor(obj: object) {
        this.WindowDisplayName = obj["WindowDisplayName"];
        this.Body = obj["Body"];
        this.WhenFinishCloseWindow = obj["WhenFinishCloseWindow"];
        this.Voices = [];
        (obj['Voices'] as object[]).forEach((value) => {
            this.Voices.push(new VoiceData(value))
        })
    }

    CharacterId(): number {
        if (this.Voices.length == 1) {
            let cid = this.Voices[0].CharacterId
            if (cid >= 0 || cid <= 26) return cid
        }
        return 0
    }
}

class SpecialEffectDataItem {
    EffectType: number
    StringVal: string

    constructor(obj: object) {
        this.EffectType = obj["EffectType"]
        this.StringVal = obj["StringVal"]
    }
}

export class GameStoryData {
    TalkData: TalkDataItem[]
    Snippets: SnippetItem[]
    SpecialEffectData: SpecialEffectDataItem[]

    constructor(obj: object) {
        this.TalkData = []
        this.Snippets = []
        this.SpecialEffectData = []
        if (obj["TalkData"]) {
            (obj["TalkData"] as object[]).forEach(item => {
                this.TalkData.push(new TalkDataItem(item))
            })
        }
        if (obj["Snippets"]) {
            (obj["Snippets"] as object[]).forEach(item => {
                this.Snippets.push(new SnippetItem(item))
            })
        }
        if (obj["SpecialEffectData"]) {
            (obj["SpecialEffectData"] as object[]).forEach(item => {
                this.SpecialEffectData.push(new SpecialEffectDataItem(item))
            })
        }

        if (!this.empty()) {
            let seCount: number = 0;
            let sn: SnippetItem[] = [];
            this.Snippets.forEach(item => {
                if (item.Action == 1) {
                    sn.push(item)
                } else if (item.Action == 6) {
                    let seData = this.SpecialEffectData[seCount]
                    if (seData.EffectType == 8 || seData.EffectType == 18) {
                        sn.push(item)
                    }
                    seCount += 1
                }
            })
            this.Snippets = sn
            let se: SpecialEffectDataItem[] = []
            this.SpecialEffectData.forEach(item => {
                if (item.EffectType == 8 || item.EffectType == 18) {
                    se.push(item)
                }
            })
            this.SpecialEffectData = se
        }
    }

    static FromFile(filepath: string): GameStoryData {
        let obj = {}
        if (fs.existsSync(filepath)) {
            obj = JSON.parse(fs.readFileSync(filepath, "utf-8"))
        }
        return new GameStoryData(obj)
    }

    empty() {
        return this.TalkData.length + this.Snippets.length + this.SpecialEffectData.length == 0
    }
}

class DialogTranslate {
    Chara: string
    Body: string

    constructor(Chara: string, Body: string) {
        this.Chara = Chara
        this.Body = Body
    }
}

class EffectTranslate {
    Body: string

    constructor(Body: string) {
        this.Body = Body
    }
}

export class TranslateData {
    Dialogs: DialogTranslate[]
    Effects: EffectTranslate[]

    constructor(Dialogs: DialogTranslate[], Effects: EffectTranslate[]) {
        this.Dialogs = Dialogs
        this.Effects = Effects
    }

    static FromFile(file: string) {
        let Dialogs: DialogTranslate[] = []
        let Effects: EffectTranslate[] = []
        if (fs.existsSync(file)) {
            let content: string = fs.readFileSync(file, "utf8")
            let contents: string[] = content.split("\n")
            contents = ArrSplit(contents)
            let DialogReg = /^([^：]+)：(.*)$/
            contents.forEach(item => {
                let match = DialogReg.exec(item)
                if (match != null) Dialogs.push(new DialogTranslate(match[1], match[2]))
                else Effects.push(new EffectTranslate(item))
            })
        }
        return new TranslateData(Dialogs, Effects)
    }

    empty(): boolean {
        return this.Dialogs.length + this.Effects.length == 0
    }
}

class EventContent {
    Body: string
    Character: string

    constructor(Body: string, Character: string) {
        this.Body = Body
        this.Character = Character
    }
}

export class StoryEvent {
    Type: string
    CharacterId: number
    CharacterO: string
    CharacterT: string
    ContentO: string
    ContentT: string

    constructor(Type: string, CharacterId?: number,
                CharacterO?: string, CharacterT?: string,
                ContentO?: string, ContentT?: string) {
        this.Type = Type
        this.CharacterId = CharacterId != undefined ? CharacterId : 0
        this.CharacterO = CharacterO != undefined ? CharacterO : ""
        this.CharacterT = CharacterT != undefined ? CharacterT : ""
        this.ContentO = ContentO != undefined ? ContentO : ""
        this.ContentT = ContentT != undefined ? ContentT : ""
    }

    static fromString(s: string): StoryEvent {
        let sArr: string[] = s.split(",")
        return new StoryEvent(sArr[0], Number(sArr[1]), sArr[2], sArr[3], sArr[4], sArr[5],)
    }


    content(): EventContent {
        return new EventContent(
            this.ContentT.length > 0 ? this.ContentT : this.ContentO,
            this.CharacterT.length > 0 ? this.CharacterT : this.CharacterO,
        )
    }

    String(): string {
        return `${this.Type},${this.CharacterId.toFixed().padStart(2, '0')},${this.CharacterO},${this.CharacterT},` +
            `${this.ContentO.replaceAll("\n", "\\N")},${this.ContentT.replaceAll("\n", "\\N")}`
    }

}

export class StoryEventSet {
    data: StoryEvent[]

    constructor(data: StoryEvent[]) {
        this.data = data
    }

    static FromFile(filepath: string): StoryEventSet {
        let data: StoryEvent[] = []
        if (fs.existsSync(filepath)) {
            let fileContent = fs.readFileSync(filepath, 'utf-8')
            let contentArr = fileContent.split("\n")
            contentArr.forEach(item => {
                if (item.length > 0) {
                    data.push(StoryEvent.fromString(item))
                }
            })
        }

        return new StoryEventSet(data)
    }

    static FromLegacy(jsonData: GameStoryData, translateData?: TranslateData): StoryEventSet {
        let data: StoryEvent[] = []

        if (!jsonData.empty()) {
            let dialogCount: number = 0
            let effectCount: number = 0
            jsonData.Snippets.forEach(snippet => {
                if (snippet.Action == 1) {
                    let dialogData = jsonData.TalkData[dialogCount]
                    if (dialogCount < jsonData.TalkData.length) {
                        let item = new StoryEvent(
                            "Dialog",
                            dialogData.CharacterId(),
                            dialogData.WindowDisplayName, "",
                            dialogData.Body.replaceAll("\n", "\\N"), ""
                        )
                        data.push(item)
                        if (dialogData.WhenFinishCloseWindow == 1) {
                            data.push(new StoryEvent("Period"))
                        }
                    }
                    dialogCount += 1
                }
                if (snippet.Action == 6) {
                    let effectData = jsonData.SpecialEffectData[effectCount]
                    let t: string = ""
                    if (effectData.EffectType == 8) {
                        t = "Banner"
                    }
                    if (effectData.EffectType == 18) {
                        t = "Marker"
                    }
                    data.push(new StoryEvent(t, 0, "", "", effectData.StringVal))
                    effectCount += 1
                }
            })
        }
        let result = new StoryEventSet(data)
        if (translateData && !translateData.empty()) {
            translateData.Dialogs.forEach((value, index) => {
                if (index < result.Dialogs().count()) {
                    let iT = result.IndexType("Dialog", 1)
                    if (iT >= 0) {
                        result.data[iT].ContentT = value.Body
                        result.data[iT].CharacterT = value.Chara
                    }
                }
            })
            translateData.Effects.forEach((value, index) => {
                if (index < result.Effects().count()) {
                    let iT = result.IndexTypes(["Banner", "Marker"], index)
                    if (iT >= 0) {
                        result.data[iT].ContentT = value.Body
                    }
                }
            })
        }
        return result
    }

    count() {
        return this.data.length
    }

    IndexType(t: string, i: number) {
        let simCount = 0
        for (let index = 0; index < this.count(); index++) {
            if (this.data[index].Type == t) {
                if (simCount == i) return index
                simCount += 1
            }
        }
        return -1
    }

    replaceTranslation(s: TranslateData): boolean {
        if (s.Effects.length == this.Effects().data.length && s.Dialogs.length == this.Dialogs().data.length) {
            s.Dialogs.forEach((value, index, array) => {
                this.data[this.IndexType("Dialog", index)].ContentT = value.Body
                this.data[this.IndexType("Dialog", index)].CharacterT = value.Chara
            })
            s.Effects.forEach((value, index, array) => {
                this.data[this.IndexTypes(["Banner", "Marker"], index)].ContentT = value.Body
            })
            return true
        } else return false
    }


    IndexTypes(ts: string[], i: number) {
        let simCount = 0
        for (let index = 0; index < this.count(); index++) {
            for (const t of ts) {
                if (this.data[index].Type == t) {
                    if (simCount == i) return index
                    simCount += 1
                }
            }
        }
        return -1
    }

    Get(ts: string[]): StoryEventSet {
        let result: StoryEvent[] = []
        this.data.forEach(item => {
            for (const t of ts) {
                if (item.Type == t) result.push(item)
            }
        })
        return new StoryEventSet(result)
    }

    Dialogs(): StoryEventSet {
        return this.Get(["Dialog"])
    }

    Banners(): StoryEventSet {
        return this.Get(["Banner"])
    }

    Markers(): StoryEventSet {
        return this.Get(["Marker"])
    }

    Effects(): StoryEventSet {
        return this.Get(["Banner", "Marker"])
    }

    DPeriod(): StoryEventSet {
        return this.Get(["Dialog", "Period"])
    }

    Content(): StoryEventSet {
        return this.Get(["Dialog", "Banner", "Marker"])
    }

    String(): string {
        let parts: string[] = []
        for (const datum of this.data) {
            if (datum.Type != "Dialog") parts.push(datum.String() + "\n")
            else parts.push(datum.String())
        }
        return parts.join("\n")
    }

    ToLegacy(): string {
        let result: string[] = []
        this.data.forEach((value) => {
            switch (value.Type) {
                case 'Dialog': {
                    result.push(`${value.content().Character}：${value.content().Body.replaceAll("\n", "\\N")}`);
                    break;
                }
                case "Period": {
                    result.push("\n");
                    break;
                }
                default: {
                    result.push(value.content().Body.replaceAll("\n", "\\N"))
                }
            }
        })
        return result.join("\n")
    }
}

