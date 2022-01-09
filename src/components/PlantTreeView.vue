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
          <a
            v-for="attachment in node.attachments"
            :key="attachment.url"
            href="#"
            target="_blank"
            :title="attachment.name"
            class="btn-octicon"
            @click.stop="handleAttachmentClick($event, attachment)"
          >
            <Octicon name="image" />
          </a>
        </template>
        <template v-else>
          <div style="display: inline-flex; flex-direction: column;">
            <span>{{node.name || node.id}}</span>
            <small v-if="node.cropId" style="font-size: 0.75em;">{{crops?.find(({ id }) => id === node.cropId)?.nickname}}</small>
          </div>

          <span
            v-if="node.type === 'plant' && node.children?.length" 
            class="eventId"
            :title="getLatestEntryEvent(node)?.id"
            :style="`background-color: ${getLatestEntryEvent(node)?.color || 'currentColor'}`"
          />
          <small v-if="node.children?.length">{<span>{{node.children.length}}</span>}</small>
        </template>
      </div>
    </template>
    <template #node-append="{ node, parents }">
      <div class="TreeNodeActions">
        <button
          v-if="node.type === 'plot' && node.id !== 'system'"
          type="button"
          class="btn-octicon"
          @click.stop="isEditingPlot = node"
        >
          <Octicon name="pencil" />
        </button>
        <button
          v-if="node.type === 'bed' && node.plotId !== 'system'"
          type="button"
          class="btn-octicon"
          @click.stop="isEditingBed = node"
        >
          <Octicon name="pencil" />
        </button>
        <button
          v-if="node.type === 'plant'"
          type="button"
          class="btn-octicon"
          @click.stop="isEditingPlant = node"
        >
          <Octicon name="pencil" />
        </button>
        <button
          v-if="node.type === 'entry'"
          type="button"
          class="btn-octicon btn-octicon-danger"
          @click.stop="handleRemoveEntry(node, parents, $event.shiftKey)"
        >
          <Octicon name="trash" />
        </button>
        <button
          v-else-if="node.id !== 'system' && node.plotId !== 'system'"
          type="button"
          class="btn-octicon btn-octicon-danger"
          @click.stop="handleRemoveNode(node, $event.shiftKey)"
        >
          <Octicon name="trash" />
        </button>
      </div>
    </template>
  </TreeView>
</template>

<script lang="ts">
import { computed, defineComponent, inject, PropType, reactive, toRefs, watch } from 'vue'

import { usePlantDataTree, Entry, events, Plant, entryToString, useCrops, Attachment } from '../services/data'
import { database, getUserRefPath, storage } from '../services/firebase'
import { useAsyncWrapper } from '../services/errors'

import { Booleanable, ITreeNode, set, tools, walkDescendents } from './TreeView'
import TreeView from './TreeView/TreeView.vue'
import Octicon from './Octicon.vue'

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
    Octicon,
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
    filter: {
      type: Function as PropType<(node: ITreeNode) => boolean>,
      required: false,
    },
    selectableType: {
      type: String,
      default: 'bed',
    },
  },
  setup(props, { emit }) {
    const { modelValue, multiple, filter, selectableType } = toRefs(props)
    const { nodes, plants, beds, plots } = usePlantDataTree({ filter: filter.value })
    const crops = useCrops()

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
    async function handleAttachmentClick(event: any, attachment: Attachment) {
      runAsync(async () => {
        event.preventDefault()
        const ref = storage.ref(`/${attachment.url}`)
        const href = await ref.getDownloadURL()
        const a = document.createElement("a")
        a.target = event.target.target
        a.href = href
        a.click()
      })
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
      handleAttachmentClick,
      handleChange,
    }
  },
})
</script>

<style lang="scss">
.PlantTreeView {
  .eventId {
    display: inline-block;
    width: 1em;
    height: 1em;
    vertical-align: middle;
    border-radius: 1em;
  }
}
</style>