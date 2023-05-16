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
                        <n-log :font-size="12" style="text-align:left;" :log="this.taskLogStrings.join('\n')"/>
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
                <!--                <n-button secondary strong size="small" type="warning"-->
                <!--                          @click="()=>{this.taskReload();this.taskControl('restart')}">重新运行-->
                <!--                </n-button>-->
                <n-button secondary strong size="small" type="warning"
                          @click="()=>{this.taskReload();this.taskControl('reload')}">重新加载
                </n-button>
                <n-button secondary strong size="small" type="error"
                          @click="()=>{this.taskReload();this.taskControl('delete')}">删除任务
                </n-button>
            </n-space>
        </template>
    </n-card>
</template>

<script lang="ts">
import {defineComponent} from "vue";

export default defineComponent({
    props: {"task_id": String, "status": String},
    data() {
        return {
            webSocket: null,
            url: `ws://localhost:50000/subtitle/status/${this.task_id}`,
            taskLogs: [],
            taskLogCount: 0,
            currentProgress: 0,
            taskConfig: {},
            taskLogStrings: [],
            taskName: "",
            fps: 0,
            eta: 0
        }
    },
    methods: {
        initConfig() {
            this.axios.get(`http://localhost:50000/subtitle/taskConfig/${this.task_id}`).then(
                data => {
                    this.taskConfig = data.data['data']
                    const filename = this.taskConfig['video_file'].replaceAll('\\', "/")
                    this.taskName = filename.substring(filename.lastIndexOf('/') + 1, filename.lastIndexOf('.'))
                }
            )
        },
        initSocket() {
            let url = this.url
            this.webSocket = new WebSocket(url)
            this.webSocket.onopen = this.webSocketOnOpen
            this.webSocket.onclose = this.webSocketOnClose
            this.webSocket.onmessage = this.webSocketOnMessage
            this.webSocket.onerror = this.webSocketOnError
        },
        webSocketOnOpen() {
            this.webSocket.send(JSON.stringify({"request": this.taskLogCount}));
        },
        // 获取到后台消息的事件，操作数据的代码在onmessage中书写
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
            }
            this.webSocket.send(JSON.stringify({"request": this.taskLogCount}))
        },
        // 关闭连接
        webSocketOnClose() {
            this.webSocket.close()
        },
        //连接失败的事件
        webSocketOnError(res) {
            console.log('websocket连接失败');
            console.log(res);
        },
        taskControl(operate) {
            this.axios.post(`http://localhost:50000/subtitle/${operate}/${this.task_id}`)
        },
        taskReload() {
            this.taskLogs = []
            this.taskLogCount = 0
            this.currentProgress = 0
            this.taskLogStrings = []
        }

    },
    created() {
        // 页面打开就建立连接，根据业务需要
        this.initConfig()
        this.initSocket()
    },
    unmounted() {
        // 页面销毁关闭连接
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