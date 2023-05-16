<template>
    <div class="container">
        <n-layout class="home">
            <img class="home-logo" src="../assets/icon.png" alt="Sekai Subtitle">
            <n-row>
                <n-gradient-text
                        :gradient="this.titleGradient">
                    Sekai Subtitle
                </n-gradient-text>
            </n-row>
            <n-divider/>
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
        </n-layout>
    </div>
</template>

<script lang="ts">
import {defineComponent} from "vue";

export default defineComponent({
    data() {
        return {
            titleGradient: "linear-gradient(90deg, rgb(255,90,87) 0%,rgb(251,204,43) 33%, rgb(19,201,255) 66%, rgb(70,102,255) 100%)"
        }
    }
})
</script>
<style scoped>
.container {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.home {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
}

.home-logo {
    height: 100px;
    align-items: center;
    justify-content: center;

}
</style>