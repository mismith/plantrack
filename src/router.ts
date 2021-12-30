import { createRouter, createWebHistory } from 'vue-router'

import Plotter from './views/Plotter.vue'
import Crops from './views/Crops.vue'
import Recorder from './views/Recorder.vue'
import Tracker from './views/Tracker.vue'
import Exporter from './views/Exporter.vue'

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
    path: '/crops',
    component: Crops,
  },
  {
    path: '/recorder',
    component: Recorder,
  },
  {
    path: '/tracker',
    component: Tracker,
    meta: {
      hidden: true,
    },
  },
  {
    path: '/exporter',
    component: Exporter,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
