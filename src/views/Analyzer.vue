<template>
  <div class="Analyzer width-full mx-auto" style="max-width: 600px;">
    <form @submit.prevent class="p-3">
      <fieldset class="form-group">
        <header class="form-group-header">
          <label>Crop(s)</label>
        </header>
        <TreeViewSelectMenu
          :value="cropIds.length > 1 ? `${cropIds.length} crops selected` : cropIds.map((cropId) => crops.find(({ id }) => id === cropId)?.nickname).filter(Boolean)"
          createable
          createable-type="crop"
          :clearable="Boolean(cropIds.length)"
          @create="isAddingCrop = true"
          @clear="cropIds = []"
        >
          <TreeView
            v-if="crops?.length"
            :nodes="nodes"
            v-bind="treeView.bind"
            v-on="treeView.on"
          >
            <template #node-name="{ node }">
              <div class="TreeNodeName">
                {{node.nickname || node.name || node.id}}
                <small v-if="node.name && node.nickname">({{node.name}})</small>
              </div>
            </template>
            <template #node-append="{ node }">
              <div class="TreeNodeActions">
                <button
                  v-if="node.name"
                  type="button"
                  class="btn-octicon"
                  @click.stop="isEditingCrop = crops.find(({ id }) => id === node.id)"
                >
                  <Octicon name="pencil" />
                </button>
                <button
                  v-if="node.name"
                  type="button"
                  class="btn-octicon btn-octicon-danger"
                  @click.stop="handleRemoveNode(node, $event.shiftKey)"
                >
                  <Octicon name="trash" />
                </button>
              </div>
            </template>
          </TreeView>
        </TreeViewSelectMenu>
      </fieldset>

      <TransitionExpand group>
        <CropStatsCard v-for="cropId in cropIds" :key="cropId" :crop-id="cropId" class="mb-3" />
      </TransitionExpand>

      <fieldset class="form-group">
        <header class="form-group-header">
          <label>Import Crops</label>
        </header>
        <input ref="importInputRef" type="file" accept="text/csv" class="form-control width-full" @change="handleImport" />
      </fieldset>

      <fieldset class="form-group">
        <header class="form-group-header">
          <label>Export Entries</label>
        </header>
        <Button @click="handleExport">Download CSV</Button>
      </fieldset>
    </form>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject, ref } from 'vue'
import set from 'lodash.set'

import { useCrops, useTreeViewProps } from '../services/data'
import { database, getUserRefPath, toKeyFieldArray } from '../services/firebase'
import { useAsyncWrapper } from '../services/errors'
import { downloadCSVRowsAsFile, useExportableData } from '../services/exporter'

import TransitionExpand from '../components/TreeView/TransitionExpand.vue'
import TreeViewSelectMenu from '../components/TreeViewSelectMenu.vue'
import TreeView from '../components/TreeView/TreeView.vue'
import CropStatsCard from '../components/CropStatsCard.vue'
import { ITreeNode } from '../components/TreeView'
import Octicon from '../components/Octicon.vue'
import Button from '../components/Button.vue'

export default defineComponent({
  name: 'Analyzer',
  components: {
    TransitionExpand,
    TreeViewSelectMenu,
    TreeView,
    CropStatsCard,
    Octicon,
    Button,
  },
  setup() {
    const crops = useCrops()
    const cropIds = ref([])

    function nestedToNodes(nested: Record<string, ITreeNode>): ITreeNode[] {
      const nodes = toKeyFieldArray(nested)
      return nodes.map((node) => ({
        ...node,
        children: nestedToNodes(node.children as any),
      }))
    }
    const nodes = computed(() => {
      if (crops.value) {
        const ordered = [...crops.value].sort((a, b) => a.nickname?.localeCompare(b.nickname || '') || 0)
        const nested = {}
        ordered.forEach((crop) => {
          const chunks = (crop.nickname || '').split(/ [-/] /)
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
    const treeView = useTreeViewProps(cropIds, { checkable: { recurse: true } }, (cropId) => crops.value?.find(({ id }) => id === cropId))

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

    const importInputRef = ref<HTMLInputElement | null>(null)
    async function handleImport(event: any) {
      const [file] = event.target.files
      const csv: string = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e: any) => resolve(e.target.result)
        reader.onerror = reject
        reader.readAsText(file)
      })
      const [headersStr, ...rowsStrs] = csv.split('\n')
      const headers = headersStr.split(',').map(chunk => chunk?.trim?.() || chunk)
      const rows = rowsStrs.map(rowStr => rowStr.split(',').map(chunk => chunk?.trim?.() || chunk))
      const newCrops = rows.map(row => {
        const crop: any = {}
        headers.forEach((name, index) => {
          if (/^[\d\.]+$/.test(row[index])) {
            crop[name] = Number.parseFloat(row[index])
          } else if (row[index] !== '') {
            crop[name] = row[index]
          }
        })
        return crop
      })

      const existingCrops = Object.entries((await database.ref(getUserRefPath('/crops')).once('value')).val())
      const imported = await Promise.all(newCrops.map(async (newCrop) => {
        const existingCrop = existingCrops.find(([id, { name }]: [string, any]) => name === newCrop.name)
        if (existingCrop) {
          await database.ref(getUserRefPath(`/crops/${existingCrop[0]}`)).update(newCrop)
        } else {
          await database.ref(getUserRefPath('/crops')).push(newCrop)
        }
      }))

      if (importInputRef.value) {
        importInputRef.value.value = ''
      }
      toast?.(`Imported ${imported.length} crops successfully`, 'success')
    }


    const { flatEntries } = useExportableData()
    async function handleExport() {
      await downloadCSVRowsAsFile(flatEntries.value)
    }

    return {
      isAddingCrop: inject('isAddingCrop'),
      isEditingCrop: inject('isEditingCrop'),
      crops,
      cropIds,

      nodes,
      treeView,
      handleRemoveNode,

      importInputRef,
      handleImport,

      handleExport,
    }
  },
})
</script>

<style lang="scss">
</style>
