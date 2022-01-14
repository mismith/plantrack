<template>
  <nav class="Header py-0 px-2 px-sm-3" style="position: sticky; top: 0; z-index: 10;">
    <div class="Header-item">
      <router-link to="/" class="Header-link">
        <Logo class="logo d-sm-inline-flex" :class="{ 'd-none': user }" />
        <Touchicon class="logo d-sm-none" :class="{ 'd-none': !user }" />
      </router-link>
    </div>
    <div class="Header-item Header-item--full d-flex flex-justify-center" style="overflow-x: auto;">
      <div v-if="user" class="UnderlineNav">
        <router-link
          v-for="route in routes.filter(({ meta }) => meta?.title)"
          :key="route.path"
          :to="route.path"
          role="tab"
          class="UnderlineNav-item Header-link"
        >
          {{route.meta.title}}
        </router-link>
      </div>
    </div>
    <div class="Header-item pl-2">
      <button type="button" title="Toggle Dark Mode" class="Header-link close-button circle" @click="isDarkMode = !isDarkMode">
        <Octicon :name="isDarkMode ? 'sun' : 'moon'" />
      </button>
      <Dropdown v-if="user" direction="sw" menu-class="mt-2" class="ml-2">
        <template #summary>
          <summary title="Account" aria-haspopup="true" class="Header-link close-button circle">
            <Octicon name="person" />
            <span class="dropdown-caret" />
          </summary>
        </template>

        <span class="dropdown-header">
          {{user.email}}
        </span>
        <hr class="dropdown-divider" />
        <a href="#" class="dropdown-item" @click="handleLogout">
          <Octicon name="sign-out" />
          Sign out
        </a>
      </Dropdown>
    </div>
  </nav>

  <router-view v-if="user" class="flex-auto" />
  <div v-else class="Box d-flex flex-column m-auto">
    <div class="Box-header d-flex flex-column flex-items-center text-center pt-3 px-6 pb-6">
      <Logo class="logo" style="max-width: 200px; height: auto;" />
      <div class="m-3">
        <Octicon name="workflow" :size="24" />
        <span class="AnimatedEllipsis m-2" style="vertical-align: middle;" />
        <Octicon name="repo" :size="24" />
        <span class="AnimatedEllipsis m-2" style="vertical-align: middle;" />
        <Octicon name="graph" :size="24" />
      </div>
      <h3>Plan your garden. <br />Record your data. <br />Track your results.</h3>
    </div>

    <Auth />
  </div>

  <Dialog :model-value="Boolean(isEditingPlant)" @update:model-value="isEditingPlant = undefined">
    <AddPlant :plant="isEditingPlant" @update="isEditingPlant = undefined" />
  </Dialog>
  <Dialog :model-value="Boolean(isEditingCrop)" @update:model-value="isEditingCrop = undefined">
    <AddCrop :crop="isEditingCrop" @update="isEditingCrop = undefined" />
  </Dialog>
  <Dialog :model-value="Boolean(isEditingBed)" @update:model-value="isEditingBed = undefined">
    <AddBed :bed="isEditingBed" @update="isEditingBed = undefined" />
  </Dialog>
  <Dialog :model-value="Boolean(isEditingPlot)" @update:model-value="isEditingPlot = undefined">
    <AddPlot :plot="isEditingPlot" @update="isEditingPlot = undefined" />
  </Dialog>
  <Dialog :model-value="Boolean(isEditingTag)" @update:model-value="isEditingTag = undefined">
    <AddTag :tag="isEditingTag" @update="isEditingTag = undefined" />
  </Dialog>
  <Dialog v-model="isAddingPlant"><AddPlant /></Dialog>
  <Dialog v-model="isAddingCrop"><AddCrop /></Dialog>
  <Dialog v-model="isAddingBed"><AddBed /></Dialog>
  <Dialog v-model="isAddingPlot"><AddPlot /></Dialog>
  <Dialog v-model="isAddingTag"><AddTag /></Dialog>

  <Toast v-model="toastState.isOpen" :type="toastState.type">
    {{toastState.message}}
  </Toast>
