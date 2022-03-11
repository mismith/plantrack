import { h } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import Plot from './views/Plot.vue'
import Record from './views/Record.vue'
import Track from './views/Track.vue'
import Learn from './views/Learn.vue'

export const routes = [
  {
    path: '/',
    redirect: '/record',
  },
  {
    path: '/plot',
    component: Plot,
    meta: {
      // title: 'Plot',
    },
  },
  {
    path: '/record',
    component: Record,
    meta: {
      title: 'Record',
    },
  },
  {
    path: '/track',
    component: Track,
    meta: {
      title: 'Track',
    },
  },
  {
    path: '/learn',
    component: Learn,
    meta: {
      title: 'Learn',
    },
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
