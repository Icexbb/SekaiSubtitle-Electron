<template>
    <n-card style="height: 100%;user-select: none;" content-style="padding: 1em;height:100%;"
            header-style="padding: 1em;"
            :segmented="false" class="full-height">
        <template #header>
            <n-page-header class="header" title="数据下载"/>
        </template>
        <n-space vertical :wrap-item="false" style="height:100%" justify="space-between">
            <n-space ertical :wrap-item="false" justify="start">
                <n-input-group>
                    <n-input-group-label>数据源</n-input-group-label>
                    <n-select
                            :options="this.dataSourceOpt" :default-value="'https://sekai.best/'"
                            v-model:value="this.source" @update:value="()=>{this.updateTree(false)}"
                    />
                    <n-button @click="()=>{this.updateTree(true)}">刷新</n-button>
                </n-input-group>
                <n-input-group>
                    <n-input-group-label>
                        {{ this.groupLabel1 }}
                    </n-input-group-label>
                    <n-select :loading="this.treeLoading" style="width: 100%;"
                              :options="this.selectOption1" remote
                              v-model:value="this.selectedOpt1"
                              @update:value="this.updateOption2"
                    />
                </n-input-group>
                <n-input-group>
                    <n-input-group-label>
                        {{ this.groupLabel2 }}
                    </n-input-group-label>
                    <n-select :loading="this.treeLoading" style="width: 100%;"
                              :options="this.selectOption2" remote
                              v-model:value="this.selectedOpt2"
                              @update:value="this.updateOption3"/>
                </n-input-group>
                <n-input-group>
                    <n-input-group-label style="height: 100%;">
                        {{ this.groupLabel3 }}
                    </n-input-group-label>
                    <n-select :loading="this.treeLoading" style="width: 100%;"
                              multiple filterable clearable
                              v-model:value="this.selectedOpt3" remote
                              :options="this.selectOption3">
                        <template #action>
                            <n-space justify="end" :wrap-item="false">
                                <n-button @click="this.option3SelectAll">选择全部</n-button>
                            </n-space>
                        </template>
                    </n-select>
                </n-input-group>
                <n-space justify="end">
                    <n-button @click="this.addDownloadRequests">
                        添加下载任务
                    </n-button>
                </n-space>
            </n-space>
            <n-card style="height: max-content;">
                <template #header>
                    下载任务列表
                </template>
                <template #default>
                    <n-space>
                        <template v-for="taskId in Object.keys(this.DownloadTasks)" :key="taskId">
                            <DownloadRequest :hash="taskId" :ref="taskId"/>
                        </template>
                    </n-space>
                </template>
                <template #action>
                    <n-space justify="end">
                        <n-button @click="this.deleteAll">删除全部</n-button>
                        <n-button @click="this.startAll">开始全部</n-button>
                    </n-space>
                </template>
                <template #header-extra>
                    <n-popover placement="left" trigger="hover" :disabled="!Boolean(this.proxy.length)">
                        <template #trigger>
                            <n-icon :color="this.proxy.length?'#63e2b7':'#AAAAAAAA'">
                                <ServerProxy/>
                            </n-icon>
                        </template>
                        <template #default>
                            <span>{{ this.proxy }}</span>
                        </template>
                    </n-popover>
                </template>
            </n-card>
        </n-space>
    </n-card>
</template>
<script lang="ts">
import {defineComponent, ref} from "vue";
import {createHash} from "crypto";
import DownloadRequest from "../components/DownloadRequest.vue";
import {ServerProxy} from "@vicons/carbon"
import {AssetDir, download_list, update_tree} from "../utils/asset";
import {useDownloadTasksStore, DownloadTaskInfo} from "../stores/DownloadTasks";
import path from "path";
import {ipcRenderer} from "electron";
import {chara_id} from "../utils/constants";

const dataSourceOpt = [
    {label: 'https://sekai.best/', value: "best",},
    {label: 'https://pjsek.ai/', value: "ai",}
]

