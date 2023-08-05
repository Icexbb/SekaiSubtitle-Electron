<template>
    <n-message-provider>
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
                <router-view v-slot="{ Component }">
                    <component :is="Component"/>
                </router-view>
            </n-layout-content>
        </n-layout>
    </n-message-provider>
</template>
<script lang="ts">
import {defineComponent, h, ref} from "vue";
import {NIcon} from "naive-ui";
import {RouterLink} from "vue-router";
import {HomeRound, SubtitlesRound, DownloadRound, SettingsRound, TranslateRound} from "@vicons/material"
import {ipcRenderer} from "electron";

let coreExist: boolean = ipcRenderer.sendSync("get-core-exist")

function renderIcon(icon, props?) {
    return () => h(NIcon, props, {default: () => h(icon)});
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
            RouterLink,
            coreExist ? {to: {name: "Subtitle"}} : {to: {name: ""}, disabled: !coreExist},
            {default: () => "自动轴机"}
        ),
        key: "Subtitle",
        icon: renderIcon(SubtitlesRound, {disabled: !coreExist}),
        disabled: !coreExist
    },
    {
        label: () => h(
            RouterLink, {to: {name: "Download"}}, {default: () => "数据下载"}
        ),
        key: "Download",
        icon: renderIcon(DownloadRound)
    }, {
        label:
            () => h(
                RouterLink, {to: {name: "Translate"}}, {default: () => "剧情翻译"}
            ),
        key: "Translate",
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
})
</script>
<style>
</style>
