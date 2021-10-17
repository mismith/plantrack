<template>
  <div class="Exporter" style="display: flex; flex-direction: column; overflow: hidden;">
    <header style="text-align: center;">
      <button @click="handleDownload">Download</button>
    </header>
    <div style="flex: auto; display: flex; overflow: hidden;">
      <pre style="flex: 1; overflow-y: auto;">{{ flatEntries }}</pre>
      <pre style="flex: 1; overflow-y: auto;">{{ entries }}</pre>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'

import { Bed, Crop, Plant, Plot } from '../services/data'
import { downloadCSVRowsAsFile } from '../services/exporter'
import { database, useRtdbObject } from '../services/firebase'

export default defineComponent({
  name: 'Exporter',
  setup() {
    const plots = useRtdbObject<Record<string, Plot>>(database.ref('/users/mismith/plots'))
    const beds = useRtdbObject<Record<string, Bed>>(database.ref('/users/mismith/beds'))
    const crops = useRtdbObject<Record<string, Crop>>(database.ref('/users/mismith/crops'))
    const plants = useRtdbObject<Record<string, Plant>>(database.ref('/users/mismith/plants'))

    const bedsWithPlot = computed(() => Object.entries(beds.value || {}).reduce((acc, [bedId, bed]) => {
      acc[bedId] = {
        $plot: plots.value?.[bed.plotId],
        ...bed,
      }
      return acc;
    }, {} as Record<string, any>))
    const plantsWithBedAndCrop = computed(() => Object.entries(plants.value || {}).reduce((acc, [plantId, plant]) => {
      acc[plantId] = {
        $bed: bedsWithPlot.value?.[plant.bedId],
        $crop: crops.value?.[plant.cropId],
        ...plant,
      }
      return acc;
    }, {} as Record<string, any>))
    const entries = computed(() => Object.entries(plantsWithBedAndCrop.value || {}).flatMap(([plantId, { entries, ...plant }]) => Object.entries(entries || {}).map(([entryId, entry]) => ({
      $plant: plant,
      plantId,
      ...(entry as any),
      id: entryId,
    }))))

    const flatEntries = computed(() => entries.value?.map(entry => [
      entry.$plant?.$bed?.$plot?.name || entry.$plant?.$bed?.plotId,
      entry.$plant?.$bed?.name || entry.$plant?.bedId,
      entry.$plant?.$crop?.name || entry.$plant?.cropId,
      entry.$plant?.$crop?.nickname,
      entry.$plant?.name,
      entry.eventId,
      entry.at && new Date(entry.at).toISOString(),
      entry.createdAt && new Date(entry.createdAt).toISOString(),
      entry.payload?.weight?.value,
      entry.payload?.weight?.unit,
      entry.id,
    ]))
    // const csv = computed(() => transformDataToCSVRows(data.value || {}))

    return {
      plants,
      bedsWithPlot,
      plantsWithBedAndCrop,
      entries,
      flatEntries,
      async handleDownload() {
        await downloadCSVRowsAsFile(flatEntries.value)
      },
    }
  },
})
</script>

<style lang="scss">
$spacing: 8px;

</style>