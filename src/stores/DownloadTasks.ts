import {defineStore} from "pinia";

export interface DownloadTaskInfo {
    taskName: string,
    taskId: string,
    taskUrl: string,
    taskTarget: string,
    taskDownloaded:boolean,
    taskDownloading:boolean
}

export const useDownloadTasksStore = defineStore("DownloadTasks", {
    state: () => ({
        tasks: {} as DownloadTaskInfo[]
    }),
    actions: {
        newTask(tasksInfo: DownloadTaskInfo) {
            this.tasks[tasksInfo.taskId] = tasksInfo;
        },
        deleteTask(taskId) {
            delete this.tasks[taskId];
        }
    }
})