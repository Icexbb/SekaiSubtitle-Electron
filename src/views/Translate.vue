<template>
    <template v-if="this.loaded">
        <n-scrollbar>
            <n-space vertical>
                <n-page-header class="header" title="翻译" style="padding: 1em">
                    <template #extra>
                        <n-space align="end">
                            <n-popover>
                                <template #default>
                                    校对/合意对比用
                                </template>
                                <template #trigger>
                                    <n-button @click="this.selectTranslated">
                                        {{ this.translated.data.length == 0 ? '载入' : '清除' }}已翻译文件
                                    </n-button>
                                </template>
                            </n-popover>
                            <n-popconfirm
                                    positive-text="是" negative-text="否"
                                    @positive-click="this.selectJson">
                                <template #trigger>
                                    <n-button> 打开新文件</n-button>
                                </template>
                                <template #default>
                                    <n-text>确认关闭？ 未保存的更改将被舍弃！</n-text>
                                </template>
                            </n-popconfirm>
                            <n-popconfirm
                                    positive-text="是" negative-text="否"
                                    @positive-click="this.clearEventData">
                                <template #trigger>
                                    <n-button> 关闭文件</n-button>
                                </template>
                                <template #default>
                                    <n-text>确认关闭？ 未保存的更改将被舍弃！</n-text>
                                </template>
                            </n-popconfirm>
                        </n-space>
                    </template>
                    <template #default>
                        <n-grid :cols="5">
                            <n-gi :span="2">
                                <n-statistic label="任务名称">
                                    <n-input style="width: 80%;" v-model:value="this.taskName" placeholder=""
                                             @update:value="this.dataChanged"
                                    />
                                </n-statistic>
                            </n-gi>
                            <n-gi :span="1">
                                <n-statistic label="任务行数" :value="String(this.eventData.Content().data.length)"/>
                            </n-gi>
                            <n-gi :span="1">
                                <n-statistic label="文件操作">
                                    <n-dropdown trigger="click" :options="this.saveOptions" @select="this.save">
                                        <n-button>保存</n-button>
                                    </n-dropdown>
                                </n-statistic>
                            </n-gi>
                            <n-gi :span="1">
                                <n-statistic label="文本操作">
                                    <n-dropdown trigger="hover" :options="this.bracketsOptions"
                                                @select="this.copyBracket">
                                        <n-button>复制一对括号</n-button>
                                    </n-dropdown>
                                </n-statistic>
                            </n-gi>
                        </n-grid>
                    </template>
                </n-page-header>
                <n-space :item-style="{width:'90%'}" justify="center">
                    <template v-for="(data,index) in this.eventData.data " :key="index">
                        <TranslateCard
                                :translated="this.eventData.data.length==this.translated.data.length?
                                            this.translated.data[index].ContentT:''"
                                @translation-changed="this.dataChanged" :data="data"
                                @character-translated="this.characterTranslated"
                        />
                    </template>
                </n-space>
            </n-space>
        </n-scrollbar>
    </template>
    <n-card v-else style="height: 100%;">
        <template #default>
            <n-space vertical justify="center" align="center" size="large" style="height: 100%">
                <n-empty>
                    <template #icon>
                        <n-icon>
                            <CodeWorking/>
                        </n-icon>
                    </template>
                    <template #default>
                        <n-space vertical justify="center" align="center">
                            <span>Sekai Subtitle 翻译</span>
                            <span>///// 工事中 ////</span>
                        </n-space>
                    </template>
                    <template #extra>
                        <n-button size="small" @click="this.selectJson">
                            载入数据文件
                        </n-button>
                    </template>
                </n-empty>
            </n-space>
        </template>
    </n-card>
</template>
<script lang="ts">
import {defineComponent} from 'vue'
import {GameStoryData, StoryEventSet, TranslateData} from "../utils/data"
import TranslateCard from "../components/TranslateCard.vue";
import fs from "fs";
import path from "path";
import {CodeWorking} from "@vicons/ionicons5"
import {useTranslateTasksStore} from "../stores/TranslateTask";
import {clipboard, ipcRenderer} from "electron";
import {useMessage} from "naive-ui";

