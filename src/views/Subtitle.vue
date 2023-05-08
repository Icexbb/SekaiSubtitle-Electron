<template>
    <n-scrollbar>
        <n-space vertical>
            <n-page-header class="header" title="自动轴机" style="padding: 1em">
                <template #extra>
                    <n-button @click="()=>{this.modalActive = !this.modalActive}">新任务</n-button>
                </template>
                <template #default>
                    <n-grid :cols="5">
                        <n-gi>
                            <n-statistic label="任务数" :value="Object.keys(this.taskList).length.toString()"/>
                        </n-gi>
                        <n-gi :span="4">
                            <n-statistic label="操作">
                                <template #default>
                                    <n-space justify="start">
                                        <n-button
                                                :disabled="!Boolean(Object.keys(this.taskList).length)"
                                                @click="()=>{this.tasksControl('start')}"> 全部开始
                                        </n-button>
                                        <n-button @click="()=>{this.tasksControl('stop')}"
                                                  :disabled="!Boolean(Object.keys(this.taskList).length)"> 全部停止
                                        </n-button>
                                        <n-popconfirm
                                                positive-text="是" negative-text="否"
                                                :positive-button-props="{type:'warning'}"
                                                @positive-click="()=>{this.tasksControl('delete')}">
                                            <template #trigger>
                                                <n-button :disabled="!Boolean(Object.keys(this.taskList).length)">
                                                    删除全部
                                                </n-button>
                                            </template>
                                            确认删除全部任务？
                                        </n-popconfirm>
                                    </n-space>
                                </template>
                            </n-statistic>
                        </n-gi>
                    </n-grid>
                </template>
            </n-page-header>
            <div class="container">
                <n-layout v-if="Object.keys(this.taskList).length">
                    <n-layout-content>
                        <template v-for="task in Object.keys(this.taskList)" :key="task">
                            <SubtitleTask :task_id="task"
                                          :status="this.taskList[task]"></SubtitleTask>
                        </template>
                    </n-layout-content>
                </n-layout>
                <n-empty v-else description="目前没有任务">
                    <template #extra>
                        <n-button size="small" @click="()=>{this.modalActive = !this.modalActive}">
                            添加新任务
                        </n-button>
                    </template>
                </n-empty>
            </div>
        </n-space>
    </n-scrollbar>
    <n-modal v-model:show="this.modalActive" :mask-closable=false closable>
        <subtitle-emit></subtitle-emit>
    </n-modal>
</template>

<script>
import {defineComponent, ref} from "vue";
import SubtitleTask from "../components/SubtitleTask.vue";
import SubtitleEmit from "../components/SubtitleEmit.vue";

export default defineComponent({
    components: {SubtitleEmit, SubtitleTask},
    data() {
        return {
            webSocket: null,
            url: 'ws://localhost:50000/tasks',
            taskList: ref({}),
            living: ref(true),
            modalActive: false
        }
    },
    provide() {
        return {
            modalActiveControl: ()=>{this.modalActive = false},
        };
    },
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
            // console.log('websocket连接成功');
            this.webSocket.send(JSON.stringify({type: "alive"}));
        },
        // 获取到后台消息的事件，操作数据的代码在onmessage中书写
        webSocketOnMessage(res) {
            const data = JSON.parse(res.data)
            if (data['type'] === 'tasks') {
                this.taskList = data['data']
            }
            this.webSocket.send(JSON.stringify({type: "alive"}));
        },
        // 关闭连接
        webSocketOnClose() {
            if (this.webSocket)
                this.webSocket.close()
            if (this.living) {
                setTimeout(this.initSocket, 100)
                console.log("WebSocket Closed Unexpectedly")
                this.taskList = {}
            }
        },
        webSocketOnError(res) {
            console.log('websocket连接失败');
            // 打印失败的数据
            console.log(res);
        },
        tasksControl(operate) {
            Object.keys(this.taskList).forEach(
                (key) => {
                    try {
                        this.axios.post(`http://localhost:50000/${operate}/${key}`)
                    } finally {
                    }
                }
            )

        }
    },
    created() {
        // 页面打开就建立连接，根据业务需要
        if (!this.webSocket)
            this.initSocket()
    },
    unmounted() {
        this.living = false
        try {
            if (this.webSocket)
                this.webSocket.close()
        } finally {
            this.webSocket = null
        }
    }
})
</script>
<style scoped>
.header {
    height: 150px;
}

.container {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    margin: 0.5em 2em 0em 2em;
}
</style>