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
  node?: string
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
  { id: 'seed' },
  { id: 'sprout' },
  { id: 'leaf' },
  { id: 'flower' },
  { id: 'fruit' },
  { id: 'transplant' },
  { id: 'water' },
  { id: 'feed' },
  { id: 'prune' },
  { id: 'harvest' },
  { id: 'cull' },
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