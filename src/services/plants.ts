
export function addRecord(record: any, data: any) {
  data.records.push({
    id: `record-${Math.random().toString().slice(2)}`,
    at: new Date().toISOString(),
    ...record,
  })
}

export function getPlantsInBed(bedId: string, data: any) {
  const bedRecords = data.records.filter(
    (record: any) => record.payload?.bedId === bedId || record.payload?.oldBedId === bedId
  )
  const plantMap = bedRecords.reduce((acc: any, record: any) => {
    switch (record.eventId) {
      case 'seed': {
        acc[record.payload.plantId] = true
        break
      }
      case 'transplant': {
        acc[record.payload.plantId] = record.payload.bedId === bedId
        break
      }
      case 'cull': {
        acc[record.payload.plantId] = false
        break
      }
      default: {
        break
      }
    }
    return acc;
  }, {})
  const plantIds = Object.entries(plantMap).filter(([, v]) => v).map(([k]) => k)
  const plants = data.plants.filter(({ id }: any) => plantIds.includes(id))
  return plants
}

export function addPlant({ bedId, cropId }: any, data: any) {
  const id = `plant-${Math.random().toString().slice(2)}`
  data.plants.push({
    id,
    cropId,
  })
  addRecord({
    eventId: 'seed',
    payload: {
      bedId,
      plantId: id,
    },
  }, data)
}
export function movePlant({ oldBedId, bedId, plantId }: any, data: any) {
  addRecord({
    eventId: 'transplant',
    payload: {
      oldBedId,
      bedId,
      plantId,
    },
  }, data)
}
export function removePlant({ bedId, plantId }: any, data: any) {
  addRecord({
    eventId: 'cull',
    payload: {
      bedId,
      plantId,
    },
  }, data)
}
