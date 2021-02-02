<template>
  <!-- <Plotter /> -->
  <!-- <Recorder /> -->
  <Planter />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Plotter from './views/Plotter.vue'
import Recorder from './views/Recorder.vue'
import Planter from './views/Planter.vue'

export default defineComponent({
  name: 'App',
  components: {
    Plotter,
    Recorder,
    Planter,
  },
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

  > .TreeNode {
    > .TreeNodeLeaf {
      display: flex;
      align-items: center;

      &.hoverable {
        &:hover {
          background-color: ButtonFace;
        }
      }

      .TreeNodeIndent {
        display: inline-block;
        width: $spacing * 3;
        align-self: stretch;
        // border-right: solid 1px ButtonFace;
      }

      .TreeNodeExpand {
        appearance: none;
        background: none;
        color: inherit;
        font-size: 0;
        padding: 10px 5.5px;
        margin: 0;
        border: none;
        outline: none;
        opacity: 0.5;
        transition: all 0.1s;
        cursor: inherit;

        &::after {
          content: "";
          border: solid 5px transparent;
          border-left-color: currentColor;
          border-left-width: 8px;
          border-right-width: 0;
        }
      }
      &.expandable {
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
        transform: scale(1.5);
        margin: 0.4em $spacing;
      }
      &.selectable {
        cursor: default;
      }
      &.selected {
        &,
        &:hover {
          background-color: Highlight;
          color: HighlightText;
        }
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
    }
  }
}
</style>