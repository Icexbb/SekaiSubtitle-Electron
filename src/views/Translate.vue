<template>
    <n-scrollbar v-if="this.loaded">
        <n-page-header>
        </n-page-header>
        <n-space :item-style="{width:'90%'}" justify="center">
            <template v-for="data in this.eventData.data" :key="this.eventData.data.indexOf(data)">
                <TranslateCard  :data="data"></TranslateCard>
            </template>
        </n-space>
    </n-scrollbar>

    <n-card v-else style="height: 100%;">
        <template #default>
            <n-space vertical justify="center">
                <n-space justify="center">
                    <n-button @click="this.selectJson"></n-button>
                </n-space>
            </n-space>
        </template>
    </n-card>
</template>
<script lang="ts">
import {defineComponent} from 'vue'
import {ipcRenderer} from "electron";
import {GameStoryData, StoryEventSet, TranslateData} from "../utils/data"
import TranslateCard from "../components/TranslateCard.vue";

export default defineComponent({
    name: "Translate",
    components: {TranslateCard},
    data() {
        let jsonData = GameStoryData.FromFile("E:\\Project Sekai\\test\\Connect_live_mmj_01.json")
        let transData = new TranslateData([], [])
        let eventData = StoryEventSet.FromLegacy(jsonData, transData)
        console.log(eventData)
        return {
            loaded: true,
            eventData:eventData as StoryEventSet,
        }
    },
    methods: {
        selectJson() {
            ipcRenderer.send("select-file-exist-story")
            ipcRenderer.once("selected-story", (event, args) => {
                if (!args.canceled) {
                    this.dataFile = args.filePaths[0]
                    console.log(this.dataFile)
                }
            })
        }
    },
    watch: {
        dataFile: function () {
            if (this.dataFile.length > 0) this.loaded = true;
        }
    }
})
</script>

<style scoped>

</style>