import {defineStore} from "pinia";
import {StoryEventSet} from "../utils/data";


export const useTranslateTasksStore = defineStore("TranslateTasks", {
    state: () => ({
        eventData: new StoryEventSet([]) as StoryEventSet,
        baseFile: "" as string,
        loaded: false as boolean,
    }),
    actions: {}
})