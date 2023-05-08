<template>
    <n-card
            style="margin: 2em"
            size="huge"
            role="dialog"
            aria-modal="true"
            closable
            @close="this.modalClose"
    >
        <template #header>
            <span>创建新任务</span>
        </template>
        <template #default>
            <n-space vertical :wrap-item="false">
                <n-collapse :default-expanded-names="['基本信息']">
                    <n-collapse-item title="基本信息" name="基本信息">
                        <n-space :wrap="false" :wrap-item="false" justify="space-between">
                            <n-input-group>
                                <n-input-group-label>
                                    视频文件
                                </n-input-group-label>
                                <n-input
                                        clearable readonly
                                        v-model:value="this.config_video_file"
                                        type="text" placeholder="视频文件"
                                />
                                <n-button
                                        @click="this.selectVideo">浏览
                                </n-button>
                            </n-input-group>
                            <n-collapse-transition :show="!this.config_video_only">

                                <n-input-group>
                                    <n-input-group-label>
                                        数据文件
                                    </n-input-group-label>
                                    <n-input
                                            clearable readonly
                                            v-model:value="this.config_json_file"
                                            type="text" placeholder="数据文件"
                                    ></n-input>
                                    <n-button
                                            @click="this.selectJson">浏览
                                    </n-button>
                                </n-input-group>
                            </n-collapse-transition>
                            <n-collapse-transition :show="!this.config_video_only">
                                <n-input-group>
                                    <n-input-group-label>
                                        翻译文件
                                    </n-input-group-label>
                                    <n-input
                                            clearable readonly
                                            v-model:value="this.config_translate_file"
                                            type="text" placeholder="翻译文件"
                                    ></n-input>
                                    <n-button
                                            @click="this.selectTranslate">浏览
                                    </n-button>
                                </n-input-group>
                            </n-collapse-transition>
                        </n-space>
                    </n-collapse-item>
                    <n-collapse-item title="高级选项">
                        <n-space :wrap-item="false" justify="space-between">
                            <n-statistic label="覆盖生成">
                                <template #default>
                                    <n-switch v-model:value="this.config_overwrite" rubber-band/>
                                </template>
                            </n-statistic>

                            <n-statistic label="仅使用视频">
                                <template #default>
                                    <n-switch v-model:value="this.config_video_only" rubber-band/>
                                </template>
                            </n-statistic>
                            <n-statistic label="自定义字体">
                                <n-select
                                        style="width: 150px;" filterable clear-filter-after-select
                                        v-model:value="this.config_font" :options="this.systemFontsOptions"
                                ></n-select>
                            </n-statistic>
                            <n-statistic label="打字机特效间隔">
                                <n-space :wrap-item="false">
                                    <n-input-number
                                            style="width: 100px;"
                                            v-model:value="this.config_type_interval_1"
                                            :min="0" :max="this.config_type_interval_2"
                                    />
                                    <n-input-number
                                            style="width: 100px;"
                                            v-model:value="this.config_type_interval_2"
                                            :min="this.config_type_interval_1" :max="200"
                                    />
                                </n-space>
                            </n-statistic>

                        </n-space>
                        <n-space :wrap-item="false" v-if="this.video_frame_count">
                            <n-statistic style="width: 100%" label="视频处理区间">
                                <n-slider
                                        size="small" :format-tooltip="formatTooltip"
                                        v-model:value="this.config_duration" range :step="1"
                                        :max="this.video_frame_count"/>
                            </n-statistic>
                        </n-space>
                    </n-collapse-item>
                    <n-collapse-item title="Staff行">
                        <template #header-extra>
                            <span> {{ this.config_staff.length ? `已添加${this.config_staff.length}条` : '' }} </span>
                        </template>
                        <template #default>
                            <n-space vertical>
                                <n-grid :cols="this.staff_staff||this.staff_prefix||this.staff_suffix?2:1"
                                        :item-style="{'margin-inline':'1em'}">
                                    <n-gi>
                                        <n-space vertical :wrap-item="false">
                                            <n-space justify="center" align="center">
                                                <n-switch :rail-style="railStyle" size="medium" :default-value="true"
                                                          v-model:value=this.staff_prefix>
                                                    <template #checked>
                                                        <span>前缀文本</span>
                                                    </template>
                                                    <template #unchecked>
                                                        <span>前缀文本</span>
                                                    </template>
                                                </n-switch>
                                                <n-switch :rail-style="railStyle" size="medium" :default-value="true"
                                                          v-model:value=this.staff_staff>
                                                    <template #checked>
                                                        <span>参与人员</span>
                                                    </template>
                                                    <template #unchecked>
                                                        <span>参与人员</span>
                                                    </template>
                                                </n-switch>
                                                <n-switch :rail-style="railStyle" size="medium" :default-value="true"
                                                          v-model:value=this.staff_suffix>
                                                    <template #checked>
                                                        <span>后缀文本</span>
                                                    </template>
                                                    <template #unchecked>
                                                        <span>后缀文本</span>
                                                    </template>
                                                </n-switch>
                                            </n-space>
                                            <n-grid :cols="5">
                                                <n-gi v-if="staff_staff"
                                                      :span="this.staff_suffix||this.staff_prefix?2:5">
                                                    <n-collapse-transition :show="this.staff_staff">
                                                        <n-input
                                                                v-model:value="this.staff_staff_recorder"
                                                                placeholder="">
                                                            <template #prefix><span style="color: gray">录制</span>
                                                            </template>
                                                        </n-input>
                                                        <n-input
                                                                v-model:value="this.staff_staff_translator"
                                                                placeholder="">
                                                            <template #prefix><span style="color: gray">翻译</span>
                                                            </template>
                                                        </n-input>
                                                        <n-input
                                                                v-model:value="this.staff_staff_translate_proof"
                                                                placeholder="">
                                                            <template #prefix><span style="color: gray">校对</span>
                                                            </template>
                                                        </n-input>

                                                        <n-input v-model:value="this.staff_staff_subtitle_maker"
                                                                 placeholder="">
                                                            <template #prefix><span style="color: gray">时轴</span>
                                                            </template>
                                                        </n-input>
                                                        <n-input v-model:value="this.staff_staff_subtitle_proof"
                                                                 placeholder="">
                                                            <template #prefix><span style="color: gray">轴校</span>
                                                            </template>
                                                        </n-input>
                                                        <n-input v-model:value="this.staff_staff_compositor"
                                                                 placeholder="">
                                                            <template #prefix><span style="color: gray">压制</span>
                                                            </template>
                                                        </n-input>
                                                    </n-collapse-transition>
                                                </n-gi>
                                                <n-gi v-if="this.staff_suffix||this.staff_prefix"
                                                      :span="this.staff_staff?3:5">
                                                    <n-collapse-transition :show="this.staff_prefix"
                                                                           :style="{height:`${this.staff_prefix+this.staff_suffix?100/(this.staff_prefix+this.staff_suffix):0}%`}">
                                                        <n-input :resizable="false" type="textarea" style="height:100%;"
                                                                 v-model:value="this.staff_prefix_context"
                                                                 show-count placeholder="">
                                                            <template #prefix><span style="color: gray">前缀文本</span>
                                                            </template>
                                                        </n-input>
                                                    </n-collapse-transition>
                                                    <n-collapse-transition :show="this.staff_suffix"
                                                                           :style="{height:`${this.staff_prefix+this.staff_suffix?100/(this.staff_prefix+this.staff_suffix):0}%`}">
                                                        <n-input :resizable="false" type="textarea" style="height:100%;"
                                                                 v-model:value="this.staff_suffix_context"
                                                                 show-count placeholder="">
                                                            <template #prefix><span style="color: gray">后缀文本</span>
                                                            </template>
                                                        </n-input>
                                                    </n-collapse-transition>
                                                </n-gi>
                                            </n-grid>
                                        </n-space>
                                    </n-gi>
                                    <n-gi v-if="this.staff_staff||this.staff_prefix||this.staff_suffix">
                                        <n-space vertical justify="space-between" style="height: 100%">
                                            <n-input-group>
                                                <n-input-group-label style="width: 25%">
                                                    持续时间
                                                </n-input-group-label>
                                                <n-input-number
                                                        style="width: 75%"
                                                        v-model:value="this.staff_duration" :max="60" :min="0"
                                                        placeholder="从视频开始持续的时间">
                                                    <template #suffix>s</template>
                                                </n-input-number>
                                            </n-input-group>
                                            <n-input-group>
                                                <n-input-group-label style="width: 25%">
                                                    位置
                                                </n-input-group-label>
                                                <n-select
                                                        style="width: 75%"
                                                        :options="this.dialog_staff_position"
                                                        v-model:value="this.staff_position"
                                                />
                                            </n-input-group>
                                            <n-input-group>
                                                <n-input-group-label style="width: 25%">
                                                    渐入渐出
                                                </n-input-group-label>
                                                <n-input-number
                                                        style="width: 37.5%"
                                                        v-model:value="this.staff_fade_time1" :min="0"
                                                        :max="this.staff_duration*1000-this.staff_fade_time2">
                                                    <template #suffix>ms</template>
                                                </n-input-number>
                                                <n-input-number
                                                        style="width: 37.5%"
                                                        v-model:value="this.staff_fade_time2" :min="0"
                                                        :max="this.staff_duration*1000-this.staff_fade_time1">
                                                    <template #suffix>ms</template>
                                                </n-input-number>
                                            </n-input-group>
                                            <n-input-group>
                                                <n-input-group-label style="width: 25%">字体大小
                                                </n-input-group-label>
                                                <n-select
                                                        style="width: 25%"
                                                        :options="[{label:'字号',value:'size'},{label: '比例',value: 'ratio'}]"
                                                        v-model:value="this.staff_fontsize_type"
                                                />
                                                <n-input-number
                                                        style="width: 50%"
                                                        v-model:value="this.staff_fontsize_value"
                                                        :placeholder="this.staff_fontsize_type==='size'?'字号的绝对大小':'相对于对话字体的比例'"
                                                />
                                            </n-input-group>
                                            <n-input-group>
                                                <n-input-group-label style="width: 25%">侧边距离</n-input-group-label>
                                                <n-input-number
                                                        style="width: 37.5%"
                                                        v-model:value="this.staff_margin_LR" :min="0"
                                                        :max="this.video_info?this.video_info['frameWidth']:2000">
                                                    <template #prefix>水平</template>
                                                </n-input-number>
                                                <n-input-number
                                                        style="width: 37.5%"
                                                        v-model:value="this.staff_margin_V" :min="0"
                                                        :max="this.video_info?this.video_info['frameHeight']:1000">
                                                    <template #prefix>垂直</template>
                                                </n-input-number>

                                            </n-input-group>
                                        </n-space>

                                    </n-gi>
                                </n-grid>
                                <n-space justify="space-between">
                                    <n-space>
                                        <n-button @click="this.saveStaffTemplate">保存模板</n-button>
                                        <n-button @click="this.readStaffTemplate">读取模板</n-button>
                                    </n-space>
                                    <n-space>
                                        <n-button @click="this.clearStaffItem">清空</n-button>
                                        <n-button @click="this.submitStaffItem">添加</n-button>
                                    </n-space>
                                </n-space>
                            </n-space>
                        </template>
                    </n-collapse-item>
                </n-collapse>
                <n-collapse-transition :show="this.alert && Boolean(this.alert_msg)">
                    <n-alert title="任务信息无效" type="error">
                        <template #default>
                            <span>{{ this.alert_msg }}</span>
                        </template>
                    </n-alert>
                </n-collapse-transition>
            </n-space>
        </template>
        <template #action>
            <n-space justify="end">
                <n-button @click="this.emitTask"> 提交任务</n-button>
            </n-space>
        </template>
    </n-card>
