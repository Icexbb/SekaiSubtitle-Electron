<template>
    <n-layout has-sider class="app">
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
<script>
import {defineComponent, h, ref} from "vue";
import {NIcon, useMessage} from "naive-ui";
import {RouterLink} from "vue-router";
import {HomeRound, SubtitlesRound, DownloadRound} from "@vicons/material"

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
    },
    // {
    //     label: () => h(
    //         RouterLink,
    //         {to: {name: "Download",}},
    //         {default: () => "首页"}
    //     ),
    //     key: "Download",
    // },
    // {
    //     label: () => h(
    //         RouterLink,
    //         {to: {name: "Translate",}},
    //         {default: () => "首页"}
    //     ),
    //     key: "Translate",
    // },
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
.app {
    height: 100%;

}
</style>
