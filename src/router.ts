import { createRouter, createWebHistory } from 'vue-router'

import Plotter from './views/Plotter.vue'
import Crops from './views/Crops.vue'
import Recorder from './views/Recorder.vue'
import OldTracker from './views/OldTracker.vue'
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
    path: '/recorder',
    component: Recorder,
  },
  {
    path: '/crops',
    component: Crops,
  },
  {
    path: '/old-tracker',
    component: OldTracker,
    meta: {
      hidden: true,
    },
  },
  {
    path: '/exporter',
    component: Exporter,
    meta: {
      hidden: true,
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
