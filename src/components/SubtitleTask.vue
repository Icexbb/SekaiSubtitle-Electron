<template>
    <n-card
            class="subtitle-task"
            closable @close="()=>{this.taskControl('delete')}"
            size="small" hoverable :segmented="true"
    >
        <template #header>
            <n-space justify="space-between" class="task-info-item">
                <span>{{ this.taskName }}</span>
                <n-progress
                        type="line"
                        :indicator-placement="'inside'"
                        :percentage="Number(this.currentProgress)"
                        show-indicator
                        style="min-width: 200px;"
                >
                <span style="text-align: center;font-size: 16px">
                    {{ this.currentProgress + '%' }}
                </span>
                </n-progress>
            </n-space>
        </template>
        <template #default>
            <n-collapse>
                <n-collapse-item :title="this.taskLogStrings.slice(-1)[0]">
                    <template #header-extra>
                        <span>FPS: {{ this.fps.toFixed(1) }} ETA: {{ this.eta.toFixed(0) }}s</span>
                    </template>
                    <template #default>
                        <n-scrollbar style=" height: 150px">
                            <n-log :font-size="12" style="text-align:left;height: max-content;"
                                   :log="this.taskLogStrings.join('\n')"/>
                        </n-scrollbar>
                    </template>
                </n-collapse-item>
            </n-collapse>
        </template>
        <template #action>
            <n-space justify="center">
                <n-button secondary strong size="small"
                          :type="this.status === 'idle' ?'primary':'error'"
                          @click="()=>{this.taskControl(this.status === 'idle' ? 'start' : 'stop')}"
                >
                    {{ this.status === 'idle' ? '开始处理' : '中止任务' }}
                </n-button>
                <n-button secondary strong size="small" type="warning"
                          @click="()=>{this.taskControl('reload')}">重新加载
                </n-button>
                <n-button secondary strong size="small" type="error"
                          @click="()=>{this.taskControl('delete')}">删除任务
                </n-button>
            </n-space>
        </template>
    </n-card>
</template>
<script lang="ts">
import {defineComponent} from "vue";
import {ipcRenderer} from "electron";

export default defineComponent({
    props: {"task_id": String, "status": String},
    data() {
        return {
            webSocket: null,
            taskLogs: [],
            taskLogCount: 0,
            currentProgress: 0,
            taskConfig: {},
            taskLogStrings: [],
            taskName: "",
            taskNoticed: false,
            fps: 0,
            eta: 0
        }
    },
    methods: {
        taskControl(operate) {
            ipcRenderer.send('task-operate',[ this.task_id, operate])
            if (operate == 'start' || operate == "reload") this.taskReload();
        },
        taskReload() {
            this.taskLogs = []
            this.taskLogCount = 0
            this.currentProgress = 0
            this.taskNoticed = false
            this.taskLogStrings = []
        },
        messageFinish() {
            if (!this.taskNoticed) {
                const vp: string = this.taskConfig['video_file']
                let op: string = this.taskConfig['output_path']
                if (!Boolean(op.length)) {
                    op = vp.replace(vp.substring(vp.lastIndexOf('.')), ".ass")
                }
                ipcRenderer.send('notification-show', [
                    {title: `任务 ${this.taskName} 完成`, body: `输出到 "${op}"`}, op
                ])
                this.taskNoticed = true
            }
        },
        handleLog(log:string) {
            let logObject = JSON.parse(log)
            if (logObject['type'] === 'dict') {
                let dict = JSON.parse(logObject['data'])
                this.fps = dict['fps']//dict['frame'] / (dict['time'] / 1000)
                this.eta = dict['remains'] / this.fps
                this.currentProgress = 100 * dict['frame'] / (dict['frame'] + dict['remains'])
                this.currentProgress = this.currentProgress.toFixed(2)
                if (dict["remains"] == 1) {
                    this.messageFinish()
                }
            } else if (logObject['type'] === 'string') {
                this.taskLogStrings.push(logObject['data'])
            }
        }
    },
    created() {
        this.axios.get(`http://${ipcRenderer.sendSync("get-core-url")}/task?id=${this.task_id}`).then(data => {
            this.taskConfig = JSON.parse(data.data.data)
            const path = require("path")
            this.taskName = path.basename(this.taskConfig['video_file'])
        })
        let logs :object[]= ipcRenderer.sendSync("get-task-log",this.task_id)
        logs?.forEach(this.handleLog)
        ipcRenderer.on(`task-log-${this.task_id}`, (event, args) => {
            this.handleLog(args)
        })
    },
    unmounted() {
        ipcRenderer.removeAllListeners(`task-log-${this.task_id}`)
    }
})
</script>
<style scoped>
.task-info-item {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.subtitle-task {
    margin-bottom: 1em;
}
</style>