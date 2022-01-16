<template>
  <div class="Analyzer width-full mx-auto" style="max-width: 600px;">
    <form @submit.prevent class="p-3">
      <fieldset class="form-group">
        <header class="form-group-header">
          <label>Crop(s)</label>
        </header>
        <SelectMenu
          :value="cropIds.length > 1 ? `${cropIds.length} crops selected` : cropIds.map((cropId) => crops.find(({ id }) => id === cropId)?.nickname).filter(Boolean)"
          createable
          createable-type="crop"
          :clearable="Boolean(cropIds.length)"
          @create="isAddingCrop = true"
          @clear="cropIds = []"
        >
          <CropTreeView
            v-if="crops?.length"
            v-model="cropIds"
            multiple
          />
        </SelectMenu>
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
import { defineComponent, inject, ref } from 'vue'

import { useCrops } from '../services/data'
import { database, getUserRefPath } from '../services/firebase'
import { downloadCSVRowsAsFile, useExportableData } from '../services/exporter'

import TransitionExpand from '../components/TreeView/TransitionExpand.vue'
import SelectMenu from '../components/SelectMenu.vue'
import CropStatsCard from '../components/CropStatsCard.vue'
import Octicon from '../components/Octicon.vue'
import Button from '../components/Button.vue'
import CropTreeView from '../components/CropTreeView.vue'

export default defineComponent({
  name: 'Analyzer',
  components: {
    TransitionExpand,
    SelectMenu,
    CropTreeView,
    CropStatsCard,
    Octicon,
    Button,
  },
  setup() {
    const crops = useCrops()
    const cropIds = ref([])

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

      importInputRef,
      handleImport,

      handleExport,
    }
  },
})
</script>

<style lang="scss">
</style>
