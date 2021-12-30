import { differenceInMilliseconds, differenceInDays } from 'date-fns'

import { Entry, events, Plant } from '../services/data'

export function getStartDateForPlant(plant: Plant): Date {
  const plantEntries = Object.values(plant.entries || {})
  const seedEntry = plantEntries.find(entry => entry.eventId === 'seed')
  const startDate = new Date(seedEntry?.at || plant.createdAt)
  return startDate;
}
export function getElapsedForEntry(entry: Entry, startDate: Date): number {
  const elapsed = Math.max(0, differenceInMilliseconds(new Date(entry.at), startDate))
  return elapsed
}

export interface StatRecord {
  plant: Plant
  entry: Entry
  elapsed: number
}
export interface Stat {
  records: StatRecord[]
  numRecords: number
  min: number | undefined
  max: number | undefined
  sum: number | undefined
  avg: number | undefined
  std: number | undefined
}
export function getStatsForPlants(plants: Plant[]): Record<string, Stat> {
  const stats = plants.reduce((acc, plant) => {
    const startDate = getStartDateForPlant(plant)

    const plantEntries = Object.values(plant.entries || {})
    plantEntries.forEach((entry) => {
      if (entry.eventId === 'seed') return;

      const elapsed = getElapsedForEntry(entry, startDate)

      acc[entry.eventId] = acc[entry.eventId] || {}
      acc[entry.eventId].records = (acc[entry.eventId].records || []).concat({
        plant,
        entry,
        elapsed,
      })
    })

    return acc
  }, {} as Record<string, Stat>)

  Object.keys(stats).forEach((eventId) => {
    const stat = stats[eventId]
    const records = stat.records.filter(({ elapsed }) => elapsed)
    stat.numRecords = records.length
    stat.min = records.reduce((acc, { elapsed }) => acc ? Math.min(acc, elapsed || 0) : elapsed, undefined as number | undefined)
    stat.max = records.reduce((acc, { elapsed }) => acc ? Math.max(acc, elapsed || 0) : elapsed, undefined as number | undefined)
    stat.sum = records.reduce((acc, { elapsed }) => acc ? acc + elapsed : elapsed, undefined as number | undefined)
    stat.avg = stat.sum && stat.numRecords ? stat.sum / stat.numRecords : undefined
    stat.std = stat.avg && stat.numRecords ? Math.sqrt(
      records
        .map(({ elapsed }) => Math.pow(elapsed - (stat.avg || 0), 2))
        .reduce((a, b) => a + b)
      / stat.numRecords
    ) : undefined
  })

  return stats
}

export function getStatsStringForPlants(plants: Plant[]): string {
  return Object.entries(getStatsForPlants(plants))
    .sort((a, b) => events.findIndex(e => e.id === a[0]) - events.findIndex(e => e.id === b[0]))
    .map(([eventId, stat]) => {
      const days = differenceInDays(new Date(stat.avg || 0), new Date(0))
      const daysStd = differenceInDays(new Date(stat.std || 0), new Date(0))
      return `${eventId}: ${stat.records.length > 1 ? '~' : ''}${days} day${days === 1 ? '' : 's'} ${stat.records.length > 1 ? `±${daysStd} {${stat.records.length}}` : ''}`
    })
    .join('\n')
}

export function getPlantsForCropId(cropId: string, plants: Plant[]): Plant[] {
  const cropPlants = plants?.filter((plant) => plant.cropId === cropId) || []
  return cropPlants
}

export type EventGroups = Record<string, Entry[]>
export function getEventGroupsForPlant(plant: Plant): EventGroups {
  const eventGroups = Object.values(plant.entries || {}).reduce(
    (acc, entry) => {
      acc[entry.eventId] = (acc[entry.eventId] || []).concat(entry)
      return acc
    },
    {} as EventGroups,
  )
  return eventGroups
}
export function getEventGroupsForPlants(plants: Plant[]): EventGroups {
  const eventGroups = plants.reduce(
    (acc, plant) => {
      // const startDate = getStartDateForPlant(plant)
      Object.entries(getEventGroupsForPlant(plant)).forEach(([eventId, entries]) => {
        acc[eventId] = (acc[eventId] || []).concat(entries.map((entry) => {
          // const elapsed = getElapsedForEntry(entry, startDate)
          return {
            ...entry,
            // $elapsed: elapsed,
          }
        }))
      })
      return acc
    },
    {} as EventGroups,
  )
  return eventGroups
}
