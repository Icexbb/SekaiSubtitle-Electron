<template>
    <n-popover trigger="hover" :disabled="!Boolean(this.downloaded)" style="user-select: none;">
        <template #trigger>
            <n-tag round closable style="user-select: none;"
                   :draggable="this.downloaded" @dragstart="this.dragOut" @dragover.prevent
                   :type="Boolean(this.downloaded)?'success':this.downloading?'warning':'info'"
                   @close="this.deleteSelf">
                <template #default>
                    <span @dblclick="this.showFile">{{ this.name }}</span>
                </template>
                <template #icon>
                    <n-button :bordered="false" style="padding-inline: 2px" success>
                        <n-icon @click="this.checkAndDownload">
                            <DownloadRound v-if="(!this.downloaded)&&(!this.downloading)"/>
                            <DownloadingRound v-if="(!this.downloaded)&&this.downloading"/>
                            <DownloadDoneRound v-if="this.downloaded"/>
                        </n-icon>
                    </n-button>
                </template>
            </n-tag>
        </template>
        <template #default>
            <span>{{ this.filepath }}</span>
        </template>
    </n-popover>
</template>

<script lang="ts">
import {defineComponent} from 'vue'
import {DownloadRound, DownloadDoneRound, DownloadingRound} from "@vicons/material"
import {ipcRenderer} from "electron";
import {useDownloadTasksStore} from "../stores/DownloadTasks";
import fs from "fs";

export default defineComponent({
    name: "DownloadRequest",
    props: {hash: String},
    components: {DownloadRound, DownloadDoneRound, DownloadingRound},
    mounted() {
        this.updateStatus()
    },
    updated() {
        this.updateStatus()
    },
    unmounted() {
        this.setStatus()
    },
    data() {
        let task = useDownloadTasksStore().tasks[this.hash as string]
        return {
            icon: DownloadRound,
            name: task.taskName as string,
            url: task.taskUrl as string,
            filepath: task.taskTarget as string,
            downloading: task.taskDownloading as boolean,
            downloaded: task.taskDownloaded as boolean,
        }
    },
    methods: {
        deleteSelf() {
            if (fs.existsSync(this.filepath)) fs.unlinkSync(this.filepath)
            useDownloadTasksStore().deleteTask(this.hash)
        },
        checkAndDownload() {
            if ((!this.downloaded) && (!this.downloading)) this.download();
        },
        updateStatus() {
            this.downloading = useDownloadTasksStore().tasks[this.hash].taskDownloading;
            this.downloaded = useDownloadTasksStore().tasks[this.hash].taskDownloaded;
        },
        setStatus() {
            if (useDownloadTasksStore().tasks[this.hash]) {
                useDownloadTasksStore().tasks[this.hash].taskDownloading = this.downloading;
                useDownloadTasksStore().tasks[this.hash].taskDownloaded = this.downloaded;
            }
        },
        download() {
            this.downloading = true
            this.setStatus()

            this.axios.get(this.url).then((response) => {
                fs.writeFileSync(this.filepath, JSON.stringify(response.data))
                this.downloaded = true
                this.downloading = false
                this.setStatus()
            })
        },
        showFile() {
            this.filepath = this.filepath.replaceAll("/", "\\")
            if (Boolean(this.filepath.length) && this.downloaded) {
                require("electron").shell.showItemInFolder(this.filepath)
            }
        },
        dragOut(event: DragEvent) {
            event.preventDefault()
            ipcRenderer.send('drag-start', this.filepath)
            ipcRenderer.once('drag-finished', () => {
                this.deleteSelf()
            })
        },

    },

})
</script>

<style scoped>

</style>