import { differenceInDays, format } from 'date-fns'
import { computed } from 'vue'
import { database, toKeyFieldArray, useRtdbArray } from './firebase'

export interface Entity {
  id: string
  name?: string
  createdAt: number
}
export interface Crop extends Entity {
}
export interface Entry extends Entity {
  eventId: string
  at: number
  payload?: Record<string, any>
  note?: string
}
export interface Plant extends Entity {
  cropId: string
  bedId: string
  entries?: Record<string, Entry>
}
export interface Bed extends Entity {
  plotId: string
}
export interface Plot extends Entity {
}

export const events = [
  {
    id: 'custom',
    color: '',
  },
  {
    id: 'seed',
    color: 'rgb(255, 234, 116)',
  },
  {
    id: 'sprout',
    color: 'rgb(200, 255, 0)',
  },
  {
    id: 'leaf',
    color: '',
  },
  {
    id: 'flower',
    color: '',
  },
  {
    id: 'fruit',
    color: '',
  },
  {
    id: 'transplant',
    color: 'rgb(167, 255, 255)',
  },
  {
    id: 'water',
    color: '',
  },
  {
    id: 'feed',
    color: '',
  },
  {
    id: 'nutrient',
    color: '',
  },
  {
    id: 'flush',
    color: '',
  },
  {
    id: 'clean',
    color: '',
  },
  {
    id: 'prune',
    color: '',
  },
  {
    id: 'harvest',
    color: 'rgb(0, 200, 0)',
  },
  {
    id: 'cull',
    color: 'red',
  },
]

export function usePlantDataTree() {
  const plants = useRtdbArray<Plant>(database.ref('/users/mismith/plants'))
  const beds = useRtdbArray<Bed>(database.ref('/users/mismith/beds'))
  const plots = useRtdbArray<Plot>(database.ref('/users/mismith/plots'))

  const nodes = computed(() => [...plots.value || [], {
    id: 'system',
    name: 'System',
    createdAt: Date.now(),
  }].map((plot) => ({
    type: 'plot',
    children: [...beds.value || [], {
      id: 'culled',
      name: 'Culled',
      plotId: 'system',
    }].filter(({ plotId }) => plotId === plot.id).map((bed) => ({
      type: 'bed',
      children: plants.value?.filter(({ bedId }) => (!bedId && bed.id === 'culled') || bedId === bed.id).map((plant) => ({
        type: 'plant',
        children: toKeyFieldArray<Entry>(plant.entries || {}).map((entry) => ({
          type: 'entry',
          ...entry,
        })).sort((a, b) => a.at - b.at),
        ...plant,
      })) || [],
      ...bed,
    })) || [],
    ...plot,
  })) || [])

  return {
    plants,
    beds,
    plots,
    nodes,
  }
}

export function formatAtAsDate(at: number) {
  const date = new Date(at);
  return format(date, 'yyyy-MM-dd HH:mma');
}
export function entryToString(node: Entry, { beds, relativeDate }: { beds: Bed[], relativeDate?: Date }) {
  const relativeDays = relativeDate && differenceInDays(new Date(node.at), relativeDate)
  return [
    node.eventId,
    node.eventId === 'transplant'
      && node.payload?.oldBedId
      && `from "${beds?.find(({ id }) => id === node.payload?.oldBedId)?.name}"`,
    node.eventId === 'harvest'
      && node.payload?.weight
      && `[${node.payload.weight.value}${node.payload.weight.unit}]`,
    node.note && `(${node.note})`,
    `@ ${formatAtAsDate(node.at)}`,
    relativeDays && `(+${relativeDays} day${relativeDays === 1 ? '' : 's'})`,
  ].filter(Boolean).join(' ')
}
