<template>
  <ol class="TreeView">
    <TreeNode
      v-for="node in nodes"
      :key="node.id"
      :node="node"
      :state="state"
      :options="options"
    >
      <template v-for="(_, slot) of $slots" v-slot:[slot]="scope">
        <slot :name="slot" v-bind="scope"/>
      </template>
    </TreeNode>
  </ol>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

import TreeNode, { ITreeNode } from './TreeNode.vue'

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
  // setup() {
  //   return {
  //   }
  // },
})
</script>

<style lang="scss">
$spacing: 8px;

.TreeView {
}
</style>