<template>
    <n-card style="height: 100%;user-select: none;" content-style="height:100%;"
            header-style="padding: 1em;"
            :segmented="false" class="full-height">
        <template #header><span> </span></template>
        <template #header-extra>
            <n-space v-if="!this.updating">
                <n-popover trigger="hover">
                    <template #trigger>
                        <n-button
                                :type="this.coreNeedUpdate?'warning':(this.coreConnected?'success':'tertiary')"
                                quaternary strong @click.left="this.showLog">
                            <template #icon>
                                <n-badge v-if="this.coreNeedUpdate">
                                    <n-icon>
                                        <PlugConnected20Filled v-if="this.coreConnected"/>
                                        <PlugDisconnected20Filled v-else/>
                                    </n-icon>
                                </n-badge>
                                <n-icon v-else>
                                    <PlugConnected20Filled v-if="this.coreConnected"/>
                                    <PlugDisconnected20Filled v-else/>
                                </n-icon>
                            </template>
                            <template #default>
                                内核版本 {{ this.coreVersion }}
                            </template>
                        </n-button>
                    </template>
                    <template #default>
                        显示内核操作台
                    </template>
                </n-popover>
                <n-popover trigger="hover">
                    <template #trigger>
                        <n-button :type="this.appNeedUpdate?'warning':'tertiary'"
                                  quaternary strong @click="this.showHomePage">
                            <template #icon>
                                <n-badge v-if="this.appNeedUpdate">
                                    <n-icon>
                                        <Apps20Regular/>
                                    </n-icon>
                                </n-badge>
                                <n-icon v-else>
                                    <Apps20Regular/>
                                </n-icon>
                            </template>
                            <template #default>
                                程序版本 {{ this.appVersion }}
                            </template>
                        </n-button>
                    </template>
                    <template #default>
                        前往GitHub项目页面
                    </template>
                </n-popover>
            </n-space>
        </template>
        <template #default>
            <n-space v-if="!this.updating" vertical justify="center"
                     style="justify-content: center;align-items: center;display:flex;text-align: center;height: 100%;"
            >
                <img class="home-logo" src="../assets/icon.png" alt="Sekai Subtitle" disabled :draggable="false">
                <n-gradient-text disabled
                                 :gradient="this.titleGradient" font-size="32">
                    Sekai Subtitle
                </n-gradient-text>
                <n-divider style="min-width: 250px;"/>
                <n-space justify="center">
                    <n-button @click="()=>{this.$router.push('/subtitle')}" :disabled="!this.coreConnected">
                        自动轴机
                    </n-button>
                    <n-button @click="()=>{this.$router.push('/download')}">
                        数据下载
                    </n-button>
                    <n-button @click="()=>{this.$router.push('/translate')}">
                        文档翻译
                    </n-button>
                </n-space>
            </n-space>
            <n-space v-else vertical justify="center"
                     style="justify-content: center;align-items: center;display:flex;text-align: center;height: 100%;"
            >
                <n-progress type="circle" :percentage="this.updateProgress" style="width: 150px;">
                    <img class="home-logo" src="../assets/icon.png" alt="Sekai Subtitle" disabled :draggable="false">
                </n-progress>
                <n-gradient-text :font-size="25">
                    {{ this.updateProgress.toFixed(1) }}%{{ "\t" }}{{ this.downloadRate }}
                </n-gradient-text>
            </n-space>
        </template>
    </n-card>
    <n-modal :show="this.showModal" closable>
        <n-card style="width: 80%" title="内核日志" role="dialog" aria-modal="true" closable
                @close="this.showModal=false">
            <n-scrollbar style=" max-height: 300px">
                <n-log style="height: max-content; max-height: 300px;" :log="this.logs.join('\n')"/>
            </n-scrollbar>
            <template #action>
                <n-space justify="end">
                    <n-button @click="this.getLatestCore" v-if="this.coreNeedUpdate">下载最新内核</n-button>
                    <n-button @click="this.showCorePath">打开内核文件夹</n-button>
                    <n-button @click="this.showCorePage">打开内核发布页</n-button>
                </n-space>
            </template>
        </n-card>
    </n-modal>
