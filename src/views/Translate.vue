<template>
    <n-scrollbar v-if="this.loaded">

    </n-scrollbar>

    <n-card v-else style="height: 100%;">
        <template #default>
            <n-space vertical justify="center">
                <n-space justify="center">
                    <n-button @click="this.selectJson"></n-button>
                </n-space>
            </n-space>
        </template>

    </n-card>
</template>
<script lang="ts">
import {defineComponent} from 'vue'
import {ipcRenderer} from "electron";

export default defineComponent({
    name: "Translate",
    data() {
        return {
            loaded: false,
            dataFile: "",

        }
    },
    methods: {
        selectJson() {
            ipcRenderer.send("select-file-exist-story")
            ipcRenderer.once("selected-story", (event, args) => {
                if (!args.canceled) {
                    this.dataFile = args.filePaths[0]
                    console.log(this.dataFile)
                }
            })
        }
    },
    watch: {
        dataFile: function () {
            if (this.dataFile.length > 0) this.loaded = true;
        }
    }
})
</script>

<style scoped>

</style>