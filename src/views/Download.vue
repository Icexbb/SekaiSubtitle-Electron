<template>
    <n-card style="height: 100%;" content-style="padding: 1em;height:100%;" header-style="padding: 1em;"
            :segmented="false">
        <template #header>
            <n-page-header class="header" title="数据下载">
                <template #default>
                    <n-input-group>
                        <n-input-group-label>数据源</n-input-group-label>
                        <n-select
                                :options="this.dataSourceOpt" :default-value="'https://sekai.best/'"
                                v-model:value="this.source" @update:value="()=>{this.updateTree(false)}"
                        />
                        <n-button @click="()=>{this.updateTree(true)}">刷新</n-button>
                    </n-input-group>
                </template>
            </n-page-header>
        </template>
        <n-grid :cols="2" style="height:100%" item-style="height:100%">
            <n-gi>
                <n-space vertical :wrap-item="false" style="height:100%" justify="space-between">
                    <n-space ertical :wrap-item="false" justify="start">
                        <n-input-group>
                            <n-input-group-label>
                                {{ this.groupLabel1 }}
                            </n-input-group-label>
                            <n-select :loading="this.treeLoading" style="width: 100%;"></n-select>
                        </n-input-group>
                        <n-input-group>
                            <n-input-group-label>
                                {{ this.groupLabel2 }}
                            </n-input-group-label>
                            <n-select :loading="this.treeLoading" style="width: 100%;"></n-select>
                        </n-input-group>
                        <n-input-group>
                            <n-input-group-label>
                                {{ this.groupLabel3 }}
                            </n-input-group-label>
                            <n-select :loading="this.treeLoading" style="width: 100%;"></n-select>
                        </n-input-group>
                    </n-space>
                    <n-space :wrap-item="false" justify="end">
                        <n-button>
                            添加下载任务
                        </n-button>
                    </n-space>
                </n-space>
            </n-gi>
        </n-grid>
    </n-card>
</template>
<script>
import {defineComponent} from "vue";

const dataSourceOpt = [
    {label: 'https://sekai.best/', value: "best",},
    {label: 'https://pjsek.ai/', value: "ai",}
]
export default defineComponent({
    setup() {
        return {
            dataSourceOpt
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
            groupLabel2: '剧情期数',
            groupLabel3: '剧情话数',
        }
    },
    methods: {
        updateTree(refresh = false) {
            this.treeLoading = true
            let url = `http://localhost:50000/update?` +
                `source=${this.source}&proxy=${this.proxy}&timeout=${this.timeout}&refresh=${refresh}`
            this.axios.get(url).then(result => {
                this.sourceList = result.data.data
                this.treeLoading = false
            })

        }
    }
})
</script>
<style scoped>

</style>