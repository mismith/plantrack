<template>
  <TreeView
    :nodes="nodes"
    :state="treeState"
    :options="treeOptions"
    class="PlantTreeView"
    @change="handleChange"
  >
    <template #node-name="{ node }">
      <div class="TreeNodeName">
        <template v-if="node.type === 'entry'">
          <span>{{entryToString(node, { beds, plants })}}</span>
          <AttachmentLink
            v-for="attachment in node.attachments"
            :key="attachment.id"
            :attachment="attachment"
            class="btn btn-invisible px-2"
          />
        </template>
        <template v-else>
          <div class="d-flex flex-column">
            <div class="d-flex flex-items-center" style="gap: 4px;">
              <span>{{node.name || node.id}}</span>
              <span v-if="node.children?.length" class="Counter Counter--secondary">{{node.children.length}}</span>
              <Blip
                v-if="node.type === 'plant' && node.children?.length" 
                :title="getLatestEntryEvent(node)?.id"
                :color="getLatestEntryEvent(node)?.color"
              />
            </div>
            <small v-if="node.cropId" style="font-size: 0.75em;">{{crops?.find(({ id }) => id === node.cropId)?.nickname}}</small>
          </div>
        </template>
      </div>
    </template>
    <template #node-append="{ node, parents }">
      <div v-if="editable" class="TreeNodeActions">
        <Button
          v-if="node.type === 'plot'"
          class="btn-invisible px-2 m-0 anim-scale-in"
          @click.stop="isEditingPlot = node"
        >
          <Octicon name="pencil" />
        </Button>
        <Button
          v-if="node.type === 'bed'"
          class="btn-invisible px-2 m-0 anim-scale-in"
          @click.stop="isEditingBed = node"
        >
          <Octicon name="pencil" />
        </Button>
        <Button
          v-if="node.type === 'plant'"
          class="btn-invisible px-2 m-0 anim-scale-in"
          @click.stop="isEditingPlant = node"
        >
          <Octicon name="pencil" />
        </Button>
        <Button
          v-if="node.type === 'entry'"
          class="btn-invisible btn-danger px-2 m-0 anim-scale-in"
          @click.stop="handleRemoveEntry(node, parents, $event.shiftKey)"
        >
          <Octicon name="trash" />
        </Button>
        <Button
          v-else
          class="btn-invisible btn-danger px-2 m-0 anim-scale-in"
          @click.stop="handleRemoveNode(node, $event.shiftKey)"
        >
          <Octicon name="trash" />
        </Button>
      </div>
    </template>
  </TreeView>
</template>

<script lang="ts">
import { computed, defineComponent, inject, PropType, reactive, toRefs, watch } from 'vue'

import { usePlantDataTree, Entry, events, Plant, entryToString, useCrops, useRestoreKey } from '../services/data'
import { database, getUserRefPath } from '../services/firebase'
import { useAsyncWrapper } from '../services/errors'

import { Booleanable, ITreeNode, set, tools, walkDescendents } from './TreeView'
import TreeView from './TreeView/TreeView.vue'
import AttachmentLink from './AttachmentLink.vue'
import Button from './Button.vue'
import Octicon from './Octicon.vue'
import Blip from './Blip.vue'

function isOrHasDescendent(type: string) {
  return (node: ITreeNode) => node.type !== type && !tools.walkDescendents(
    node,
    (child) => child.type === type,
  ).some(Boolean)
}

