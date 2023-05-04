import {createApp} from 'vue'
import "./style.css"
import App from './App.vue'
import './samples/node-api'
import axios from "axios";
import VueAxios from 'vue-axios'
import router from './router'
import naive from 'naive-ui'
import 'vfonts/Lato.css'
import 'vfonts/FiraCode.css'

const app = createApp(App);
app.use(VueAxios, axios).use(router).use(naive);

app.mount('#app').$nextTick(() => {
    postMessage({payload: 'removeLoading'}, '*')
});
