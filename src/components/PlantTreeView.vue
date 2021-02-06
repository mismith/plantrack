<template>
  <TreeView
    :nodes="nodes"
    :state="treeState"
    :options="treeOptions"
    class="PlantTreeView"
  >
    <template #node-name="{ node, parents }">
      <span class="TreeNodeName">
        <span v-if="node.type === 'entry'">
          {{node.eventId}} @ {{new Date(node.at).toISOString()}}
          <button type="button" @click="handleRemoveEntry(node, parents)">&times;</button>
        </span>
        <template v-else>
          {{node.name || node.id}}
        </template>
      </span>
    </template>
  </TreeView>
</template>

<script lang="ts">
import { defineComponent, PropType, reactive, watchEffect } from 'vue'

import { usePlantDataTree, Entry, Plant } from '../services/data'
import { database } from '../services/firebase'
import TreeView, { ITreeNode, tools } from '../components/TreeView.vue'

export default defineComponent({
  name: 'Recorder',
  components: {
    TreeView,
  },
  props: {
    modelValue: {
      type: Array as PropType<string[]>,
      required: true,
    },
    multiple: {
      type: Boolean,
    },
  },
  setup({ modelValue = [], multiple }, { emit }) {
    const { nodes, plants, beds } = usePlantDataTree()
    const treeState = reactive({
      expanded: [],
      hovered: [],
      selected: multiple ? [] : modelValue,
      checked: multiple ? modelValue : [],
      disabled: (node: ITreeNode) => node.type !== 'plant' && !tools.walkChildren(
        node,
        (child) => child.type === 'plant',
      ).filter(Boolean).length,
      renamed: [],
    })
    const treeOptions = reactive({
      indentable: true,
      expandable: true,
      hoverable: true,
      selectable: !multiple && ((node: ITreeNode) => node.type === 'bed'),
      checkable: multiple && ((node: ITreeNode) => node.type !== 'entry' && {
        recurse: true,
      }),
    })

    watchEffect(() => {
      emit('update:modelValue', multiple
        ? treeState.checked.filter(
          id => plants.value?.map(({ id }) => id).includes(id)
        )
        : treeState.selected.filter(
          id => beds.value?.map(({ id }) => id).includes(id)
        )
      )
    })

    return {
      nodes,
      treeState,
      treeOptions,

      async handleRemoveEntry(entry: Entry, parents: ITreeNode[] = []) {
        const plant = parents[parents.length - 1] as Plant
        await database.ref(`/users/mismith/plants/${plant.id}/entries/${entry.id}`).remove()
      },
    }
  },
})
</script>

<style lang="scss">
$spacing: 8px;

.PlantTreeView {
}
</style>