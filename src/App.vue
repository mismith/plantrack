<template>
  <header style="display: flex; justify-content: space-between; align-items: center; padding: 8px;">
    <img :src="logo" alt="plantrack" style="max-height: 1.5em;" />
    <div v-if="user">
      {{user.email}}
      <button @click="handleLogout">Logout</button>
    </div>
  </header>

  <template v-if="user">
    <router-view style="flex: auto;" />

    <div style="display: flex;">
      <router-link
        v-for="route in routes.filter(({ path, meta }) => path !== '/' && !meta?.hidden)"
        :key="route.path"
        :to="route.path"
        style="flex: auto; font-variant: small-caps; text-align: center; padding: 8px;"
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

import { routes } from './router'
import { auth, useUser } from './services/firebase'
import logo from './logo.svg'

export default defineComponent({
  name: 'App',
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

    return {
      email,
      password,
      user,
      handleLogin,
      handleLogout,

      logo,
      routes,
    }
  }
})
</script>

<style lang="scss">
$spacing: 8px;

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

      &.hoverable {
        &.hovered {
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

  fieldset > & {
    justify-content: initial;
    max-height: 400px;
    border: solid 1px rgb(118, 118, 118);
    border-radius: 2px;
    overflow-y: auto;
  }
}

form {
  display: flex;
  flex-direction: column;
  overflow: hidden; // @HACK: AddPlant <select> is too wide

  fieldset {
    display: flex;
    flex-direction: column;

    .TreeView,
    input:not([type="file"]),
    select,
    textarea,
    [type="submit"] {
      font-size: 16px;
    }

    textarea {
      resize: vertical;
    }
  }
}
</style>