<template>
  <router-view />

  <router-link
    v-for="route in routes.filter(({ path }) => path !== '/')"
    :key="route.path"
    :to="route.path"
  >
    {{route.path}}
  </router-link>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { routes } from './router'

export default defineComponent({
  name: 'App',
  setup() {
    return {
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
        // border-right: solid 1px ButtonFace;
      }

      .TreeNodeExpand {
        appearance: none;
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
</style>