<template>
  <header style="display: flex; justify-content: space-between; align-items: center; padding: 8px;">
    <Logo class="logo" />
    <div v-if="user">
      {{user.email}}
      <button @click="handleLogout">Logout</button>
    </div>
  </header>

  <template v-if="user">
    <router-view style="flex: auto;" />

    <div class="pages">
      <router-link
        v-for="route in routes.filter(({ path, meta }) => path !== '/' && !meta?.hidden)"
        :key="route.path"
        :to="route.path"
      >
        {{route.path.replace(/\//, '')}}
      </router-link>
    </div>
  </template>

  <form v-else style="margin: auto;" @submit.prevent="handleLogin">
    <input type="email" v-model="email" placeholder="Email" />
    <input type="password" v-model="password" placeholder="Password" />
    <button type="submit">Login</button>
  </form>

  <Dialog v-model="isAddingPlant"><AddPlant /></Dialog>
  <Dialog v-model="isAddingCrop"><AddCrop /></Dialog>
  <Dialog v-model="isAddingBed"><AddBed /></Dialog>
  <Dialog v-model="isAddingPlot"><AddPlot /></Dialog>
  <Dialog :model-value="Boolean(isEditingCrop)" @update:model-value="isEditingCrop = undefined">
    <AddCrop :crop="isEditingCrop" @update="isEditingCrop = undefined" />
  </Dialog>
  <Dialog :model-value="Boolean(isEditingBed)" @update:model-value="isEditingBed = undefined">
    <AddBed :bed="isEditingBed" @update="isEditingBed = undefined" />
  </Dialog>
  <Dialog :model-value="Boolean(isEditingPlot)" @update:model-value="isEditingPlot = undefined">
    <AddPlot :plot="isEditingPlot" @update="isEditingPlot = undefined" />
  </Dialog>
</template>

<script lang="ts">
/// <reference types="vite-svg-loader" />
import { defineComponent, provide, ref } from 'vue'

import { routes } from './router'
import { auth, useUser } from './services/firebase'
import { Bed, Crop, Plot } from './services/data'

import Logo from './logo.svg?component'
import Dialog from './components/Dialog.vue'
import AddPlant from './components/AddPlant.vue'
import AddCrop from './components/AddCrop.vue'
import AddBed from './components/AddBed.vue'
import AddPlot from './components/AddPlot.vue'

export default defineComponent({
  name: 'App',
  components: {
    Logo,
    Dialog,
    AddPlant,
    AddCrop,
    AddBed,
    AddPlot,
  },
  setup() {
    const user = useUser()
    const email = ref<string>()
    const password = ref<string>()
    async function handleLogin() {
      if (email.value && password.value) {
        await auth.signInWithEmailAndPassword(email.value, password.value)
      } else {
        console.warn('Missing email and/or password', email.value, password.value)
      }
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

    const isEditingCrop = ref<Crop>()
    const isEditingBed = ref<Bed>()
    const isEditingPlot = ref<Plot>()
    provide('isEditingCrop', isEditingCrop)
    provide('isEditingBed', isEditingBed)
    provide('isEditingPlot', isEditingPlot)

    return {
      email,
      password,
      user,
      handleLogin,
      handleLogout,

      routes,

      isAddingPlant,
      isAddingCrop,
      isAddingBed,
      isAddingPlot,

      isEditingCrop,
      isEditingBed,
      isEditingPlot,
    }
  }
})
</script>

<style lang="scss">
$spacing: 8px;

.logo {
  width: auto;
  height: 1.5em;

  path[fill="#000"] {
    fill: currentColor;
  }
}

.pages {
  display: flex;
  gap: $spacing;
  padding: $spacing;

  a {
    flex: auto;
    color: inherit;
    font-variant: small-caps;
    text-align: center;
    text-decoration: none;
    padding: $spacing;
    border: 1px solid #999;
    border-radius: calc($spacing / 2);

    &:hover {
      background-color: #7777;
    }
    &.router-link-active {
      background-color: #9999;
    }
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
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

button {
  &.active {
    background-color: Highlight;
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
        background-color: ButtonFace;
      }
      @media (pointer: fine) {
        &:hover {
          background-color: ButtonFace;
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
          border: solid 5px transparent;
          border-left-color: currentColor;
          border-left-width: 8px;
          border-right-width: 0;
          margin: -5px -4px;
        }
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
          background-color: Highlight;
          color: HighlightText;
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

  .TreeNodeName,
  .TreeNodeActions {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .TreeNodeName {
    flex: auto;
  }
  .TreeNodeActions {
    padding: 0 4px;
  }
  @media (pointer: fine) {
    .TreeNodeLeaf:not(:hover) {
      .TreeNodeActions {
        visibility: hidden;
      }
    }
  }

  fieldset > & {
    justify-content: initial;
    max-height: 400px;
    border: solid 1px rgb(118, 118, 118);
    border-radius: calc($spacing / 2);
    overflow-y: auto;
  }
}

form {
  display: flex;
  flex-direction: column;
  padding: $spacing;
  gap: $spacing;
  overflow: hidden; // @HACK: AddPlant <select> is too wide

  fieldset {
    display: flex;
    flex-direction: column;
    gap: $spacing;
    padding: $spacing;
    border: 0;
    margin: 0;

    label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    > header {
      display: flex;
      align-items: center;
      column-gap: calc($spacing / 2);
    }

    .TreeView,
    input:not([type="file"]),
    select,
    textarea,
    [type="submit"] {
      font-size: 16px;
    }

    select {
      width: 100%;
    }
    textarea {
      resize: vertical;
    }
  }
}
</style>