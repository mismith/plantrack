import { differenceInMilliseconds, differenceInDays } from 'date-fns'

import { events, Plant } from '../services/data'

export function getStatsForPlants(plants: Plant[]) {
  const stats = plants.reduce((acc, plant) => {
    const plantEntries = Object.values(plant.entries || {})
    const seedEntry = plantEntries.find(entry => entry.eventId === 'seed')
    const startDate = new Date(seedEntry?.at || plant.createdAt)

    plantEntries.forEach((entry) => {
      if (entry.eventId === 'seed') return;

      const sinceSeed = Math.max(0, differenceInMilliseconds(new Date(entry.at), startDate))

      acc[entry.eventId] = acc[entry.eventId] || {}
      acc[entry.eventId].records = (acc[entry.eventId].records || []).concat({
        plant,
        entry,
        sinceSeed,
      })
    })

    return acc
  }, {} as Record<string, any>)

  Object.keys(stats).forEach((eventId) => {
    const stat = stats[eventId]
    stat.sum = stat.records.reduce((acc: number, { sinceSeed }: any) => acc + sinceSeed, 0)
    stat.avg = stat.sum / stat.records.length
    stat.std = Math.sqrt(
      stat.records
        .map((record: any) => Math.pow(record.sinceSeed - stat.avg, 2))
        .reduce((a: number, b: number) => a + b)
      / stat.records.length
    )
  })

  return stats
}

export function getStatsStringForPlants(plants: Plant[]) {
  return Object.entries(getStatsForPlants(plants))
    .sort((a, b) => events.findIndex(e => e.id === a[0]) - events.findIndex(e => e.id === b[0]))
    .map(([eventId, stat]) => {
      const days = differenceInDays(new Date(stat.avg), new Date(0))
      const daysStd = differenceInDays(new Date(stat.std), new Date(0))
      return `${eventId}: ${stat.records.length > 1 ? '~' : ''}${days} day${days === 1 ? '' : 's'} ${stat.records.length > 1 ? `±${daysStd} {${stat.records.length}}` : ''}`
    })
    .join('\n')
}