</template>
<script>
import {defineComponent} from "vue";
import {ipcRenderer} from 'electron';
import {systemFonts} from "../utils/common";
import fs from "fs";

export default defineComponent({
    setup() {
        let systemFontsOptions = [];
        systemFonts.forEach((font) => {
            systemFontsOptions.push({label: font, value: font});
        })

        return {
            systemFontsOptions,
            dialog_staff_position: [
                {label: "左上", value: 7},
                {label: "右上", value: 9},
                {label: "左下", value: 1},
                {label: "右下", value: 3},
            ],
            railStyle: ({focused, checked}) => {
                const style = {};
                if (!checked) {
                    style.background = "#aaaaaa";
                    if (focused)
                        style.boxShadow = "0 0 0 2px #aaaaaa40";
                } else {
                    style.background = "#2080f0";
                    if (focused)
                        style.boxShadow = "0 0 0 2px #2080f040";
                }
                return style;
            }
        }
    },
    inject: ["modalActiveControl"],
    data() {
        return {
            config_video_file: '',
            config_json_file: '',
            config_translate_file: '',
            config_output_path: '',
            config_overwrite: true,
            config_video_only: false,
            config_font: '',
            config_type_interval_1: 50,
            config_type_interval_2: 80,
            config_duration: [0, 0],
            config_staff: [],

            staff_prefix: true,
            staff_staff: true,
            staff_suffix: true,

            staff_prefix_context: "",

            staff_staff_recorder: "",
            staff_staff_translator: "",
            staff_staff_translate_proof: "",
            staff_staff_subtitle_maker: "",
            staff_staff_subtitle_proof: "",
            staff_staff_compositor: "",

            staff_suffix_context: "",
            staff_fade_time1: 100,
            staff_fade_time2: 100,
            staff_duration: 5,
            staff_position: 1,
            staff_margin_LR: 30,
            staff_margin_V: 30,

            staff_fontsize_type: 'ratio',
            staff_fontsize_value: 1,

            advanced_settings_show: false,
            video_info: {},
            video_frame_count: 0,

            alert: false,
            alert_msg: ""
        }
    },
    methods: {
        selectVideo() {
            ipcRenderer.send('select-file-exist-video');
            ipcRenderer.on('selected-video', (e, result) => {
                if (!result.canceled) {
                    this.config_video_file = result.filePaths[0]
                    this.getVideoInfo()
                }
            });
        },
        selectJson() {
            ipcRenderer.send('select-file-exist-json');
            ipcRenderer.on('selected-json', (e, result) => {
                if (!result.canceled)
                    this.config_json_file = result.filePaths[0]
            });
        },
        selectTranslate() {
            ipcRenderer.send('select-file-exist-translate');
            ipcRenderer.on('selected-translate', (e, result) => {
                if (!result.canceled)
                    this.config_translate_file = result.filePaths[0]
            });
        },
        emitTask() {
            if (!Boolean(this.config_video_file)) {
                this.alert = true;
                this.alert_msg = "至少需要选择视频文件"
                setTimeout(() => {
                    this.alert = false
                }, 5000)
            } else if (!this.config_video_only && !Boolean(this.config_json_file)) {
                this.alert = true;
                this.alert_msg = "需要选择剧情数据文件"
                setTimeout(() => {
                    this.alert = false
                }, 5000)
            } else {
                let duration = [Math.min(...this.config_duration), Math.max(...this.config_duration)]
                if (JSON.stringify(duration) === JSON.stringify([0, this.video_info['frameCount']]))
                    duration = null
                else if (JSON.stringify(duration) === JSON.stringify([0, 0]))
                    duration = null
                let ProcessConfig = {
                    video_file: this.config_video_file,
                    json_file: this.config_json_file,
                    translate_file: this.config_translate_file,
                    output_path: this.config_output_path,
                    overwrite: this.config_overwrite,
                    font: this.config_font ? this.config_font : "思源黑体 CN Bold",
                    video_only: this.config_video_only,
                    staff: this.config_staff,
                    typer_interval: [this.config_type_interval_1, this.config_type_interval_2],
                    duration: duration,
                    debug: false,
                }
                this.axios.post('http://localhost:50000/new', ProcessConfig).then().catch((e) => {
                    console.log(e)
                })
                this.modalClose()
            }
        },
        getVideoInfo() {
            this.video_info = {}
            this.video_frame_count = 0
            this.axios.get(`http://localhost:50000/videoInfo?video_file=${this.config_video_file}`).then((data) => {
                this.video_info = data.data.data
                this.video_frame_count = this.video_info['frameCount']
                this.config_duration = [0, this.video_frame_count]
            })
        },
        modalClose() {
            this.modalActiveControl();
        },
        formatTooltip(value) {
            const time = parseInt(value / this.video_info['videoFps'])
            let seconds = `00${time % 60}`.split('').slice(-2).join('');
            let minutes = `00${parseInt(time / 60)}`.split('').slice(-2).join('');
            return `${minutes}:${seconds}`
        },
        makeStaffItem() {
            return {
                recorder: this.staff_staff_recorder,
                translator: this.staff_staff_translator,
                translate_proof: this.staff_staff_translate_proof,
                subtitle_maker: this.staff_staff_subtitle_maker,
                subtitle_proof: this.staff_staff_subtitle_proof,
                compositor: this.staff_staff_compositor,
                duration: this.staff_duration,
                position: this.staff_position,
                suffix: this.staff_suffix_context,
                prefix: this.staff_prefix_context,
                fade: [this.staff_fade_time1, this.staff_fade_time2],
                fontsize: this.staff_fontsize_value,
                fontsize_type: this.staff_fontsize_type,
                margin_lr: this.staff_margin_LR,
                margin_v: this.staff_margin_V
            }
        },
        restoreStaffItem() {
            this.staff_staff_recorder = ""
            this.staff_staff_translator = ""
            this.staff_staff_translate_proof = ""
            this.staff_staff_subtitle_maker = ""
            this.staff_staff_subtitle_proof = ""
            this.staff_staff_compositor = ""
            this.staff_duration = 5
            this.staff_position = 1
            this.staff_suffix_context = ''
            this.staff_prefix_context = ''
            this.staff_fontsize_value = 1
            this.staff_fontsize_type = 'ratio'
            this.staff_fade_time1 = 100
            this.staff_fade_time2 = 100
            this.staff_margin_LR = 30
            this.staff_margin_V = 30
        },
        loadStaffItem(item) {
            this.staff_staff_recorder = item.recorder;
            this.staff_staff_translator = item.translator;
            this.staff_staff_translate_proof = item.translate_proof;
            this.staff_staff_subtitle_maker = item.subtitle_maker;
            this.staff_staff_subtitle_proof = item.subtitle_proof;
            this.staff_staff_compositor = item.compositor;
            this.staff_duration = item.duration;
            this.staff_position = item.position;
            this.staff_suffix_context = item.suffix;
            this.staff_prefix_context = item.prefix;
            this.staff_fontsize_value = item['fontsize'];
            this.staff_fontsize_type = item.fontsize_type;
            this.staff_fade_time1 = item['fade'][0];
            this.staff_fade_time2 = item['fade'][1];
            this.staff_margin_LR = item.margin_lr;
            this.staff_margin_V = item.margin_v
        },
        submitStaffItem(item) {
            this.config_staff.push(item)
            this.restoreStaffItem()
        },
        clearStaffItem(item) {
            this.config_staff = []
        },
        saveStaffTemplate() {
            ipcRenderer.send('save-file-json', this.makeStaffItem());
        },
        readStaffTemplate() {
            ipcRenderer.send("read-file-json");
            ipcRenderer.on("read-file-json-result", (event, result) => {
                if (!result.canceled) {
                    fs.readFile(result.filePaths[0], 'utf-8', (error, data) => {
                        if (error) {
                            alert(`读取文件时发生错误: ${error}`)
                        } else {
                            this.loadStaffItem(JSON.parse(data))
                        }
                    })
                }
            })
        }
    }

})
</script>
<style scoped>

</style>