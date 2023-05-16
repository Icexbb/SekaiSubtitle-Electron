<template>
    <n-layout has-sider class="app full-height">
        <n-layout-sider
                bordered
                collapse-mode="width"
                :collapsed-width="64"
                :width="240"
                :collapsed="collapsed"
                show-trigger
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
        label: () => h(
            RouterLink, {to: {name: "Translate"}}, {default: () => "剧情翻译"}
        ),
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
        disabled: true,
        icon: renderIcon(SettingsRound)
    },
]
export default defineComponent({
    setup() {
        return {
            collapsed: ref(true),
            menuOptions,
        }
    }
})
</script>
<style>

</style>
