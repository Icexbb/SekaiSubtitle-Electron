<template>
    <n-card style="height: 100%;user-select: none;" content-style="padding: 1em;height:100%;" header-style="padding: 1em;"
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
            <n-card>
                <template #header>
                    下载任务列表
                </template>
                <template #default>
                    <n-space>
                        <template v-for="hash in Object.keys(this.downloadRequests)" :key="hash">
                            <DownloadRequest :hash="hash" :status="this.downloadRequests[hash]"
                                             :ref="hash"></DownloadRequest>
                        </template>
                    </n-space>
                </template>
                <template #action>
                    <n-space justify="end">
                        <n-button @click="this.deleteAll">删除全部</n-button>
                        <n-button @click="this.startAll">开始全部</n-button>
                    </n-space>
                </template>
            </n-card>
        </n-space>
    </n-card>
</template>
<script lang="ts">
import {defineComponent, ref} from "vue";
import {createHash} from "crypto";
import DownloadRequest from "../components/DownloadRequest.vue";

const dataSourceOpt = [
    {label: 'https://sekai.best/', value: "best",},
    {label: 'https://pjsek.ai/', value: "ai",}
]
export default defineComponent({
    components: {DownloadRequest},
    setup() {
        return {
            dataSourceOpt, createHash
        }
    },
    mounted() {
        this.updateTree()
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
            url: 'ws://localhost:50000/download/tasks',
            downloadRequests: ref({}),
            living: ref(true),
        }
    },
    methods: {
        updateTree(refresh = false) {
            this.treeLoading = true
            let url = `http://localhost:50000/download/update?` +
                `source=${this.source}&proxy=${this.proxy}&timeout=${this.timeout}&refresh=${refresh}`
            this.axios.get(url).then(result => {
                this.sourceList = result.data.data
                this.treeLoading = false
                this.updateOption1()
            })
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
            this.selectOption2 = []
            if (this.selectedOpt1)
                Object.keys(this.sourceList[this.selectedOpt1]).sort(this.compareString).forEach((value) => {
                    this.selectOption2.push({label: value, value: value})
                })
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
            this.selectOption3.forEach((item) => {
                this.selectedOpt3.push(item.label)
            })
        },
        addDownloadRequests() {
            this.selectedOpt3.forEach((value) => {
                let item = {
                    name: value,
                    url: this.sourceList[this.selectedOpt1][this.selectedOpt2][value],
                }
                item['hash'] = this.createHash('md5').update(item.name)
                    .update(item.url).update(Date.now().toString()).digest('hex')
                this.axios.post("http://localhost:50000/download/new", item)
            })
            this.selectedOpt3 = []
        },
        compareString(a, b) {
            if (a.match(/\d+/) && b.match(/\d+/))
                return parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0])
            else
                return a.localeCompare(b)
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
            this.webSocket.send(JSON.stringify({type: "alive"}));
        },
        webSocketOnMessage(res) {
            const data = JSON.parse(res.data)
            if (data['type'] === 'tasks') {
                this.downloadRequests = data['data']
            }
            this.webSocket.send(JSON.stringify({type: "alive"}));
        },
        webSocketOnClose() {
            if (this.webSocket)
                this.webSocket.close()
            if (this.living) {
                setTimeout(this.initSocket, 100)
                console.log("WebSocket Closed Unexpectedly")
                this.downloadRequests = {}
            }
        },
        webSocketOnError(res) {
            console.log('websocket连接失败');
            console.log(res);
        },
        deleteAll() {
            Object.keys(this.downloadRequests).forEach(taskId => {
                this.axios.post(`http://localhost:50000/download/delete/${taskId}`)
            })
        },
        startAll() {
            Object.keys(this.downloadRequests).forEach(taskId => {
                const obj = this.$refs[taskId][0]
                if (!obj.status)
                    obj.download()
            })
        }
    },
    created() {
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

</style>