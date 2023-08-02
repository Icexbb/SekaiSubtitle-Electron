<template>
    <n-card>
        <template #default>
            <template v-if="data?.Type!='Period'">
                <n-grid :x-gap="12" :y-gap="8" :cols="12">
                    <n-gi :span="3" v-if="data?.Type=='Dialog'">
                        <n-input type="textarea" :value="this.data.CharacterO" readonly/>
                        <n-input type="textarea" v-model:value="this.data.CharacterT" clearable
                                 :disabled="this.data.CharacterO.length==0"/>
                    </n-gi>
                    <n-gi :span="9" :offset="data?.Type=='Dialog'?0:3">
                        <n-input type="textarea" :value="this.data.ContentO.replaceAll('\\N','\n')" readonly/>
                        <n-input type="textarea" v-model:value="this.data.ContentT" clearable/>
                    </n-gi>
                </n-grid>
            </template>
            <template v-else>
                <n-space align="center" vertical>
                        <n-text>{{'--------------'}}</n-text>
                </n-space>
            </template>
        </template>
    </n-card>
</template>
<script lang="ts">
import {defineComponent} from "vue";
import {StoryEvent} from "../utils/data"

export default defineComponent({
    props: {"data": StoryEvent}
})
</script>
<style></style>