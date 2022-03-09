import { h } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import Plotter from './views/Plotter.vue'
import Recorder from './views/Recorder.vue'
import Activity from './views/Activity.vue'
import Analyzer from './views/Analyzer.vue'
import OldTracker from './views/OldTracker.vue'
import Exporter from './views/Exporter.vue'

export const routes = [
  {
    path: '/',
    redirect: '/record',
  },
  {
    path: '/plot',
    component: Plotter,
    meta: {
      // title: 'Plot',
    },
  },
  {
    path: '/recorder', // @DEPRECATED
    redirect: '/record',
  },
  {
    path: '/record',
    component: Recorder,
    meta: {
      title: 'Record',
    },
  },
  {
    path: '/activity',
    component: Activity,
    meta: {
      title: 'Activity',
    },
  },
  {
    path: '/track',
    component: Analyzer,
    meta: {
      title: 'Track',
    },
  },
  {
    path: '/old-tracker',
    component: OldTracker,
  },
  {
    path: '/export',
    component: Exporter,
  },
  {
    path: '/:pathMatch(.*)*',
    component: {
      render: () => h('h1', { class: 'd-flex', innerHTML: '<h1 class="m-auto">Not Found</h1>' }),
    },
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
