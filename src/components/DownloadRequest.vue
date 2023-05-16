<template>
    <n-popover trigger="hover" :disabled="!Boolean(this.status)">
        <template #trigger>
            <n-tag round closable
                   :type="Boolean(this.status)?'success':this.downloading?'warning':'info'"
                   @close="this.deleteSelf">
                <template #default>
                    <n-button :bordered="false" size="small" round strong
                              style="padding: 0" ghost
                              :type="Boolean(this.status)?'success':this.downloading?'warning':'info'"
                              @click="this.showFile">
                        {{ this.name }}
                    </n-button>
                </template>
                <template #icon>
                    <n-button :bordered="false" style="padding-inline: 2px" success>
                        <n-icon @click="this.download">
                            <DownloadRound v-if="!Boolean(this.status)&&!Boolean(this.downloading)"/>
                            <DownloadingRound v-if="!Boolean(this.status)&&Boolean(this.downloading)"/>
                            <DownloadDoneRound v-if="Boolean(this.status)"/>
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

export default defineComponent({
    name: "DownloadRequest",
    props: {hash: String, status: Boolean},
    components: {DownloadRound, DownloadDoneRound, DownloadingRound},
    mounted() {
        this.getInfo()
    },
    data() {
        return {
            icon: DownloadRound,
            downloading: false,
            taskInfo: {},
            name: "",
            filepath: "",
        }
    },
    methods: {
        deleteSelf() {
            this.axios.post(`http://localhost:50000/download/delete/${this.hash}`)
        },
        getInfo() {
            this.axios.get(`http://localhost:50000/download/taskConfig/${this.hash}`).then(data => {
                this.taskInfo = data.data.data
                this.filepath = this.taskInfo['fullpath']
                if (process.platform === "win32")
                    this.filepath = this.filepath.replaceAll('/', '\\')
                this.name = this.taskInfo['name']
            })
        },
        download() {
            this.downloading = true
            this.axios.post(`http://localhost:50000/download/start/${this.hash}`).then((_) => {
                this.downloading = false
            })
        },
        showFile() {
            if (Boolean(this.filepath) && this.status) {
                require('child_process').exec(`explorer.exe /select,${this.filepath}`)
            }
        }

    }

})
</script>

<style scoped>

</style>