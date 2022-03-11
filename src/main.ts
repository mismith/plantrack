import { createApp } from 'vue'
import VueInfiniteScroll from 'vue3-infinite-scroll-good'

import router from './router'
import App from './App.vue'

const app = createApp(App)
app.use(router)
app.use(VueInfiniteScroll)
app.mount('#app')
