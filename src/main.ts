import { createApp } from 'vue'

import router from '@/router';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import NPlayer from "@nplayer/vue";
import App from './App.vue'

const app = createApp(App)
const store = createPinia();

app.use(store);
app.use(router);
app.use(ElementPlus)
app.use(NPlayer)
app.mount('#app')
