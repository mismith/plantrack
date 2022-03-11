<template>
  <TreeView
    :nodes="nodes"
    class="CropTreeView"
    v-bind="treeViewProps"
  >
    <template #node-name="{ node }">
      <div class="TreeNodeName">
        {{node.nickname || node.name || node.id}}
        <small v-if="node.name !== node.nickname">({{node.name}})</small>
      </div>
    </template>
    <template #node-append="{ node }">
      <div v-if="editable" class="TreeNodeActions">
        <Button
          v-if="node.name"
          class="btn-invisible px-2 m-0 anim-scale-in"
          @click.stop="isEditingCrop = crops.find(({ id }) => id === node.id)"
        >
          <Octicon name="pencil" />
        </Button>
        <Button
          v-if="node.name"
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
import { computed, defineComponent, inject, PropType, toRefs } from 'vue'
import set from 'lodash.set'

import { useCrops, useTreeViewProps } from '../services/data'
import { database, getUserRefPath, toKeyFieldArray } from '../services/firebase'
import { useAsyncWrapper } from '../services/errors'

import TreeView from '../components/TreeView/TreeView.vue'
import { ITreeNode } from '../components/TreeView'
import Button from '../components/Button.vue'
import Octicon from '../components/Octicon.vue'

export default defineComponent({
  components: {
    TreeView,
    Button,
    Octicon,
  },
  props: {
    modelValue: {
      type: Array as PropType<string[]>,
      required: true,
    },
    editable: {
      type: Boolean,
      required: false,
    },
    multiple: {
      type: Boolean,
      required: false,
    },
  },
  setup(props, { emit }) {
    const { modelValue, multiple } = toRefs(props)

    const [crops] = useCrops()

    function nestedToNodes(nested: Record<string, ITreeNode>): ITreeNode[] {
      const nodes = toKeyFieldArray(nested)
      return nodes.map((node) => ({
        ...node,
        children: nestedToNodes(node.children as any),
      }))
    }
    const nodes = computed(() => {
      if (crops.value) {
        const ordered = [...crops.value].sort((a, b) => (a.nickname || a.name)?.localeCompare(b.nickname || b.name || '') || 0)
        const nested = {}
        ordered.forEach((crop) => {
          const chunks = (crop.nickname || crop.name || '').split(/ [-/] /)
          const path = chunks.reduce((acc, chunk, index) => {
            if (index >= 1) acc.push('children')
            acc.push(chunk)
            return acc
          }, [] as string[])
          set(nested, path, { ...crop, nickname: chunks[chunks.length - 1] })
        })
        return nestedToNodes(nested)
      }
      return []
    })
    const treeViewProps = useTreeViewProps(
      modelValue,
      (v) => emit('update:modelValue', multiple.value ? v : [v]),
      multiple.value ? { checkable: { recurse: true } } : undefined, // @TODO: support post-init changes
      (cropId) => crops.value?.find(({ id }) => id === cropId),
    )

    const toast = inject<Function>('toast')
    const [runAsync] = useAsyncWrapper()
    async function handleRemoveNode(node: ITreeNode, skipConfirm = false) {
      if (skipConfirm || window.confirm('Are you sure?')) {
        runAsync(async () => {
          await database.ref(getUserRefPath(`/crops/${node.id}`)).remove()
          toast?.(`Crop deleted successfully`, 'success')
        })
      }
    }

    return {
      isAddingCrop: inject('isAddingCrop'),
      isEditingCrop: inject('isEditingCrop'),
      crops,

      nodes,
      treeViewProps,
      handleRemoveNode,
    }
  },
})
</script>

