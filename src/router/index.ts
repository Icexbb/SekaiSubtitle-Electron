import {createRouter, createWebHashHistory, RouterOptions, Router, RouteRecordRaw} from 'vue-router'

const routes: RouteRecordRaw[] = [

    {path: '/', name: 'Home', component: () => import("../views/Home.vue")},
    {path: "/Subtitle", name: 'Subtitle', component: () => import("../views/Subtitle.vue")},
    {path: "/Download", name: 'Download', component: () => import("../views/Download.vue")},
    {path: "/Setting", name: 'Setting', component: () => import("../views/Setting.vue")},
    {path: "/Translate", name: 'Translate', component: () => import("../views/Translate.vue")}
]

// RouterOptions是路由选项类型
const options: RouterOptions = {
    history: createWebHashHistory(),
    routes,
}

// Router是路由对象类型
const router: Router = createRouter(options)

export default router

