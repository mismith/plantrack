import { DataList, RecordEntry } from '../data'

export function addRecord(
  record: Omit<RecordEntry, 'id' | 'at'> & Partial<RecordEntry>,
  data: DataList,
) {
  data.records.push({
    id: `record-${Math.random().toString().slice(2)}`,
    at: new Date().toISOString(),
    ...record,
  })
}

export function getPlantsInBed(bedId: string, data: DataList) {
  const bedRecords = data.records.filter(
    (record) => record.payload?.bedId === bedId || record.payload?.prevBedId === bedId
  )
  const plantMap = bedRecords.reduce((acc: Record<string, boolean>, record: RecordEntry) => {
    switch (record.eventId) {
      case 'seed': {
        record.plantIds.forEach((plantId) => {
          acc[plantId] = true
        })
        break
      }
      case 'transplant': {
        record.plantIds.forEach((plantId) => {
          acc[plantId] = record.payload?.bedId === bedId
        })
        break
      }
      case 'cull': {
        record.plantIds.forEach((plantId) => {
          acc[plantId] = false
        })
        break
      }
      default: {
        break
      }
    }
    return acc
  }, {})
  const plantIds = Object.entries(plantMap).filter(([, v]) => v).map(([k]) => k)
  const plants = data.plants.filter(({ id }) => plantIds.includes(id))
  return plants
}

export function addPlant({ bedId, cropId }: any, data: DataList) {
  const id = `plant-${Math.random().toString().slice(2)}`
  data.plants.push({
    id,
    cropId,
  })
  addRecord({
    eventId: 'seed',
    plantIds: [id],
    payload: {
      bedId,
    },
  }, data)
}
export function movePlant(plantId: string, { prevBedId, bedId }: any, data: DataList) {
  addRecord({
    eventId: 'transplant',
    plantIds: [plantId],
    payload: {
      prevBedId,
      bedId,
    },
  }, data)
}
export function removePlant(plantId: string, { bedId }: any, data: DataList) {
  addRecord({
    eventId: 'cull',
    plantIds: [plantId],
    payload: {
      bedId,
    },
  }, data)
}
