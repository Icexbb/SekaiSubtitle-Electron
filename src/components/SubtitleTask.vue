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
                        :percentage="this.currentProgress"
                        show-indicator
                        style="min-width: 200px;"
                >
                <span style="text-align: center;font-size: 16px">
                    {{ this.currentProgress.toFixed(1) + '%' }}
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
            url: `ws://${ipcRenderer.sendSync("get-core-url")}/subtitle/status/${this.task_id}`,
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
    inject: ["GeneralTasksControl"],
    methods: {
        initSocket() {
            let url = this.url
            this.webSocket = new WebSocket(url)
            this.webSocket.onopen = this.webSocketOnOpen
            this.webSocket.onclose = this.webSocketOnClose
            this.webSocket.onmessage = this.webSocketOnMessage
            this.webSocket.onerror = this.webSocketOnError
        },
        webSocketOnOpen() {
            this.webSocket.send(JSON.stringify({"request": "config"}));
        },
        webSocketOnMessage(res) {
            const data = JSON.parse(res.data)
            if (data['type'] === 'log') {
                let logs = data['data'];
                logs.forEach((log) => {
                    this.taskLogCount += 1;
                    if (log['type'] === 'dict') {
                        if (log['data']['end']) {
                            // this.webSocket.close()
                        } else {
                            this.fps = log['data']['frame'] / log['data']['time']
                            this.eta = log['data']['remains'] / this.fps
                            if (log['data']['progress'] !== this.currentProgress) {
                                this.currentProgress = log['data']['progress']
                            }
                        }
                    } else if (log['type'] === 'str') {
                        this.taskLogStrings.push(log['data'])
                    }
                })
                if (this.currentProgress == 100 && !this.taskNoticed) this.messageFinish();
            } else if (data['type'] == 'config') {
                this.taskConfig = data['data']
                const filename = this.taskConfig['video_file'].replaceAll('\\', "/")
                this.taskName = filename.substring(filename.lastIndexOf('/') + 1, filename.lastIndexOf('.'))
            }
            this.webSocket.send(JSON.stringify({"request": this.taskLogCount}))
        },
        webSocketOnClose() {
            if (this.webSocket) this.webSocket.close();
        },
        webSocketOnError(res) {
            console.log('websocket连接失败');
            console.log(res);
        },
        taskControl(operate) {
            if (operate == 'start' || operate == "reload") this.taskReload();
            this.GeneralTasksControl(operate, this.task_id)
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
        }
    },
    created() {
        this.initSocket()
    },
    unmounted() {
        this.webSocket.close()
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