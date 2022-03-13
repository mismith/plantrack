import { h, reactive } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import Plan from './views/Plan.vue'
import PlanLayout from './views/Plan/Layout.vue'
import Record from './views/Record.vue'
import Track from './views/Track.vue'
import TrackEntries from './views/Track/Entries.vue'
import TrackCrops from './views/Track/Crops.vue'

export const routes = [
  {
    path: '/',
    redirect: '/record',
  },
  {
    path: '/plan',
    component: Plan,
    meta: {
      title: 'Plan',
    },
    children: [
      {
        path: '',
        redirect: '/plan/layout',
      },
      {
        path: 'layout',
        component: PlanLayout,
        meta: {
          title: 'Layout',
        },
      },
      {
        path: 'crops',
        component: PlanLayout, // @TODO
        meta: {
          title: 'Crops',
        },
      },
    ],
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
    children: [
      {
        path: '',
        redirect: '/track/entries',
      },
      {
        path: 'entries',
        component: TrackEntries,
      },
      {
        path: 'crops',
        component: TrackCrops,
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    component: {
      render: () => h('h1', { class: 'd-flex', innerHTML: '<h1 class="m-auto">Not Found</h1>' }),
    },
  },
]


export const savedViewPositions = reactive<Record<string, number>>({})

const router = createRouter({
  history: createWebHistory(),
  routes,
  async scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    } else if (savedPosition) {
      return savedPosition
    } else {
      return { top: savedViewPositions?.[to.fullPath] || 0 }
    }
  },
})

router.beforeEach((to, from, next) => {
  savedViewPositions[from.fullPath] = document.documentElement.scrollTop

  if (to.meta?.title) {
    document.title = `${to.meta.title} › plantrack`
  } else {
    document.title = 'plantrack'
  }
  next()
})

export default router
