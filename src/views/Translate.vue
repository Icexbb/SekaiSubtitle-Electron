<template>
    <template v-if="this.loaded">
        <n-scrollbar>
            <n-space vertical>
                <n-page-header class="header" title="翻译" style="padding: 1em">
                    <template #extra>
                        <n-button @click="this.selectJson">打开新文件</n-button>
                    </template>
                    <template #default>
                        <n-grid :cols="5">
                            <n-gi :span="1">
                                <n-statistic label="任务行数" :value="String(this.eventData.Content().data.length)"/>
                            </n-gi>
                            <n-gi :span="3">
                                <n-statistic label="操作">
                                    <template #default>
                                        <n-space justify="start">
                                            <n-popover>
                                                <template #default>
                                                    校对/合意对比用
                                                </template>
                                                <template #trigger>
                                                    <n-button @click="this.selectTranslated">载入已翻译文件</n-button>
                                                </template>
                                            </n-popover>
                                            <n-button @click="this.saveToFileNew">保存</n-button>
                                            <n-button @click="this.saveToFileLegacy">保存旧版</n-button>

                                        </n-space>
                                    </template>
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
import {ipcRenderer} from "electron";
import {GameStoryData, StoryEventSet, TranslateData} from "../utils/data"
import TranslateCard from "../components/TranslateCard.vue";
import fs from "fs";
import {CodeWorking} from "@vicons/ionicons5"

export default defineComponent({
    name: "Translate",
    components: {TranslateCard, CodeWorking},
    data() {
        let option = [
            {
                label: '保存为旧版Sekai Text文件',
                key: 'legacy'
            },
            {
                key: 'header-divider',
                type: 'divider'
            },
            {
                label: '保存为Sekai Subtitle文件',
                key: 'new'
            }
        ]
        return {
            loaded: false,
            loadedFile: "",
            eventData: new StoryEventSet([]) as StoryEventSet,
            translated: new StoryEventSet([]) as StoryEventSet,
            saveOptions: option
        }
    },
    methods: {
        selectJson() {
            ipcRenderer.send("select-file-exist-story")
            ipcRenderer.once("selected-story", (event, args) => {
                if (!args.canceled) {
                    this.loadedFile = args.filePaths[0]
                }
            })
        },
        selectTranslated() {
            ipcRenderer.send("select-file-exist-translated")
            ipcRenderer.once("selected-translated", (event, args) => {
                if (!args.canceled) {
                    let tData: StoryEventSet
                    let file: string = args.filePaths[0]
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
        },
        saveToFileNew() {
            ipcRenderer.send("select-file-save-translate-new")
            ipcRenderer.once("selected-translate-path-new", (event, args: Electron.SaveDialogReturnValue) => {
                if (!args.canceled && args.filePath) {
                    fs.writeFileSync(args.filePath, this.eventData.String())
                }
            })
        },
        saveToFileLegacy() {
            ipcRenderer.send("select-file-save-translate-legacy")
            ipcRenderer.once("selected-translate-path-legacy", (event, args: Electron.SaveDialogReturnValue) => {
                if (!args.canceled && args.filePath) {
                    fs.writeFileSync(args.filePath, this.eventData.ToLegacy())
                }
            })
        },
        save(option: string) {
            switch (option) {
                case 'legacy': {
                    this.saveToFileLegacy();
                    break;
                }
                default: {
                    this.saveToFileNew()
                }
            }
        },
        show() {
            console.log(this.eventData);
        },
        characterTranslated(args) {
            for (const dataKey in this.eventData.data) {
                if (this.eventData.data[dataKey].CharacterO == args[0])
                    this.eventData.data[dataKey].CharacterT = args[1]
            }
        },
        dataChanged(args) {
            console.log(this.eventData)
        }
    },
    watch: {
        loadedFile: function () {
            if (this.loadedFile.length > 0) this.loaded = true;
            if (this.loadedFile.endsWith("pjs.txt")) {
                this.eventData = StoryEventSet.FromFile(this.loadedFile)
            } else {
                let jsonData = GameStoryData.FromFile(this.loadedFile)
                this.eventData = StoryEventSet.FromLegacy(jsonData)
            }
        },
    }
})
</script>

<style scoped>

</style>