<template>
    <n-card>
        <template #default>
            <template v-if="data?.Type!='Period'">
                <n-grid :x-gap="12" :y-gap="8" :cols="12">
                    <n-gi :span="3" v-if="data?.Type=='Dialog'">
                        <n-space justify="center" vertical style="height: 100%">
                            <n-space justify="space-around" align="center">
                                <n-image v-if="this.data?.CharacterId>0 && this.data?.CharacterId<31"
                                         :src="`src/assets/characters/chr_${this.data?.CharacterId}.png`"
                                         height="24" preview-disabled
                                />
                                <n-text>{{ this.data.CharacterO }}</n-text>
                            </n-space>
                            <n-input type="text" clearable placeholder=""
                                     v-model:value="this.data.CharacterT"
                                     :disabled="this.data.CharacterO.length==0"
                                     @update:value="cChanged"
                            >
                            </n-input>
                        </n-space>
                    </n-gi>
                    <n-gi :span="9" :offset="data?.Type=='Dialog'?0:3">
                        <n-space vertical :size="0">
                            <n-input type="textarea" :value="this.data.ContentO.replaceAll('\\N','\n')"
                                     :autosize="{maxRows:rowCount, minRows:rowCount}"
                                     readonly :autofocus="false">
                            </n-input>
                            <n-input type="textarea" :value="this.translated.replaceAll('\\N','\n')" v-if="this.translated"
                                     :autosize="{maxRows:rowCount, minRows:rowCount}"
                                     readonly :autofocus="false">
                            </n-input>
                            <n-input type="textarea" v-model:value="this.data.ContentT"
                                     :autosize="{maxRows:rowCount, minRows:rowCount}"
                                     :allow-input="(value)=>value.split('\n').length<=this.data.ContentO.split('\\N').length"
                                     show-count clearable placeholder=""
                                     @update:value="tChanged"
                            />
                        </n-space>
                    </n-gi>
                </n-grid>
            </template>
            <template v-else>
                <n-space align="center" vertical>
                    <n-text>{{ '--------------' }}</n-text>
                </n-space>
            </template>
        </template>
    </n-card>
</template>
<script lang="ts">
import {defineComponent} from "vue";
import {StoryEvent} from "../utils/data"

export default defineComponent({
    props: {"data": StoryEvent, "translated": String},
    emits: ['characterTranslated', "translationChanged"],
    data(){
        return{
            rowCount:this.data?this.data.ContentO.split('\\N').length:0
        }
    },
    methods: {
        cChanged(value) {
            this.$emit("characterTranslated", [this.data.CharacterO, value])
            this.$emit("translationChanged")
        },
        tChanged() {
            this.$emit("translationChanged")
        }
    }
})
</script>
<style></style>