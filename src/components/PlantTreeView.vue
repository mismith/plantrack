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
            style="text-decoration: none;"
            @click.stop="handleAttachmentClick($event, attachment)"
          >📷</a>
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
          v-if="node.type === 'plot'"
          type="button"
          class="btn-octicon"
          @click.stop="isEditingPlot = node"
        >
          <Octicon name="pencil" />
        </button>
        <button
          v-if="node.type === 'bed'"
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
          class="btn-octicon"
          @click.stop="handleRemoveEntry(node, parents, $event.shiftKey)"
        >
          <Octicon name="trash" />
        </button>
        <button
          v-else
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
import { computed, defineComponent, inject, PropType, reactive, watch } from 'vue'

import { usePlantDataTree, Entry, events, Plant, entryToString, useCrops, Attachment } from '../services/data'
import { database, getUserRefPath, storage } from '../services/firebase'

import { Booleanable, ITreeNode, tools } from './TreeView'
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
    },
  },
  setup(props, { emit }) {
    const { nodes, plants, beds } = usePlantDataTree()
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
      selectable: !props.multiple && ((node: ITreeNode) => node.type === 'bed'),
      checkable: props.multiple && ((node: ITreeNode) => node.type !== 'entry' && {
        recurse: true,
      }),
      // renamable: multiple,
    }))
    watch(() => props.modelValue, () => {
      if (props.multiple) {
        treeState.checked = props.modelValue
      } else {
        treeState.selected = props.modelValue
      }
    }, { immediate: true })
    watch(() => props.multiple, () => {
      if (props.multiple) {
        treeState.selected = []
        treeState.checked = props.modelValue
        treeState.disabled = isOrHasDescendent('plant')
      } else {
        treeState.selected = props.modelValue
        treeState.checked = []
        treeState.disabled = isOrHasDescendent('bed')
      }
    }, { immediate: true })

    async function handleRemoveEntry(entry: Entry, parents: ITreeNode[] = [], skipConfirm = false) {
      if (skipConfirm || window.confirm('Are you sure?')) {
        const plant = parents[parents.length - 1] as Plant
        await database.ref(getUserRefPath(`/plants/${plant.id}/entries/${entry.id}`)).remove()
      }
    }
    async function handleRemoveNode(node: ITreeNode, skipConfirm = false) {
      if (skipConfirm || window.confirm('Are you sure?')) {
        await database.ref(getUserRefPath(`/${node.type}s/${node.id}`)).remove()
      }
    }
    async function handleAttachmentClick(event: any, attachment: Attachment) {
      event.preventDefault()
      const ref = storage.ref(`/${attachment.url}`)
      const href = await ref.getDownloadURL()
      const a = document.createElement("a")
      a.target = event.target.target
      a.href = href
      a.click()
    }
    function handleChange(changes: Record<string, any>) {
      Object.assign(treeState, changes)

      let value
      if (props.multiple && changes.checked && Array.isArray(treeState.checked)) {
        value = treeState.checked.filter(
          id => plants.value?.map(({ id }) => id).includes(id)
        )
      } else if (!props.multiple && changes.selected && Array.isArray(treeState.selected)) {
        value = treeState.selected.filter(
          id => beds.value?.map(({ id }) => id).includes(id)
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