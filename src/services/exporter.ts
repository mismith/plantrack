import { computed } from 'vue'

import { Bed, Crop, Plant, Plot } from '../services/data'
import { database, getUserRefPath, useRtdbObject } from '../services/firebase'

export function useHydratedEntries() {
  const plots = useRtdbObject<Record<string, Plot>>(database.ref(getUserRefPath('/plots')))
  const beds = useRtdbObject<Record<string, Bed>>(database.ref(getUserRefPath('/beds')))
  const crops = useRtdbObject<Record<string, Crop>>(database.ref(getUserRefPath('/crops')))
  const plants = useRtdbObject<Record<string, Plant>>(database.ref(getUserRefPath('/plants')))

  const bedsWithPlot = computed(() => Object.entries(beds.value || {}).reduce((acc, [bedId, bed]) => {
    acc[bedId] = {
      $plot: plots.value?.[bed.plotId],
      ...bed,
    }
    return acc
  }, {} as Record<string, any>))
  const plantsWithBedAndCrop = computed(() => Object.entries(plants.value || {}).reduce((acc, [plantId, plant]) => {
    acc[plantId] = {
      $bed: bedsWithPlot.value?.[plant.bedId],
      $crop: crops.value?.[plant.cropId],
      ...plant,
    }
    return acc
  }, {} as Record<string, any>))
  const entries = computed(() => Object.entries(plantsWithBedAndCrop.value || {}).flatMap(([plantId, { entries, ...plant }]) => Object.entries(entries || {}).map(([entryId, entry]) => ({
    $plant: plant,
    plantId,
    ...(entry as any),
    id: entryId,
  }))))
  return {
    plots,
    beds,
    crops,
    plants,
    entries,
  }
}
export function useExportableData() {
  const { entries } = useHydratedEntries()
  const flatEntries = computed(() => [[
    'Entry ID',
    'Plot',
    'Bed',
    'Crop ID',
    'Crop Name',
    'Plant',
    'Event',
    'Event At',
    'Created At',
    'Updated At',
    'Harvest Value',
    'Harvest Unit',
  ]].concat(entries.value?.map(entry => [
    entry.id,
    entry.$plant?.$bed?.$plot?.name || entry.$plant?.$bed?.plotId,
    entry.$plant?.$bed?.name || entry.$plant?.bedId,
    entry.$plant?.$crop?.name || entry.$plant?.cropId,
    entry.$plant?.$crop?.nickname,
    entry.$plant?.name,
    entry.eventId,
    entry.at && new Date(entry.at).toISOString(),
    entry.createdAt && new Date(entry.createdAt).toISOString(),
    entry.updatedAt && new Date(entry.updatedAt).toISOString(),
    entry.payload?.weight?.value,
    entry.payload?.weight?.unit,
  ])))

  return {
    entries,
    flatEntries,
  }
}

function writeToString(rows: any[][]) {
  return rows.map(row => `"${row.join('","')}"`).join('\n')
}

export async function downloadCSVRowsAsFile(csvRows: any[][]) {
  const csvString = await writeToString(csvRows)

  const a = document.createElement('a')
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  a.href = url
  a.setAttribute('download', 'export.csv')
  a.click()
}