export default defineComponent({
    components: {DownloadRequest, ServerProxy},
    setup() {
        const store = useDownloadTasksStore();
        let DownloadTasks = ref({})
        store.$subscribe((mutation, state) => {
            DownloadTasks.value = state.tasks
        })
        DownloadTasks.value = store.$state.tasks
        return {
            dataSourceOpt, createHash, store, DownloadTasks
        }
    },
    mounted() {
        this.updateTree()
        this.proxy = ipcRenderer.sendSync("get-setting", "proxy")
    },
    updated() {
        this.updateTree()
        this.proxy = ipcRenderer.sendSync("get-setting", "proxy")
    },
    data() {
        return {
            sourceList: {},
            source: 'best',
            proxy: '',
            timeout: 0,
            treeLoading: false,
            groupLabel1: '剧情类型',
            selectOption1: [],
            selectedOpt1: '',
            groupLabel2: '剧情期数',
            selectOption2: [],
            selectedOpt2: '',
            groupLabel3: '剧情话数',
            selectOption3: [],
            selectedOpt3: [],
            webSocket: null,
        }
    },
    methods: {
        updateTree(refresh = false) {
            this.treeLoading = true
            if (refresh) {
                download_list(this.source).finally(() => {
                    this.sourceList = update_tree(this.source)
                    this.updateOption1()
                    this.treeLoading = false
                })
            } else {
                this.sourceList = update_tree(this.source)
                this.updateOption1()
                this.treeLoading = false
            }
        },
        updateOption1() {
            this.selectOption1 = []

            interface areaSet {
                type: String,
                label: String,
                key: String,
                children: Object[]
            }

            let areaSetFilter: areaSet = {
                type: 'group', label: '地图对话', key: '地图对话', children: []
            }
            Object.keys(this.sourceList).sort(this.compareString).forEach((value) => {
                if (value.substring(0, 4) === '地图对话') {
                    areaSetFilter['children'].push({
                        value: value, label: value.substring(7)
                    })
                } else
                    this.selectOption1.push({label: value, value: value})
            })
            if (areaSetFilter.children.length)
                this.selectOption1.push(areaSetFilter)
            this.selectOption1.sort()
            if (this.selectOption1.length)
                this.selectedOpt1 = this.selectOption1[0].label
            else
                this.selectedOpt1 = ''
            this.updateOption2()
        },
        updateOption2() {
            switch (this.selectedOpt1) {
                case "地图对话 - 地点筛选":
                    this.groupLabel2 = "地点名称";
                    this.groupLabel3 = "对话序号";
                    break;
                case "地图对话 - 月度追加":
                    this.groupLabel2 = "追加时间";
                    this.groupLabel3 = "对话序号";
                    break;
                case "地图对话 - 活动追加":
                    this.groupLabel2 = "追加活动";
                    this.groupLabel3 = "对话序号";
                    break;
                case "地图对话 - 人物筛选":
                    this.groupLabel2 = "角色名称";
                    this.groupLabel3 = "对话序号";
                    break;
                case "活动剧情":
                    this.groupLabel2 = "活动期数";
                    this.groupLabel3 = "剧情话数";
                    break;
                case "特殊剧情":
                    this.groupLabel2 = "剧情类别";
                    this.groupLabel3 = "剧情话数";
                    break;
                case "主线剧情":
                    this.groupLabel2 = "乐队章节";
                    this.groupLabel3 = "剧情话数";
                    break;
                case "卡牌剧情":
                    this.groupLabel2 = "所属角色";
                    this.groupLabel3 = "角色卡牌";
                    break;
                default:
                    this.groupLabel2 = '剧情期数'
                    this.groupLabel3 = '剧情话数'
            }

            this.selectOption2 = []
            if (this.selectedOpt1)
                Object.keys(this.sourceList[this.selectedOpt1]).sort(this.compareString).forEach((value) => {
                    this.selectOption2.push({label: value, value: value})
                })
            if (this.selectedOpt1 == "活动剧情" || this.selectedOpt1 == "地图对话 - 活动追加" || this.selectedOpt1 == "地图对话 - 月度追加") {
                this.selectOption2.reverse()
            } else if (this.selectedOpt1 == "卡牌剧情" || this.selectedOpt1 == "地图对话 - 人物筛选") {
                this.selectOption2.sort(
                    (a, b) => {
                        return chara_id[a.label] - chara_id[b.label]
                    }
                )
            }
            if (this.selectOption2.length)
                this.selectedOpt2 = this.selectOption2[0].label
            else
                this.selectedOpt2 = ''
            this.updateOption3()
        },
        updateOption3() {
            this.selectOption3 = []
            if (this.selectedOpt2)
                Object.keys(this.sourceList[this.selectedOpt1][this.selectedOpt2]).sort(this.compareString)
                    .forEach((value) => {
                        this.selectOption3.push({label: value, value: value})
                    })
            this.selectedOpt3 = []
        },
        option3SelectAll() {
            this.selectedOpt3 = []
            this.selectOption3.forEach((item) => {
                this.selectedOpt3.push(item.label)
            })
        },
        addDownloadRequests() {
            this.selectedOpt3.forEach((value) => {
                let url: string = this.sourceList[this.selectedOpt1][this.selectedOpt2][value];
                let item: DownloadTaskInfo = {
                    taskName: value,
                    taskUrl: url,
                    taskId: this.createHash('md5').update(value).update(url).update(Date.now().toString()).digest('hex'),
                    taskTarget: path.join(AssetDir, this.source, url.substring(url.lastIndexOf("/") + 1)),
                    taskDownloaded: false,
                    taskDownloading: false
                }
                this.store.newTask(item)
            })
            this.selectedOpt3 = []
        },
        compareString(a, b) {
            if (a.match(/\d+/) && b.match(/\d+/))
                return parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0])
            else
                return a.localeCompare(b)
        },
        deleteAll() {
            Object.keys(this.DownloadTasks).forEach(taskId => {
                useDownloadTasksStore().deleteTask(taskId)
            })
        },
        startAll() {
            Object.keys(this.DownloadTasks).forEach(taskId => {
                this.$refs[taskId][0].checkAndDownload()
            })
        }
    },
})
</script>
<style scoped>

</style>