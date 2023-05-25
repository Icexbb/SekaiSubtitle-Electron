import {createApp} from 'vue'
import "./assets/style.css"
import App from './App.vue'
import axios from "axios";
import VueAxios from 'vue-axios'
import router from './router'
import naive from 'naive-ui'
import 'vfonts/Lato.css'
import 'vfonts/FiraCode.css'
import {createPinia} from 'pinia'

const app = createApp(App);

app.use(VueAxios, axios).use(router).use(naive).use(createPinia());

app.mount('#app').$nextTick(() => {
    postMessage({payload: 'removeLoading'}, '*')
});
