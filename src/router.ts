import { createRouter, createWebHistory } from 'vue-router'

import Plotter from './views/Plotter.vue'
import Planter from './views/Planter.vue'
import Recorder from './views/Recorder.vue'

export const routes = [
  {
    path: '/',
    redirect: '/planter',
  },
  {
    path: '/plotter',
    component: Plotter,
  },
  {
    path: '/planter',
    component: Planter,
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
