<template>
  <TreeView
    :nodes="nodes"
    :state="treeState"
    :options="treeOptions"
    class="PlantTreeView"
  >
    <template #node-name="{ node, parents }">
      <span class="TreeNodeName">
        <template v-if="node.type === 'entry'">
          <span>{{entryToString(node, { beds })}}</span>

          <button
            type="button"
            @click.stop="handleRemoveEntry(node, parents, $event.shiftKey)"
          >
            &times;
          </button>
        </template>
        <template v-else>
          <span>{{node.name || node.id}}</span>

          <span
            v-if="node.type === 'plant' && node.children?.length" 
            class="eventId"
            :title="getLatestEntryEvent(node)?.id"
            :style="`background-color: ${getLatestEntryEvent(node)?.color || 'currentColor'}`"
          />
          <small v-if="node.children?.length">{<span>{{node.children.length}}</span>}</small>

          <button
            v-if="node.type !== 'entry'"
            type="button"
            @click.stop="handleRemoveNode(node, $event.shiftKey)"
          >
            &times;
          </button>
        </template>
      </span>
    </template>
  </TreeView>
</template>

<script lang="ts">
import { defineComponent, PropType, reactive, watchEffect } from 'vue'

import { usePlantDataTree, Entry, events, Plant, entryToString } from '../services/data'
import { database } from '../services/firebase'
import TreeView, { ITreeNode, tools } from '../components/TreeView.vue'

function isOrHasDescendent(type: string) {
  return (node: ITreeNode) => node.type !== type && !tools.walkDescendents(
    node,
    (child) => child.type === type,
  ).filter(Boolean).length
}

export default defineComponent({
  name: 'PlantTreeView',
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
      disabled: isOrHasDescendent(multiple ? 'plant' : 'bed'),
      // renamed: [],
    })
    const treeOptions = reactive({
      indentable: true,
      expandable: true,
      hoverable: true,
      selectable: !multiple && ((node: ITreeNode) => node.type === 'bed'),
      checkable: multiple && ((node: ITreeNode) => node.type !== 'entry' && {
        recurse: true,
      }),
      // renamable: multiple,
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

      plants,
      beds,
      entryToString,

      events,
      getLatestEntryEvent(node: ITreeNode) {
        return events.find(({ id }) => id === node.children?.[node.children.length - 1]?.eventId)
      },

      async handleRemoveEntry(entry: Entry, parents: ITreeNode[] = [], skipConfirm = false) {
        if (skipConfirm || window.confirm('Are you sure?')) {
          const plant = parents[parents.length - 1] as Plant
          await database.ref(`/users/mismith/plants/${plant.id}/entries/${entry.id}`).remove()
        }
      },
      async handleRemoveNode(node: ITreeNode, skipConfirm = false) {
        if (skipConfirm || window.confirm('Are you sure?')) {
          await database.ref(`/users/mismith/${node.type}s/${node.id}`).remove()
        }
      },
    }
  },
})
</script>

<style lang="scss">
$spacing: 8px;

.PlantTreeView {
  .eventId {
    display: inline-block;
    width: 1em;
    height: 1em;
    vertical-align: middle;
    border-radius: 1em;
    margin-left: 0.33em;
  }
  .TreeNodeName {
    > button,
    > span,
    > small {
      margin-left: 0.33em;
    }
    &:not(:hover) {
      button {
        visibility: hidden;
      }
    }
  }
}
</style>