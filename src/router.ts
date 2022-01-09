import { createRouter, createWebHistory } from 'vue-router'

import Plotter from './views/Plotter.vue'
import Recorder from './views/Recorder.vue'
import Analyzer from './views/Analyzer.vue'
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
    meta: {
      // title: 'Plotter',
    },
  },
  {
    path: '/recorder',
    component: Recorder,
    meta: {
      title: 'Recorder',
    },
  },
  {
    path: '/analyzer',
    component: Analyzer,
    meta: {
      title: 'Analyzer',
    },
  },
  {
    path: '/old-tracker',
    component: OldTracker,
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

router.beforeEach((to, from, next) => {
  if (to.meta?.title) {
    document.title = `${to.meta.title} › plantrack`
  } else {
    document.title = 'plantrack'
  }
  next()
})

export default router