</template>

<script lang="ts">
/// <reference types="vite-svg-loader" />
import { defineComponent, provide, reactive, ref, watch } from 'vue'

import { routes } from './router'
import { auth, useUser } from './services/firebase'
import { Bed, Crop, Plant, Plot, Tag } from './services/data'

import Logo from './assets/logo.svg?component'
import Touchicon from './assets/touchicon.svg?component'
import Dropdown from './components/Dropdown.vue'
import Button from './components/Button.vue'
import Auth from './components/Auth.vue'
import Dialog from './components/Dialog.vue'
import AddPlant from './components/AddPlant.vue'
import AddCrop from './components/AddCrop.vue'
import AddBed from './components/AddBed.vue'
import AddPlot from './components/AddPlot.vue'
import AddTag from './components/AddTag.vue'
import Toast from './components/Toast.vue'
import Octicon from './components/Octicon.vue'

export default defineComponent({
  name: 'App',
  components: {
    Logo,
    Touchicon,
    Dropdown,
    Button,
    Auth,
    Dialog,
    AddPlant,
    AddCrop,
    AddBed,
    AddPlot,
    AddTag,
    Toast,
    Octicon,
  },
  setup() {
    const user = useUser()
    const isMenuOpen = ref(false)
    const colorSchemeKey = 'plantrack.color-scheme'
    const colorSchemeStored = window.localStorage.getItem(colorSchemeKey)
    const isDarkMode = ref(colorSchemeStored !== null ? colorSchemeStored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches)
    watch(isDarkMode, (enabled) => {
      document.documentElement.dataset.colorMode = enabled ? 'dark' : 'light'
      window.localStorage.setItem(colorSchemeKey, enabled ? 'dark' : 'light')
    }, { immediate: true })

    const isAddingPlant = ref(false)
    const isAddingCrop = ref(false)
    const isAddingBed = ref(false)
    const isAddingPlot = ref(false)
    const isAddingTag = ref(false)
    provide('isAddingPlant', isAddingPlant)
    provide('isAddingCrop', isAddingCrop)
    provide('isAddingBed', isAddingBed)
    provide('isAddingPlot', isAddingPlot)
    provide('isAddingTag', isAddingTag)

    const isEditingPlant = ref<Plant>()
    const isEditingCrop = ref<Crop>()
    const isEditingBed = ref<Bed>()
    const isEditingPlot = ref<Plot>()
    const isEditingTag = ref<Tag>()
    provide('isEditingPlant', isEditingPlant)
    provide('isEditingCrop', isEditingCrop)
    provide('isEditingBed', isEditingBed)
    provide('isEditingPlot', isEditingPlot)
    provide('isEditingTag', isEditingTag)

    const toastState = reactive({
      isOpen: false,
      message: '',
      type: '',
    })
    function toast(message: string, type?: string) {
      toastState.isOpen = false
      setTimeout(() => {
        toastState.message = message
        if (type) toastState.type = type
        toastState.isOpen = true
      })
    }
    function toastError(error: any) {
      toast(error?.getMessage?.() || error?.message || error, 'error')
    }
    provide('toast', toast)
    provide('toastError', toastError)

    async function handleLogout() {
      auth.signOut()
    }

    return {
      user,
      isMenuOpen,
      isDarkMode,

      routes,

      isAddingPlant,
      isAddingCrop,
      isAddingBed,
      isAddingPlot,
      isAddingTag,

      isEditingPlant,
      isEditingCrop,
      isEditingBed,
      isEditingPlot,
      isEditingTag,

      toastState,

      handleLogout,
    }
  }
})
</script>

<style lang="scss">
@import '@primer/css/index.scss';
@import '@primer/octicons/index.scss';

:root {
  --color-plantrack-primary: #99CF26;
}

