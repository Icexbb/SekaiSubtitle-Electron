<template>
    <n-layout has-sider class="app full-height">
        <n-layout-sider
                bordered
                collapse-mode="width"
                :collapsed-width="64"
                :width="240"
                :collapsed="collapsed"
                :show-trigger="false"
                @collapse="collapsed = true"
                @expand="collapsed = false"
        >
            <n-menu
                    :collapsed="collapsed"
                    :collapsed-width="64"
                    :collapsed-icon-size="22"
                    :options="menuOptions"
            />
        </n-layout-sider>
        <n-layout-content>
            <router-view></router-view>
        </n-layout-content>
    </n-layout>
</template>
<script lang="ts">
import {defineComponent, h, ref} from "vue";
import {NIcon} from "naive-ui";
import {RouterLink} from "vue-router";
import {HomeRound, SubtitlesRound, DownloadRound, SettingsRound, TranslateRound} from "@vicons/material"

function renderIcon(icon) {
    return () => h(NIcon, null, {default: () => h(icon)});
}

const menuOptions = [
    {
        label: () => h(
            RouterLink, {to: {name: "Home"}}, {default: () => "首页"}
        ),
        key: "Home",
        icon: renderIcon(HomeRound)
    },
    {key: 'divider-1', type: 'divider'},
    {
        label: () => h(
            RouterLink, {to: {name: "Subtitle"}}, {default: () => "自动轴机"}
        ),
        key: "Subtitle",
        icon: renderIcon(SubtitlesRound)
    },
    {
        label: () => h(
            RouterLink, {to: {name: "Download"}}, {default: () => "数据下载"}
        ),
        key: "Download",
        icon: renderIcon(DownloadRound)
    }, {
        label:"剧情翻译",
        //     () => h(
        //     RouterLink, {to: {name: "Translate"}}, {default: () => "剧情翻译"}
        // ),
        key: "Translate",
        disabled: true,
        icon: renderIcon(TranslateRound)
    },
    {key: 'divider-2', type: 'divider'},
    {
        label: () => h(
            RouterLink, {to: {name: "Setting"}}, {default: () => "设置"}
        ),
        key: "Setting",
        icon: renderIcon(SettingsRound)
    },
]
export default defineComponent({
    setup() {
        return {
            collapsed: ref(true),
            menuOptions,
        }
    },
    methods: {
        initSocket() {
            this.webSocket = new WebSocket('ws://localhost:50000/alive')

            this.webSocket.onopen = () => {
                this.webSocket.send(JSON.stringify({type: "alive"}));
            }
            this.webSocket.onclose = () => {
                if (this.living) setTimeout(this.initSocket, 100);
            }
            this.webSocket.onmessage = () => {
                this.webSocket.send(JSON.stringify({type: "alive"}));
            }
            this.webSocket.onerror = (res) => {
                console.log('websocket连接失败', res);
            }
        },
    },
    created() {
        if (!this.webSocket)
            this.initSocket()
    },
    unmounted() {
        this.living = false
        try {
            if (this.webSocket)
                this.webSocket.send(JSON.stringify({type: "end"}));
                this.webSocket.close()
        } finally {
            this.webSocket = null
        }
    },
    data() {
        return {
            webSocket: null,
            living: true
        }
    }
})
</script>
<style>

</style>
