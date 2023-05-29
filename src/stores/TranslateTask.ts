import {defineStore} from "pinia";


export const useDownloadTasksStore = defineStore("DownloadTasks", {
    state: () => ({
        jsonData: {} as Object
    }),
    actions: {}
})