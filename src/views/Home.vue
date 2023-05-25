<template>
    <n-card style="height: 100%;user-select: none;" content-style="height:100%;"
            header-style="padding: 1em;"
            :segmented="false" class="full-height">
        <template #header><span> </span></template>
        <template #header-extra>
            <n-popover trigger="hover">
                <template #trigger>
                    <n-button :type="this.coreConnected?'success':'tertiary'" quaternary strong
                              @click="this.showLog">
                        <template #icon>
                            <n-icon>
                                <PlugConnected20Filled v-if="this.coreConnected"/>
                                <PlugDisconnected20Filled v-else/>
                            </n-icon>
                        </template>
                        <template #default>
                            内核版本号 {{ this.coreVersion }}
                        </template>
                    </n-button>
                </template>
                <template #default>
                    显示内核日志
                </template>
            </n-popover>
            <n-popover trigger="hover">
                <template #trigger>
                    <n-button type="tertiary" quaternary strong @click="this.showHomePage">
                        <template #icon>
                            <n-icon>
                                <Apps20Regular/>
                            </n-icon>
                        </template>
                        <template #default>
                            程序版本号 {{ this.frontVersion }}
                        </template>
                    </n-button>
                </template>
                <template #default>
                    前往GitHub项目页面
                </template>
            </n-popover>
        </template>
        <template #default>
            <n-space vertical justify="center"
                     style="justify-content: center;align-items: center;display:flex;text-align: center;height: 100%;"
            >
                <img class="home-logo" src="../assets/icon.png" alt="Sekai Subtitle" disabled>
                <n-gradient-text disabled
                                 :gradient="this.titleGradient" font-size="32">
                    Sekai Subtitle
                </n-gradient-text>
                <n-divider style="min-width: 250px;"/>
                <n-space justify="center">
                    <n-button @click="()=>{this.$router.push('/subtitle')}">
                        自动轴机
                    </n-button>
                    <n-button @click="()=>{this.$router.push('/download')}">
                        数据下载
                    </n-button>
                    <n-button @click="()=>{this.$router.push('/translate')}" disabled>
                        文档翻译
                    </n-button>
                </n-space>
            </n-space>
        </template>
    </n-card>
    <n-modal v-model:show="this.showModal">
        <n-card style="width: 80%" title="内核日志" role="dialog" aria-modal="true">
            <n-log :log=" this.logs.join('\n') "/>
        </n-card>
    </n-modal>
</template>

<script lang="ts">
import {defineComponent} from "vue";
import {ipcRenderer} from "electron";
import {PlugConnected20Filled, PlugDisconnected20Filled, Apps20Regular} from "@vicons/fluent"
import {shell} from "electron"

export default defineComponent({
    components: {PlugConnected20Filled, PlugDisconnected20Filled, Apps20Regular},
    data() {
        return {
            titleGradient: "linear-gradient(90deg, rgb(255,90,87) 0%,rgb(251,204,43) 33%, rgb(19,201,255) 66%, rgb(70,102,255) 100%)",
            coreVersion: "",
            frontVersion: "",
            coreConnected: false,
            showModal: false,
            logs: []
        }
    }, methods: {
        getAppVersion() {
            ipcRenderer.send("get-core-version")
            ipcRenderer.once("get-core-version-result", (event, args) => {
                this.coreVersion = args
            })
            ipcRenderer.send("get-app-version")
            ipcRenderer.once("get-app-version-result", (event, args) => {
                this.frontVersion = "v" + args
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
            setTimeout(() => {
                ipcRenderer.send("get-core-alive");
                this.setTimeoutAlive();
            }, 1000);
        }, showHomePage() {
            shell.openExternal("https://github.com/Icexbb/SekaiSubtitle-Electron")
        }
    },
    created() {
        this.getAppVersion();
        ipcRenderer.send("get-core-alive");
        this.setTimeoutAlive();
        ipcRenderer.on('get-core-alive-result', (event, args) => {
            this.coreConnected = args
        })
    },
})
</script>
<style scoped>
.home-logo {
    height: 100px;
    align-items: center;
    justify-content: center;

}
</style>