export default defineComponent({
    name: "Translate",
    components: {TranslateCard, CodeWorking},
    setup() {
        return {
            msgP: useMessage(),
        }
    },
    data() {
        let bracketsOptions: object[] = []
        const brackets = ['【】', '「」', '『』', '（）', '‘’', '“”', '()']
        brackets.forEach((value) => {
            bracketsOptions.push({label: `${value}`, key: `add-${value}`})
        })
        const saveOptions = [
            {label: `新版文件`, key: `pjs`},
            {label: `旧版txt文件`, key: `txt`}
        ]

        const store = useTranslateTasksStore()
        let eventData: StoryEventSet = store.eventData
        let taskName: string = store.taskName
        let loadedFile: string = store.baseFile
        let loaded: boolean = store.loaded
        return {
            bracketsOptions,
            saveOptions,

            loaded,
            loadedFile,
            eventData,
            taskName,

            autoSaveMsgTimeout: null,

            translated: new StoryEventSet([]) as StoryEventSet,
        }
    },
    methods: {
        copyBracket(key: string) {
            clipboard.writeText(key)
        },
        selectJson() {
            ipcRenderer.send("select-file-exist-story")
            ipcRenderer.once("selected-story", (_, args) => {
                if (!args['canceled']) {
                    this.loadedFile = args['filePaths'][0]
                }
            })
        },
        selectTranslated() {
            if (this.translated.count() == 0) {
                ipcRenderer.send("select-file-exist-translated")
                ipcRenderer.once("selected-translated", (_, args) => {
                    if (!args['canceled']) {
                        let tData: StoryEventSet
                        let file: string = args['filePaths'][0]
                        if (file.endsWith("pjs.txt")) {
                            tData = StoryEventSet.FromFile(file)
                        } else {
                            if (this.loadedFile.endsWith("pjs.txt")) {
                                tData = StoryEventSet.FromFile(this.loadedFile)
                            } else {
                                tData = StoryEventSet.FromLegacy(GameStoryData.FromFile(this.loadedFile))
                            }
                            let t = TranslateData.FromFile(file)
                            tData.replaceTranslation(t)
                        }
                        this.translated = tData
                    }
                })
            } else {
                this.translated.Clear()
            }
        },
        save(key: string) {
            if (key == 'txt') {
                this.saveToFileLegacy()
            } else {
                this.saveToFileNew()
            }
        },
        saveToFileNew() {
            ipcRenderer.send("select-file-save-translate-new")
            ipcRenderer.once("selected-translate-path-new", (_, args) => {
                if (!args['canceled'] && args['filePath']) {
                    fs.writeFileSync(args['filePath'], this.eventData.String())
                }
            })
        },
        saveToFileLegacy() {
            ipcRenderer.send("select-file-save-translate-legacy")
            ipcRenderer.once("selected-translate-path-legacy", (_, args) => {
                if (!args['canceled'] && args['filePath']) {
                    fs.writeFileSync(args['filePath'], this.eventData.ToLegacy())
                }
            })
        },
        characterTranslated(args: string[]) {
            for (const dataKey in this.eventData.data) {
                if (this.eventData.data[dataKey].CharacterO == args[0])
                    this.eventData.data[dataKey].CharacterT = args[1]
            }
        },
        dataChanged() {
            this.storeEventData()
            this.autoSave()
        },
        autoSave() {
            if (this.loaded && this.loadedFile) {
                let filename = path.join(path.dirname(this.loadedFile), `[AutoSave]${this.taskName}.pjs.txt`)
                fs.writeFileSync(filename, this.eventData.String())
                if (this.autoSaveMsgTimeout !== null) {
                    clearTimeout(this.autoSaveMsgTimeout);
                } else {
                    this.msgP.success("更改已自动保存")
                }
                this.autoSaveMsgTimeout = setTimeout(() => {
                    this.autoSaveMsgTimeout = null;
                }, 1000 * 30);
            }
        },
        storeEventData() {
            const store = useTranslateTasksStore()
            store.taskName = this.taskName
            store.eventData = this.eventData
            store.baseFile = this.loadedFile
            store.loaded = this.loaded
        },
        clearEventData() {
            this.loaded = false
            this.loadedFile = ""
            this.eventData = new StoryEventSet([]) as StoryEventSet
        }
    },
    watch: {
        loadedFile: function () {
            if (fs.existsSync(this.loadedFile)) {
                this.loaded = this.loadedFile.length > 0;
                if (this.loadedFile.endsWith("pjs.txt")) {
                    this.eventData = StoryEventSet.FromFile(this.loadedFile)
                    this.taskName = path.basename(this.loadedFile, ".pjs.txt")
                } else {
                    this.taskName = path.basename(this.loadedFile, path.extname(this.loadedFile))
                    this.eventData = StoryEventSet.FromLegacy(GameStoryData.FromFile(this.loadedFile))
                }
            } else {
                this.clearEventData()
            }
            this.storeEventData()
        },
    },
    unmounted() {
        if (!this.loaded) {
            this.clearEventData()
        }
        this.storeEventData()
    },
})
</script>

<style scoped>

</style>