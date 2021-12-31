import { computed, inject, reactive, Ref, watch } from 'vue'
import { differenceInDays, format } from 'date-fns'

import { Booleanable } from '../components/TreeView'
import firebase, { database, toKeyFieldArray, useRtdbArray } from './firebase'

export type Timestamp = number
export interface Entity {
  id: string
  createdAt: Timestamp
}
export type OptionalToNullable<O> = {
  [K in keyof O]-?: undefined extends O[K]
    ? NonNullable<O[K]> | null
    : (
      Timestamp extends O[K]
        ? typeof firebase.database.ServerValue.TIMESTAMP
        : O[K]
    )
}
export type NewEntity<T> = (Omit<T, 'id' | 'createdAt'> | Omit<OptionalToNullable<T>, 'id' | 'createdAt'>) & {
  createdAt: typeof firebase.database.ServerValue.TIMESTAMP
}

export interface Attachment {
  name: string
  size: number
  type: string
  url: string
  at: Timestamp
}
export interface Crop extends Entity {
  name: string
  nickname?: string
  daysToHarvest?: number | string
  germinationPercentage?: number
  cost?: number
  numSeeds?: number
}
export interface Entry extends Entity {
  eventId: string
  at: Timestamp
  payload?: Record<string, any>
  attachments?: Attachment[]
  note?: string
}
export interface Plant extends Entity {
  name: string
  cropId: string
  bedId: string
  entries?: Record<string, Entry>
}
export interface Bed extends Entity {
  name: string
  plotId: string
  x?: number
  y?: number
  width?: number
  height?: number
}
export interface Plot extends Entity {
  name: string
}

export interface Event {
  id: string
  color: string
  featured?: boolean
}
export const events: Event[] = [
  {
    id: 'seed',
    color: 'yellow',
    featured: true,
  },
  {
    id: 'sprout',
    color: 'greenyellow',
    featured: true,
  },
  {
    id: 'leaf',
    color: 'lime',
  },
  {
    id: 'flower',
    color: 'forestgreen',
  },
  {
    id: 'fruit',
    color: 'purple',
  },
  {
    id: 'transplant',
    color: 'lightgrey',
    featured: true,
  },
  {
    id: 'splice',
    color: 'grey',
  },
  {
    id: 'water',
    color: 'cyan',
  },
  {
    id: 'feed',
    color: 'blue',
  },
  {
    id: 'prune',
    color: 'pink',
  },
  {
    id: 'harvest',
    color: 'magenta',
    featured: true,
  },
  {
    id: 'cull',
    color: 'red',
    featured: true,
  },
  {
    id: 'other',
    color: '',
  },
]

export const usePlots = () => useRtdbArray<Plot>(database.ref('/users/mismith/plots'))
export const useBeds = () => useRtdbArray<Bed>(database.ref('/users/mismith/beds'))
export const usePlants = () => useRtdbArray<Plant>(database.ref('/users/mismith/plants'))
export const useCrops = () => {
  const raw = useRtdbArray<Crop>(database.ref('/users/mismith/crops'))
  return computed(() => raw.value?.sort((a, b) => a.name.localeCompare(b.name)))
}

export const INACTIVE = 'inactive'
export function usePlantDataTree() {
  const plants = usePlants()
  const beds = useBeds()
  const plots = usePlots()

  const nodes = computed(() => [...plots.value || [], {
    id: 'system',
    name: 'System',
    createdAt: Date.now(),
  }].map((plot) => ({
    type: 'plot',
    children: [...beds.value || [], {
      id: INACTIVE,
      name: 'Inactive',
      plotId: 'system',
    }].filter(({ plotId }) => plotId === plot.id).map((bed) => ({
      type: 'bed',
      children: (plants.value?.filter(({ bedId }) => (!bedId && bed.id === INACTIVE) || bedId === bed.id).map((plant) => ({
        type: 'plant',
        children: toKeyFieldArray<Entry>(plant.entries || {}).map((entry) => ({
          type: 'entry',
          ...entry,
        })).sort((a, b) => a.at - b.at),
        ...plant,
      })) || []).sort(
        bed.id === INACTIVE
          ? (a, b) => (a.children[a.children.length - 1]?.at || 0) - (b.children[b.children.length - 1]?.at || 0)
          : () => 0,
      ),
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
  const date = new Date(at)
  return format(date, 'yyyy-MM-dd h:mma')
}
export function entryToString(node: Entry, { beds, plants, relativeDate }: { beds: Bed[], plants: Plant[], relativeDate?: Date }) {
  const relativeDays = relativeDate && differenceInDays(new Date(node.at), relativeDate)
  return [
    node.eventId,
    (node.eventId === 'transplant' || node.eventId === 'splice')
      && node.payload?.oldBedId
      && `from "${beds?.find(({ id }) => id === node.payload?.oldBedId)?.name}"`,
    (node.eventId === 'transplant' || node.eventId === 'splice')
      && node.payload?.newBedId
      && `to "${beds?.find(({ id }) => id === node.payload?.newBedId)?.name}"`,
    node.eventId === 'splice'
      && node.payload?.newPlantId
      && `as "${plants?.find(({ id }) => id === node.payload?.newPlantId)?.name}"`,
    node.eventId === 'harvest'
      && node.payload?.weight
      && `[${node.payload.weight.value}${node.payload.weight.unit}]`,
    node.note && `(${node.note})`,
    `@ ${formatAtAsDate(node.at)}`,
    relativeDays && `(+${relativeDays} day${relativeDays === 1 ? '' : 's'})`,
  ].filter(Boolean).join(' ')
}

export function getSuggestedPlantName(cropId?: string, crops?: Crop[], plants?: Plant[]) {
  const crop = crops?.find((crop) => crop.id === cropId)
  const cropPlants = plants?.filter((plant) => plant.cropId === cropId)
  return `${crop?.name || 'Plant'}.${(cropPlants?.length || 0) + 1}`
}

export function useTreeViewPicker(
  ref: Ref,
  config: { selectable?: Booleanable, checkable?: Booleanable } = { selectable: true },
  predicate: (value: any, index: number, obj: any[]) => unknown = Boolean,
) {
  const state = reactive({
    expanded: [],
    hovered: [],
    selected: [] as any[],
    checked: [] as any[],
  })
  const options = reactive({
    indentable: true,
    expandable: true,
    hoverable: !inject('isTouchDevice'),
    ...config,
  })
  watch(ref, () => {
    if (config.checkable) {
      state.checked = [...ref.value]
    } else {
      state.selected = [ref.value]
    }
  }, { immediate: true })

  function change(changes: Record<string, any>) {
    Object.assign(state, changes)

    if (changes.selected) {
      ref.value = state.selected.find(predicate)
    }
    if (changes.checked) {
      ref.value = state.checked.filter(predicate)
    }
  }
  return {
    bind: {
      state,
      options,
    },
    on: {
      change,
    },
  }
}
