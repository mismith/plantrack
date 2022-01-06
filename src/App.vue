<template>
  <nav class="UnderlineNav color-bg-inset flex-wrap flex-sm-nowrap flex-justify-center flex-sm-justify-between">
    <router-link to="/" class="UnderlineNav-actions px-3" style="color: currentColor;">
      <Logo class="logo" />
    </router-link>
    <div
      v-if="user"
      class="UnderlineNav-body flex-order-2 flex-sm-order-none d-sm-flex"
      :class="{ 'd-none': !isMenuOpen }"
    >
      <router-link
        v-for="route in routes.filter(({ path, meta }) => path !== '/' && !meta?.hidden)"
        :key="route.path"
        :to="route.path"
        role="tab"
        class="UnderlineNav-item"
        style="text-transform: capitalize;"
      >
        {{route.path.replace(/\//, '')}}
      </router-link>
    </div>
    <div
      class="UnderlineNav-actions px-2 flex-items-center flex-order-1 flex-sm-order-none d-sm-flex"
      :class="{ 'd-none': !isMenuOpen, 'ml-auto': !user }"
      style="gap: 4px; white-space: nowrap;"
    >
      <template v-if="user">
        {{user.email}}
        <button class="btn" title="Logout" @click="handleLogout">
          <Octicon name="sign-out" />
        </button>
      </template>
      <button type="button" title="Toggle Dark Mode" class="btn" @click="isDarkMode = !isDarkMode">
        <Octicon :name="isDarkMode ? 'sun' : 'moon'" />
      </button>
    </div>
    <div class="UnderlineNav-actions d-sm-none ml-auto px-2" :class="{ 'd-none': !user }">
      <button type="button" class="btn" :aria-selected="isMenuOpen" @click="isMenuOpen = !isMenuOpen">
        <Octicon name="three-bars" />
      </button>
    </div>
  </nav>

  <router-view v-if="user" style="flex: auto;" />
  <form v-else class="d-flex flex-column m-auto" style="gap: 8px;" @submit.prevent="handleLogin">
    <input type="email" v-model="email" placeholder="Email" aria-label="Email" class="form-control" />
    <input type="password" v-model="password" placeholder="Password" aria-label="Password" class="form-control" />
    <Button type="submit" :loading="isLoading" :disabled="isLoading">Login</Button>
  </form>

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
  <Dialog v-model="isAddingPlant"><AddPlant /></Dialog>
  <Dialog v-model="isAddingCrop"><AddCrop /></Dialog>
  <Dialog v-model="isAddingBed"><AddBed /></Dialog>
  <Dialog v-model="isAddingPlot"><AddPlot /></Dialog>
</template>

<script lang="ts">
/// <reference types="vite-svg-loader" />
import { defineComponent, provide, ref, watch } from 'vue'

import { routes } from './router'
import { auth, useUser } from './services/firebase'
import { Bed, Crop, Plant, Plot } from './services/data'

import Logo from './logo.svg?component'
import Button from './components/Button.vue'
import Dialog from './components/Dialog.vue'
import AddPlant from './components/AddPlant.vue'
import AddCrop from './components/AddCrop.vue'
import AddBed from './components/AddBed.vue'
import AddPlot from './components/AddPlot.vue'
import Octicon from './components/Octicon.vue'

export default defineComponent({
  name: 'App',
  components: {
    Logo,
    Button,
    Dialog,
    AddPlant,
    AddCrop,
    AddBed,
    AddPlot,
    Octicon,
  },
  setup() {
    const user = useUser()
    const email = ref<string>()
    const password = ref<string>()
    const isLoading = ref(false)
    async function handleLogin() {
      isLoading.value = true
      try {
        if (email.value && password.value) {
          await auth.signInWithEmailAndPassword(email.value, password.value)
        } else {
          throw new Error('Missing email and/or password')
        }
      } catch (error) {
        console.warn(error)
      }
      isLoading.value = false
    }
    async function handleLogout() {
      auth.signOut()
    }

    const isAddingPlant = ref(false)
    const isAddingCrop = ref(false)
    const isAddingBed = ref(false)
    const isAddingPlot = ref(false)
    provide('isAddingPlant', isAddingPlant)
    provide('isAddingCrop', isAddingCrop)
    provide('isAddingBed', isAddingBed)
    provide('isAddingPlot', isAddingPlot)

    const isEditingPlant = ref<Plant>()
    const isEditingCrop = ref<Crop>()
    const isEditingBed = ref<Bed>()
    const isEditingPlot = ref<Plot>()
    provide('isEditingPlant', isEditingPlant)
    provide('isEditingCrop', isEditingCrop)
    provide('isEditingBed', isEditingBed)
    provide('isEditingPlot', isEditingPlot)

    const colorSchemeKey = 'plantrack.color-scheme'
    const colorSchemeStored = window.localStorage.getItem(colorSchemeKey)
    const isDarkMode = ref(colorSchemeStored !== null ? colorSchemeStored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches)
    watch(isDarkMode, (enabled) => {
      document.documentElement.dataset.colorMode = enabled ? 'dark' : 'light'
      window.localStorage.setItem(colorSchemeKey, enabled ? 'dark' : 'light')
    }, { immediate: true })

    const isMenuOpen = ref(false)

    return {
      user,
      email,
      password,
      isLoading,
      handleLogin,
      handleLogout,

      routes,

      isAddingPlant,
      isAddingCrop,
      isAddingBed,
      isAddingPlot,

      isEditingPlant,
      isEditingCrop,
      isEditingBed,
      isEditingPlot,

      isDarkMode,
      isMenuOpen,
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
  .form-group-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  textarea.form-control {
    min-height: 64px;
    height: 64px;
  }
}

.UnderlineNav {
  flex-shrink: 0;

  > * {
    display: flex;
    align-items: center;
    min-height: 48px;
  }
}
.UnderlineNav-item {
  &.selected,
  &[role=tab][aria-selected=true],
  &[aria-current]:not([aria-current=false]) {
    border-bottom-color: var(--color-plantrack-primary);
  }
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

  .TreeNodeName {
    display: flex;
    align-items: center;
    flex: auto;
    gap: 4px;
  }
  .TreeNodeActions {
    display: flex;
    align-self: stretch;

    .btn-octicon {
      display: inline-flex;
      align-items: center;
      height: 100%;
      background-color: transparent;
      padding: 0 0.5em;
      margin: 0;
    }
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

  fieldset > & {
    justify-content: initial;
    max-height: 400px;
    overflow-y: auto;
  }
}
</style>