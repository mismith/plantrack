<template>
  <ol class="TreeView">
    <TreeNode
      v-for="node in nodes"
      :key="node.id"
      :node="node"
      :parents="parents"
      :state="state"
      :options="options"
    >
      <template v-for="(_, slot) of $slots" v-slot:[slot]="scope">
        <slot :name="slot" v-bind="scope" />
      </template>
    </TreeNode>
  </ol>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

import TreeNode, { ITreeNode, tools } from './TreeNode.vue'

export type { ITreeNode }
export { tools }

export default defineComponent({
  name: 'TreeView',
  components: {
    TreeNode,
  },
  props: {
    nodes: {
      type: Array as PropType<ITreeNode[]>,
      required: true,
    },
    parents: {
      type: Array as PropType<ITreeNode[]>,
      required: false,
      default: [],
    },
    state: {
      type: Object as PropType<Record<string, any>>,
    },
    options: {
      type: Object as PropType<Record<string, any>>,
    },
    tools: {
      type: Object as PropType<Record<string, any>>,
    },
  },
})
</script>

<style lang="scss">
$spacing: 8px;

.TreeView {
}
</style>