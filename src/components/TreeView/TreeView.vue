<template>
  <ol class="TreeView">
    <TreeNode
      v-for="node in nodes"
      :key="node.id"
      :node="node"
      :parents="parents"
      :state="state"
      :options="options"
      :tools="tools"
      @change="handleChange"
    >
      <template v-for="(_, slot) of $slots" v-slot:[slot]="scope">
        <slot :name="slot" v-bind="scope" />
      </template>
    </TreeNode>
  </ol>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

import TreeNode from './TreeNode.vue'
import { ITreeNode, tools as treeTools } from '.'

export default defineComponent({
  name: 'TreeView',
  components: {
    TreeNode,
  },
  props: {
    nodes: {
      type: Array as PropType<ITreeNode[]>,
    },
    parents: {
      type: Array as PropType<ITreeNode[]>,
      default: [],
    },
    state: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({}),
    },
    options: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({}),
    },
    tools: {
      type: Object as PropType<Record<string, any> & typeof treeTools>,
      default: () => treeTools,
    },
  },
  setup({}, { emit }) {
    return {
      handleChange(changes: Record<string, any>) {
        emit('change', changes)
      }
    }
  }
})
</script>

<style lang="scss">
$spacing: 8px;

.TreeView {
}
</style>