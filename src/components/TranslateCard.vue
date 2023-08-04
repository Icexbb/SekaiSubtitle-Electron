<template>
    <n-card hoverable>
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
                                     :status="!this.data.CharacterT?'error':'success'"

                            >
                            </n-input>
                        </n-space>
                    </n-gi>
                    <n-gi :span="data?.Type=='Dialog'?9:8" :offset="data?.Type=='Dialog'?0:2">
                        <n-space vertical :size="0">
                            <n-input type="textarea" :value="this.data.ContentO.replaceAll('\\N','\n')"
                                     :autosize="{maxRows:rowCount, minRows:rowCount}"
                                     readonly :autofocus="false"
                                     :style="{'text-align': data?.Type=='Dialog'?'left':'center'}"
                            >
                            </n-input>
                            <n-input type="textarea" :value="this.translated.replaceAll('\\N','\n')"
                                     v-if="this.translated"
                                     :autosize="{maxRows:rowCount, minRows:rowCount}"
                                     readonly :autofocus="false">
                            </n-input>
                            <n-input type="textarea" v-model:value="this.data.ContentT"
                                     :autosize="{maxRows:rowCount, minRows:rowCount}"
                                     :allow-input="(value)=>value.split('\n').length<=this.data.ContentO.split('\\N').length"
                                     :status="!this.data.ContentT?'error':(this.data.ContentT.split('\n').length==rowCount?'success':'warning')"
                                     @update:value="this.tChanged" @contextmenu="this.handleContextMenu"
                                     show-count clearable placeholder=""
                            />
                            <n-dropdown
                                    placement="bottom-start"
                                    trigger="manual"
                                    :x="x"
                                    :y="y"
                                    :options="this.rbOption"
                                    :show="showDropdown"
                                    :on-clickoutside="this.onClickOutside"
                                    @select="this.handleSelect"
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
import {defineComponent, nextTick, ref} from "vue";
import {StoryEvent} from "../utils/data"

export default defineComponent({
    props: {"data": StoryEvent, "translated": String},
    emits: ['characterTranslated', "translationChanged"],
    data() {
        const showDropdownRef = ref(false)
        const xRef = ref(0)
        const yRef = ref(0)
        return {
            showDropdown: showDropdownRef,
            x: xRef,
            y: yRef,
            rowCount: this.data ? this.data.ContentO.split('\\N').length : 0,
            rbOption: this.generatePopDown(),
        }
    },
    methods: {
        cChanged(value) {
            this.$emit("characterTranslated", [this.data.CharacterO, value])
            this.$emit("translationChanged")
        },
        tChanged() {
            this.$emit("translationChanged")
            this.rbOption = this.generatePopDown()
        },
        generatePopDown() {
            let options = []
            let brackets = ['【】', '「」', '『』', '（）', '‘’', '“”', '()']

            if (this.data.ContentT) {
                brackets.forEach((value, index) => {
                    if (this.data.ContentT.includes(value[0]) || this.data.ContentT.includes(value[1])) {
                        let subOptions = []
                        for (const i in brackets) {
                            if (i != index)
                                subOptions.push({label: `${brackets[i]}`, key: `replace-${value}-${brackets[i]}`})
                        }
                        options.push({
                            label: `将${value}替换为...`,
                            key: `replace-${value}`,
                            children: subOptions
                        })
                    }
                })
            }

            let subOptions = []
            brackets.forEach((value) => {
                subOptions.push({label: `${value}`, key: `add-${value}`})
            })
            options.push(
                {label: `添加一对...`, key: `add`, children: subOptions}
            )
            return options
        },
        handleSelect(key: string) {
            let keyArr: string[] = key.split('-')
            if (keyArr[0] == 'add') {
                this.data.ContentT += keyArr[1]
            } else if (keyArr[0] == 'replace') {
                let to = keyArr[1]
                let from = keyArr[2]
                this.data.ContentT = this.data.ContentT.replaceAll(to[0], from[0])
                this.data.ContentT = this.data.ContentT.replaceAll(to[1], from[1])
            }
            this.showDropdown = false
            this.rbOption = this.generatePopDown()
        },
        handleContextMenu(e: MouseEvent) {
            e.preventDefault()
            this.showDropdown = false
            nextTick().then(() => {
                this.showDropdown = true
                this.x = e.clientX
                this.y = e.clientY
            })
        },
        onClickOutside() {
            this.showDropdown = false
        }
    }
})
</script>
<style></style>