</template>

<script lang="ts">
import {defineComponent} from "vue";
import {ipcRenderer} from "electron";
import {PlugConnected20Filled, PlugDisconnected20Filled, Apps20Regular} from "@vicons/fluent"
import {shell} from "electron"
import path from "path";
import * as semver from "semver"
import {downloadLatestCore} from "../utils/core";


export default defineComponent({
    components: {PlugConnected20Filled, PlugDisconnected20Filled, Apps20Regular},
    data() {
        return {
            titleGradient: "linear-gradient(90deg, rgb(255,90,87) 0%,rgb(251,204,43) 33%, rgb(19,201,255) 66%, rgb(70,102,255) 100%)",
            coreVersion: "",
            latestCoreVersion: "",
            coreNeedUpdate: false,
            appVersion: "",
            latestAppVersion: "",
            appNeedUpdate: false,
            coreConnected: false,
            showModal: false,
            logs: [],
            updating: false,

            updateProgress: 0,
            downloadRate: ""
        }
    },
    methods: {
        getAppVersion() {
            ipcRenderer.send("get-core-version")
            ipcRenderer.on("get-core-version-result", (event, args) => {
                try {
                    this.coreNeedUpdate = false
                    this.coreVersion = args[0]
                    if (this.coreVersion) {
                        this.latestCoreVersion = args[1]
                        if (semver.gt(this.latestCoreVersion, this.coreVersion, true)) {
                            this.coreNeedUpdate = true
                        }
                    } else {
                        this.coreVersion = "未安装"
                        this.coreNeedUpdate = true
                    }
                } catch (e) {
                    this.coreNeedUpdate = true
                }
            })
            ipcRenderer.send("get-app-version")
            ipcRenderer.on("get-app-version-result", (event, args) => {
                try {
                    this.appVersion = 'v' + args[0]
                    this.latestAppVersion = args[1]
                    if (semver.gt(this.latestAppVersion, this.appVersion, true)) {
                        this.appNeedUpdate = true
                    }
                } catch (e) {
                    this.appNeedUpdate = true
                }
            })

        },
        showLog() {
            this.logs = []
            ipcRenderer.send("get-core-logs")
            ipcRenderer.once("get-core-logs-result", (event, args: string[]) => {
                this.logs = args
                this.showModal = true
            })
        },
        setTimeoutAlive() {
            ipcRenderer.send("get-core-alive");
            setTimeout(() => {
                this.setTimeoutAlive();
            }, 1000);
        },
        showHomePage() {
            shell.openExternal("https://github.com/Icexbb/SekaiSubtitle-Electron")
        },
        showCorePath() {
            shell.openPath(path.dirname(ipcRenderer.sendSync("get-core-path")))
        },
        showCorePage() {
            shell.openExternal("https://github.com/Icexbb/SekaiSubtitle-Core-GO/releases/latest")
        },
        getLatestCore() {
            this.showModal = false;
            this.updating = true;
            const ProgressShow = (event) => {
                this.updateProgress = event.progress * 100
                let speed = event.rate / 1024
                this.downloadRate = `${speed}KB/s`
                if (speed > 1024) this.downloadRate = `${speed / 1024}MB/s`
            }
            downloadLatestCore(ProgressShow).catch((err) => {
                alert(`在下载最新内核时发生错误：${err}\n请重试或者手动下载替换内核。`)
            }).finally(() => {
                this.updating = false;
                ipcRenderer.send("get-core-version")
            })
        }
    },
    mounted() {
        this.getAppVersion();
        this.setTimeoutAlive();
        ipcRenderer.on('get-core-alive-result', (event, args) => {
            this.coreConnected = args
        })
    },
    unmounted() {
        ipcRenderer.removeAllListeners("get-core-version-result")
    }
})
</script>
<style scoped>
.home-logo {
    height: 100px;
    align-items: center;
    justify-content: center;

}
</style>