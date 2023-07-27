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

<script lang="ts">
import {defineComponent, ref} from "vue";
import SubtitleTask from "../components/SubtitleTask.vue";
import SubtitleEmit from "../components/SubtitleEmit.vue";
import {ipcRenderer} from "electron";

export default defineComponent({
    components: {SubtitleEmit, SubtitleTask},
    data() {
        return {
            webSocket: null,
            url: `ws://${ipcRenderer.sendSync("get-core-url")}/subtitle/tasks`,
            taskList: ref({}),
            living: ref(true),
            modalActive: false
        }
    },
    provide() {
        return {
            modalActiveControl: () => {
                this.modalActive = false
            }
        };
    },
    methods: {
        tasksControl(operate, taskList: string[] | null = null) {
            if (taskList == null)
                taskList = Object.keys(this.taskList)
            taskList.forEach(
                (key) => {
                    ipcRenderer.send("task-operate",[key,operate])
                }
            )
        }
    },
    mounted() {
        this.taskList=ipcRenderer.sendSync("get-task-status")
        ipcRenderer.on("task-status-change",(event, args)=>{
            this.taskList=args
        })
    },
    unmounted() {
        ipcRenderer.removeAllListeners("task-status-change")
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
    margin: 0.5em 2em 0 2em;
}
</style>