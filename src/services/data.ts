import { computed, reactive, ref, Ref, watch } from 'vue'
import { differenceInDays, format } from 'date-fns'

import { Booleanable, ITreeNode } from '../components/TreeView'
import firebase, { database, getUserRefPath, keyField, toKeyFieldArray, useRtdbArray } from './firebase'

export type Timestamp = number
export interface Entity {
  id: string
  createdAt: Timestamp
  updatedAt?: Timestamp
}
export type OptionalToNullable<O> = {
  [K in keyof O]-?: undefined extends O[K]
    ? NonNullable<O[K]> | null | undefined
    : (
      Timestamp extends O[K]
        ? typeof firebase.database.ServerValue.TIMESTAMP
        : O[K]
    )
}
export type NewEntity<T> = Omit<OptionalToNullable<T>, keyof Entity> & {
  createdAt: typeof firebase.database.ServerValue.TIMESTAMP
}
export type UpdatedEntity<T> = Omit<OptionalToNullable<T>, keyof Entity> & {
  updatedAt: typeof firebase.database.ServerValue.TIMESTAMP
}

export interface Attachment {
  id: string
  name: string
  size: number
  type: string
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

export interface EntryPayload {
  oldBedId?: string
  _oldBed?: Bed
  newBedId?: string
  _newBed?: Bed
  oldPlantId?: string
  _oldPlant?: Plant
  newPlantId?: string
  _newPlant?: Plant
  weight?: {
    value: number
    unit: string
  }
}
export interface Entry extends Entity {
  _plantId?: string
  _plant?: Plant
  batchId?: string
  eventId: string
  _event?: Event
  at: Timestamp
  payload?: EntryPayload
  note?: string
  attachments?: Attachment[]
  tagIds?: string[]
  _tags?: Tag[]
}
export interface Plant extends Entity {
  name: string
  cropId: string
  _crop?: Crop
  bedId: string
  _bed?: Bed
  entries?: Record<string, Entry>
}
export interface Bed extends Entity {
  name: string
  plotId: string
  _plot?: Plot
  x?: number
  y?: number
  width?: number
  height?: number
}
export interface Plot extends Entity {
  name: string
  parentPlotId?: string
  _parentPlot?: Plot
}
export interface Tag extends Entity {
  name: string
  color?: string
}

export interface Event {
  id: string
  color: string
}
export const events: Event[] = [
  {
    id: 'seed',
    color: 'gold',
  },
  {
    id: 'sprout',
    color: 'lime',
  },
  {
    id: 'leaf',
    color: 'forestgreen',
  },
  {
    id: 'flower',
    color: 'darkorange',
  },
  {
    id: 'fruit',
    color: 'purple',
  },
  {
    id: 'transplant',
    color: 'lightgrey',
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
  },
  {
    id: 'cull',
    color: 'red',
  },
  {
    id: 'other',
    color: '',
  },
]

export const useTags = () => useRtdbArray<Tag>(database.ref(getUserRefPath('/tags')))
export const usePlots = () => useRtdbArray<Plot>(database.ref(getUserRefPath('/plots')))
export const useBeds = () => useRtdbArray<Bed>(database.ref(getUserRefPath('/beds')))
export const usePlants = () => useRtdbArray<Plant>(database.ref(getUserRefPath('/plants')))
export const useCrops = () => {
  const [raw, ...args] = useRtdbArray<Crop>(database.ref(getUserRefPath('/crops')))
  const sorted = computed(() => raw.value?.sort((a, b) => a.name.localeCompare(b.name)))
  return [sorted, ...args] as [typeof sorted, ...typeof args]
}

export function arrayToNested<T extends { [k: string]: any }>(
  dataset: T[],
  { idKey = 'id', parentKey = 'parentId', childrenKey = 'children' } = {},
) {
  const hashTable = Object.create(null)
  dataset.forEach(datum => {
    hashTable[datum[idKey]] = { [childrenKey]: [...datum[childrenKey]], ...datum }
  })

  const tree: T[] = []
  dataset.forEach(datum => {
    if(datum[parentKey] && hashTable[datum[parentKey]]) {
      hashTable[datum[parentKey]][childrenKey].push(hashTable[datum[idKey]])
    } else {
      tree.push(hashTable[datum[idKey]])
    }
  })
  return tree
}

export function usePlantDataTree({ filter = Boolean }: { filter?(node: ITreeNode): boolean } = {}) {
  const [plants] = usePlants()
  const [beds] = useBeds()
  const [plots] = usePlots()

  const nodes = computed(() => ([...plots.value || []].map((plot) => ({
    type: 'plot',
    children: ([...beds.value || []].filter(({ plotId }) => plotId === plot.id).map((bed) => ({
      type: 'bed',
      children: (plants.value?.filter(({ bedId }) => bedId === bed.id).map((plant) => ({
        type: 'plant',
        children: toKeyFieldArray<Entry>(plant.entries || {}).map((entry) => ({
          type: 'entry',
          ...entry,
        })).filter(filter).sort((a, b) => a.at - b.at),
        ...plant,
      })) || []).filter(filter),
      ...bed,
    })) || []).filter(filter),
    ...plot,
  })) || []).filter(filter))

  return {
    plants,
    beds,
    plots,
    nodes: computed(() => arrayToNested(nodes.value, { idKey: keyField, parentKey: 'parentPlotId' })),
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

export function useTreeViewProps(
  ref: Ref,
  handleChange: (v: any) => any = (v) => (ref.value = v),
  config: { selectable?: Booleanable, checkable?: Booleanable } = { selectable: true },
  predicate: (value: any, index: number, obj: any[]) => unknown = Boolean,
) {
  const state = reactive<Record<string, any>>({
    expanded: [],
    selected: [],
    checked: [],
  })
  const options = reactive<Record<string, any>>({
    indentable: true,
    expandable: true,
    ...config,
  })
  watch(ref, () => {
    if (config.checkable) {
      state.checked = [...ref.value]
    } else {
      state.selected = [ref.value]
    }
  }, { immediate: true })

  function onChange(changes: Record<string, any>) {
    Object.assign(state, changes)
    
    if (changes.selected) {
      handleChange(state.selected.find(predicate))
    }
    if (changes.checked) {
      handleChange(state.checked.filter(predicate))
    }
  }

  return {
    state,
    options,
    onChange,
  }
}

export const memoryStorage = {
  store: {} as Record<string, string>,
  getItem(path: string) {
    return memoryStorage.store[path] || ''
  },
  setItem(path: string, value: string) {
    memoryStorage.store[path] = value
  },
}
export type StorageType = typeof memoryStorage | typeof window.localStorage | typeof window.sessionStorage
export const persistance = {
  get(path: string, defaultValue?: any, storageType: StorageType = window.localStorage) {
    const loadedValue = (() => {
      try {
        return JSON.parse(storageType.getItem(path)!)
      } catch (error) {
        console.error(error)
        return undefined
      }
    })()
    return loadedValue || defaultValue
  },
  set(path: string, value: any, storageType: StorageType = window.localStorage) {
    storageType.setItem(path, JSON.stringify(value))
  },
}
export function usePersistentRef<T extends unknown>(key: string, defaultValue?: T, storageType?: StorageType) {
  const path = `plantrack.persistentRef.${key}`
  
  const value = ref<T>(persistance.get(path, defaultValue, storageType))
  watch(value, (v) => persistance.set(path, v, storageType))
  return value
}
export function useRestoreKey(key: string, prefix: string) {
  const path = `plantrack.restoreKey.${prefix}.${key}`
  return {
    load() {
      return persistance.get(path)
    },
    save(value: any) {
      persistance.set(path, value)
    },
  }
}
