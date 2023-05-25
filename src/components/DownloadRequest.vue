<template>
    <n-popover trigger="hover" :disabled="!Boolean(this.downloaded)" style="user-select: none;">
        <template #trigger>
            <n-tag round closable style="user-select: none;"
                   :type="Boolean(this.downloaded)?'success':this.downloading?'warning':'info'"
                   @close="this.deleteSelf">
                <template #default>
                    <span
                            :draggable="true" @dblclick="this.showFile"
                            @dragstart="this.dragOut" @dragover.prevent
                    >{{ this.name }}</span>
                </template>
                <template #icon>
                    <n-button :bordered="false" style="padding-inline: 2px" success>
                        <n-icon @click="this.download">
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
    data() {
        // @ts-ignore
        let task = useDownloadTasksStore().tasks[this.hash as string]
        return {
            icon: DownloadRound,
            name: task.taskName,
            url: task.taskUrl,
            filepath: task.taskTarget,
            downloading: task.taskDownloading,
            downloaded: task.taskDownloaded,
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
            this.downloading = this.store.tasks[this.hash].taskDownloading;
            this.downloaded = this.store.tasks[this.hash].taskDownloaded;
        },
        download() {
            useDownloadTasksStore().tasks[this.hash].taskDownloading = true
            this.updateStatus()

            const args = ipcRenderer.sendSync("get-setting", {
                "ProxyScheme": null,
                "ProxyHost": null,
                "ProxyPort": null
            })
            this.axios.get(this.url, {
                proxy: {
                    protocol: args['ProxyScheme'].length ? args['ProxyScheme'] : null,
                    host: args['ProxyScheme'].length ? args['ProxyHost'] : null,
                    port: args['ProxyScheme'].length ? args["ProxyPort"] : null
                },
            }).then((response) => {
                fs.writeFileSync(this.filepath, JSON.stringify(response.data))
                useDownloadTasksStore().tasks[this.hash].taskDownloaded = true
                useDownloadTasksStore().tasks[this.hash].taskDownloading = false
                this.updateStatus()
            })
        },
        showFile() {
            if (Boolean(this.filepath) && this.status) {
                require('child_process').exec(`explorer.exe /select,${this.filepath}`)
            }
        },
        dragOut(event) {
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