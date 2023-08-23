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
                            <n-popover :show="this.focusing&&!!this.checkRes" placement="top-end" scrollable
                                       trigger="manual">
                                <template #trigger>
                                    <n-input v-model:value="this.data.ContentT" :allow-input="(value)=>value.split('\n').length<=this.data.ContentO.split('\\N').length"
                                             :autosize="{maxRows:rowCount, minRows:rowCount}"
                                             :status="this.translationStatus"
                                             clearable
                                             placeholder="" show-count
                                             type="textarea" @contextmenu="this.handleContextMenu" @focusin="()=>{this.tCheck();this.focusing=true}"
                                             @focusout="()=>{this.focusing=false}"
                                             @update:value="this.tChanged"
                                    />
                                </template>
                                <template v-for="line in this.checkRes.split('\n')" :key="line">
                                    <n-text>{{ line }}</n-text>
                                    <br>
                                </template>
                            </n-popover>


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
import {defineComponent, nextTick} from "vue";
import {StoryEvent} from "../utils/data"

export default defineComponent({
    props: {"data": StoryEvent, "translated": String},
    emits: ['characterTranslated', "translationChanged"],
    data() {
        return {
            showDropdown: false,
            showCheckPop: false,
            focusing: false,
            x: 0,
            y: 0,
            rowCount: this.data ? this.data.ContentO.split('\\N').length : 0,
            rbOption: this.generatePopDown(),
            translationStatus: this.getInputStatus(),
            checkRes: this.checkText()
        }
    },
    methods: {
        cChanged(value) {
            this.$emit("characterTranslated", [this.data.CharacterO, value])
            this.$emit("translationChanged")
        },
        getInputStatus(text?: string) {
            if (!this.data?.ContentT || text)
                return 'error'
            else if ((this.data.ContentT.split('\n').length == this.rowCount))
                return 'success'
            else
                return 'warning'
        },
        tCheck() {
            this.checkRes = this.checkText()
            this.translationStatus = this.getInputStatus(this.checkRes)
        },
        tChanged() {
            this.$emit("translationChanged")
            this.rbOption = this.generatePopDown()
            this.tCheck()
        },
        generatePopDown() {
            let options: object[] = []
            let brackets = ['【】', '「」', '『』', '（）', '‘’', '“”', '()']

            if (this.data.ContentT) {
                brackets.forEach((value, index) => {
                    if (this.data.ContentT.includes(value[0]) || this.data.ContentT.includes(value[1])) {
                        let subOptions: object[] = []
                        for (let i = 0; i < brackets.length; i++) {
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

            let subOptions: object[] = []
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
        },
        checkText() {
            if (this.data?.Type != "Dialog") return ""
            let text: string = this.data.ContentT
            if (!text) return ""
            const replace = [['…', '...'], ['(', '（'], [')', '）'], [',', '，'], ['?', '？'], ['!', '！'], ['欸', '诶']]
            replace.forEach(value => {
                text = text.replaceAll(value[0], value[1])
            })

            let result: string[] = []
            let lines = text.split("\n")
            if (lines.indexOf("") != -1) result.push("存在空行")
            if (lines.length != this.rowCount) result.push("行数与原文不符")

            const normalEnd = ['、', '，', '。', '？', '！', '~', '♪', '☆', '—']
            const unusualEnd = ['）', '」', '』', '”']

            let checks = [false, false, false]
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i]
                if (!line) continue
                if (!checks[0]) {
                    if (normalEnd.indexOf(line[line.length - 1]) != -1) {
                        if (line.includes("...，") || line.includes("...。")) {
                            checks[0] = true
                            result.push("省略号后无需标点")
                        }
                    } else if (unusualEnd.indexOf(line[line.length - 1]) != -1) {
                        if (line.length > 1 && normalEnd.indexOf(line[line.length - 2]) != -1) {
                            checks[0] = true
                            result.push("句尾缺少标点")
                        }
                    } else {
                        if (line.endsWith('...')) {

                        } else {
                            checks[0] = true
                            result.push("句尾缺少标点")
                        }
                    }
                }
                if (!checks[1]) {
                    if (line.includes("—")) {
                        if ((line.split("—").length) != (line.split("——").length * 2 - 1))
                            checks[1] = true
                        result.push("破折号用双破折——或删除")
                    }
                }
                if (!checks[2]) {
                    if (line.replace('...', '…').length >= 30) {
                        checks[2] = true
                        result.push("单行过长，请删减或换行")
                    }
                }
            }
            this.data.ContentT = text
            return result ? result.join("\n") : ""
        }
    }
})
</script>
<style></style>