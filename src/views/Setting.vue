<template>
    <n-scrollbar>
        <n-space vertical item-style="padding: 1em">
            <n-page-header class="header" title="设置">
                <template #extra>
                    <n-popover :show="this.settingSaved">
                        <template #trigger>
                            <n-button @click="this.saveConfig">应用设置</n-button>
                        </template>
                        <template #default>
                            设置已保存
                        </template>
                    </n-popover>
                </template>
            </n-page-header>
            <n-collapse accordion default-expanded-names="自动轴机">
                <n-collapse-item title="数据下载">
                    <n-card hoverable>
                        <n-space :wrap="false" :wrap-item="false" justify="space-between" style="width: 100%;">
                            <n-text class="center">下载代理</n-text>
                            <n-input-group style="width: min-content">
                                <n-select style="width: 100px;" :options="this.proxySchemeOption"
                                          v-model:value="this.settingProxyScheme"/>
                                <n-input v-model:value="this.settingProxyHost"
                                         v-if="this.settingProxyScheme!='none'&&this.settingProxyScheme!='system'"
                                         style="width: 120px;height: 34px;"/>
                                <n-input-number
                                        style="width: 100px;" :min="1" :max="65535"
                                        v-if="this.settingProxyScheme!='none'&&this.settingProxyScheme!='system'"
                                        v-model:value="this.settingProxyPort"
                                        @wheel="e=>{
                                            this.settingProxyPort=Math.min(Math.max(1,this.settingProxyPort+Math.sign(e.deltaY)),65535)
                                        }"
                                />
                            </n-input-group>
                        </n-space>
                    </n-card>
                </n-collapse-item>
                <n-collapse-item title="自动轴机" name="自动轴机">
                    <n-space :wrap-item="false">
                        <n-card hoverable>
                            <n-space justify="space-between" style="width: 100%;">
                                <n-text>默认立即开始任务</n-text>
                                <n-switch v-model:value="this.settingSubtitleRunAfterCreate"></n-switch>
                            </n-space>
                        </n-card>
                        <n-card hoverable>
                            <n-space justify="space-between" style="width: 100%;">
                                <n-text>默认覆盖生成</n-text>
                                <n-switch v-model:value="this.settingSubtitleAlwaysOverwrite"></n-switch>
                            </n-space>
                        </n-card>
                        <n-card hoverable>
                            <n-space justify="space-between" style="width: 100%;">
                                <n-text>允许使用自定义字体</n-text>
                                <n-switch v-model:value="this.settingSubtitleCustomFontSettable"></n-switch>
                            </n-space>
                        </n-card>
                        <n-card hoverable>
                            <n-space :wrap="false" :wrap-item="false" justify="space-between" style="width: 100%;">
                                <n-text class="center">
                                    打字机特效时间
                                </n-text>
                                <n-space justify="end" style="width: min-content">
                                    <n-input-number
                                            v-model:value="this.settingSubtitleTyperFade"
                                            style="width: 175px"
                                            @wheel="(e)=>{
                                                this.settingSubtitleTyperFade=Math.min(Math.max(0,this.settingSubtitleTyperFade+Math.sign(e.deltaY)*10),this.settingSubtitleTyperInterval)}"
                                            :step="10" :min="0" :max="this.settingSubtitleTyperInterval">
                                      <template #prefix><span style="color: rgb(128,128,128)">渐变时间</span></template>
                                        <template #suffix>ms</template>
                                    </n-input-number>
                                    <n-input-number
                                            style="width: 175px"
                                            @wheel="(e)=>{
                                                this.settingSubtitleTyperInterval=Math.max(this.settingSubtitleTyperFade,this.settingSubtitleTyperInterval+Math.sign(e.deltaY)*10);}"
                                            v-model:value="this.settingSubtitleTyperInterval"
                                            :step="10" :min="this.settingSubtitleTyperFade">
                                      <template #prefix><span style="color: rgb(128,128,128)">字符间隔</span></template>
                                        <template #suffix>ms</template>
                                    </n-input-number>
                                </n-space>
                            </n-space>
                        </n-card>
                    </n-space>
                </n-collapse-item>
            </n-collapse>
        </n-space>
    </n-scrollbar>
</template>
<script lang="ts">
import {defineComponent} from 'vue'
import {ipcRenderer} from "electron";

const proxySchemeOption = [
    {label: '无', value: 'none'},
    {label: 'http://', value: 'http'},
    {label: 'https://', value: 'https'},
    {label: 'socks4://', value: 'socks4'},
    {label: 'socks5://', value: 'socks5'},
    {label: '系统代理', value: 'system'},
]
export default defineComponent({
    name: "Setting",
    setup() {
        return {
            proxySchemeOption,
        }
    },
    mounted() {
        this.reloadConfig()
    },
    updated() {
        this.reloadConfig()
    },
    data() {
        return {
          settingProxyScheme: 'none',
            settingProxyHost: '127.0.0.1',
            settingProxyPort: 1080,
            settingSubtitleRunAfterCreate: false,
            settingSubtitleAlwaysOverwrite: false,
            settingSubtitleTyperFade: 50,
            settingSubtitleTyperInterval: 80,
            settingSubtitleCustomFontSettable: false,
            settingSaved: false
        }
    },
    methods: {
        createSettingConfig() {
            let proxy: string | null;
            switch (this.settingProxyScheme) {
                case "none":
                    proxy = null;
                    break;
                case "system":
                    proxy = "system";
                    break;
                default:
                    proxy = `${this.settingProxyScheme}://${this.settingProxyHost}:${this.settingProxyPort}`
            }
            return {
                ProxyScheme: this.settingProxyScheme,
                ProxyHost: this.settingProxyHost,
                ProxyPort: this.settingProxyPort,
                proxy: proxy,
                SubtitleAlwaysOverwrite: this.settingSubtitleAlwaysOverwrite,
                SubtitleRunAfterCreate: this.settingSubtitleRunAfterCreate,
                SubtitleTyperFade: this.settingSubtitleTyperFade,
                SubtitleTyperInterval: this.settingSubtitleTyperInterval,
                SubtitleCustomFontSettable: this.settingSubtitleCustomFontSettable
            }
        },
        saveConfig() {
            ipcRenderer.send('save-setting', this.createSettingConfig())
            this.settingSaved = true
            setTimeout(() => {
                this.settingSaved = false
            }, 3000)
        },
        reloadConfig() {
            ipcRenderer.send('get-setting')
            ipcRenderer.once('get-setting-result', (event, args) => {
                this.settingProxyScheme = args['ProxyScheme']
                this.settingProxyHost = args['ProxyHost']
                this.settingProxyPort = args['ProxyPort']
                this.settingSubtitleAlwaysOverwrite = args['SubtitleAlwaysOverwrite']
                this.settingSubtitleRunAfterCreate = args['SubtitleRunAfterCreate']
                this.settingSubtitleTyperFade = args['SubtitleTyperFade']
                this.settingSubtitleTyperInterval = args['SubtitleTyperInterval']
                this.settingSubtitleCustomFontSettable = args['SubtitleCustomFontSettable']
            })
        }
    },
    unmounted() {
        ipcRenderer.removeAllListeners('get-setting-result')
    }

})
</script>

<style scoped>

</style>