export default defineComponent({
  name: 'PlantTreeView',
  components: {
    TreeView,
    AttachmentLink,
    Button,
    Octicon,
    Blip,
  },
  props: {
    modelValue: {
      type: Array as PropType<string[]>,
      required: true,
    },
    multiple: {
      type: Boolean,
      required: false,
    },
    editable: {
      type: Boolean,
      required: false,
    },
    filter: {
      type: Function as PropType<(node: ITreeNode) => boolean>,
      required: false,
    },
    selectableType: {
      type: String,
      default: 'bed',
    },
    restoreKey: {
      type: String,
      required: false,
    },
  },
  setup(props, { emit }) {
    const { modelValue, multiple, filter, selectableType, restoreKey } = toRefs(props)
    const { nodes, plants, beds, plots } = usePlantDataTree({ filter: filter.value })
    const [crops] = useCrops()

    const treeState = reactive<Record<string, Booleanable>>({
      expanded: [],
      selected: [],
      checked: [],
      disabled: [],
      // renamed: [],
    })
    const treeOptions = computed(() => ({
      indentable: true,
      expandable: true,
      selectable: !multiple.value && ((node: ITreeNode) => node.type === selectableType.value),
      checkable: multiple.value && ((node: ITreeNode) => node.type !== 'entry' && {
        recurse: true,
      }),
      // renamable: multiple,
    }))
    watch(modelValue, (v) => {
      if (multiple.value) {
        treeState.checked = v
      } else {
        treeState.selected = v
      }
    }, { immediate: true })
    watch(multiple, (v) => {
      if (v) {
        treeState.selected = []
        treeState.checked = modelValue.value
        treeState.disabled = isOrHasDescendent('plant')
      } else {
        treeState.selected = modelValue.value
        treeState.checked = []
        treeState.disabled = isOrHasDescendent(selectableType.value)
      }
    }, { immediate: true })

    // auto-expand parents above restored selections
    if (modelValue.value?.length) {
      const checkNode = (node: ITreeNode) => {
        const containsDescendent = walkDescendents(node, checkNode).filter(Boolean).length
        if (node.id === modelValue.value?.[0]) {
          return true
        } else if (containsDescendent) {
          treeState.expanded = set(treeState.expanded, node, true)
          return true
        }
        return false
      }
      nodes.value.forEach(checkNode)
    }

    const toast = inject<Function>('toast')
    const [runAsync] = useAsyncWrapper()
    async function handleRemoveEntry(entry: Entry, parents: ITreeNode[] = [], skipConfirm = false) {
      if (skipConfirm || window.confirm('Are you sure?')) {
        runAsync(async () => {
          const plant = parents[parents.length - 1] as Plant
          await database.ref(getUserRefPath(`/plants/${plant.id}/entries/${entry.id}`)).remove()
          toast?.('Entry deleted successfully', 'success')
        })
      }
    }
    async function handleRemoveNode(node: ITreeNode, skipConfirm = false) {
      if (skipConfirm || window.confirm('Are you sure?')) {
        runAsync(async () => {
          await database.ref(getUserRefPath(`/${node.type}s/${node.id}`)).remove()
          const type = `${node.type.charAt(0).toUpperCase()}${node.type.slice(1)}`
          toast?.(`${type} deleted successfully`, 'success')
        })
      }
    }
    function handleChange(changes: Record<string, any>) {
      Object.assign(treeState, changes)

      let value
      if (multiple.value && changes.checked && Array.isArray(treeState.checked)) {
        value = treeState.checked.filter(
          id => plants.value?.map(({ id }) => id).includes(id)
        )
      } else if (!multiple.value && changes.selected && Array.isArray(treeState.selected)) {
        const collection = selectableType.value === 'plot' ? plots : beds
        value = treeState.selected.filter(
          id => collection.value?.map(({ id }) => id).includes(id)
        )
      }
      if (value) {
        emit('update:modelValue', value)
      }
    }

    if (restoreKey.value) { // @TODO: what if this value changes post-init?
      const restore = useRestoreKey(restoreKey.value, 'PlantTreeView')
      const v = restore.load()
      if (Array.isArray(v)) {
        treeState.expanded = v
      }
      watch(() => treeState.expanded, (v) => {
        restore.save(v)
      })
    }

    return {
      nodes,
      treeState,
      treeOptions,

      plants,
      beds,
      entryToString,
      crops,

      events,
      getLatestEntryEvent(node: ITreeNode) {
        return events.find(({ id }) => id === node.children?.[node.children.length - 1]?.eventId)
      },

      isEditingPlot: inject('isEditingPlot'),
      isEditingBed: inject('isEditingBed'),
      isEditingPlant: inject('isEditingPlant'),
      handleRemoveEntry,
      handleRemoveNode,
      handleChange,
    }
  },
})
</script>

<style lang="scss">
.PlantTreeView {
  .TreeNodeLeaf {
    align-items: flex-start;
  }
}
</style>
