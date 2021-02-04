import { createRouter, createWebHistory } from 'vue-router'

import Plotter from './views/Plotter.vue'
import Recorder from './views/Recorder.vue'

export const routes = [
  {
    path: '/',
    redirect: '/recorder',
  },
  {
    path: '/plotter',
    component: Plotter,
  },
  {
    path: '/recorder',
    component: Recorder,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