.logo {
  width: auto;
  height: 2em;
  vertical-align: middle;

  .text {
    fill: currentColor;
  }
}
.form-group {
  textarea.form-control {
    min-height: 64px;
    height: 64px;
  }
}

.Header {
  min-height: 48px;

  .Header-item {
    margin-right: 0;
  }
  .Header-link.circle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
  }
}
.UnderlineNav {
  box-shadow: none;
}
.UnderlineNav-item {
  &.selected,
  &[role=tab][aria-selected=true],
  &[aria-current]:not([aria-current=false]) {
    color: var(--color-header-logo);
    border-bottom-color: var(--color-plantrack-primary);
  }
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  font-family: sans-serif;
}

input[type="file"] {
  line-height: 1rem;
}
select.form-control {
  -webkit-appearance: none;
}

.btn-triangle {
  appearance: none;
  flex-shrink: 0;
  display: inline-block;
  position: relative;
  width: 1.5em;
  height: 1.5em;
  background: none;
  color: inherit;
  padding: 0;
  margin: 0;
  border: none;
  outline: none;
  opacity: 0.5;
  transition: all 0.1s;
  cursor: inherit;

  > span {
    display: none;
  }

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    border: solid 0.4em transparent;
    border-left-color: currentColor;
    border-left-width: 0.7em;
    border-right-width: 0;
    margin: -0.4em -0.35em;
  }

  &.open {
    transform: rotate(90deg);
  }
}

.TreeView {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  list-style: none;
  padding: 0;
  margin: 0;
  user-select: none;

  > .TreeNode {
    > .TreeNodeLeaf {
      display: flex;
      align-items: center;

      &.hoverable.hovered {
        background-color: var(--color-accent-subtle);
      }
      @media (pointer: fine) {
        &:hover {
          background-color: var(--color-accent-subtle);
        }
      }

      .TreeNodeIndent {
        display: inline-block;
        width: 0.6em;
        align-self: stretch;
        flex-shrink: 0;
        // border-right: solid 1px ButtonFace;
      }

      .TreeNodeExpand {
        @extend .btn-triangle;

        flex-shrink: 0;
      }
      &.expandable {
        cursor: default;

        &:not(.childrened) {
          .TreeNodeExpand {
            visibility: hidden;
          }
        }
      }
      &.expanded {
        .TreeNodeExpand {
          transform: rotate(90deg);
        }
      }

      .TreeNodeCheck {
        flex-shrink: 0;
        width: 1.2em;
        height: 1.2em;
        margin: 0.2em;
      }
      &.selected {
        &,
        &.hovered {
          background-color: var(--color-accent-emphasis);
          color: var(--color-fg-on-emphasis);
        }
      }

      .TreeNodeName {
        padding: 0 0.2em;
      }

      &.renamable {
        > .TreeNodeRename {
          width: 100%;
          font: inherit;

          &:read-only {
            appearance: none;
            display: inline-block;
            background: inherit;
            color: inherit;
            border-color: transparent;
            outline: none;
            cursor: inherit;
          }
        }
      }

      &.disabled {
        .TreeNodeName {
          opacity: 0.5;
        }
      }
    }
  }

  .btn-octicon {
    display: inline-flex;
    align-items: center;
    height: 100%;
    background-color: transparent;
    padding: 0 0.5em;
    margin: 0;
  }
  
  .TreeNodeName {
    display: flex;
    align-items: center;
    flex: auto;
    min-width: 128px;
    gap: 4px;
  }
  .TreeNodeActions {
    display: flex;
    align-self: stretch;
  }
  @media (pointer: fine) {
    .TreeNodeLeaf:not(:hover) {
      .TreeNodeActions {
        visibility: hidden;
      }
    }
  }
  @media (pointer: coarse) {
    font-size: 1.25rem;

    .TreeNodeName {
      font-size: 0.875rem;
    }
  }
}
</style>
