import { createRouter, createWebHistory } from 'vue-router'

import Plotter from './views/Plotter.vue'
import Recorder from './views/Recorder.vue'
import Tracker from './views/Tracker.vue'

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
  {
    path: '/tracker',
    component: Tracker,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
