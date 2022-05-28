import { computed, ref, watch } from 'vue'

import { Entry, events } from './data'
import { database, getUserRefPath, useRtdbArray } from './firebase'

const ENTRIES_PAGE_COUNT = 36
const numEntries = ref(ENTRIES_PAGE_COUNT)
export const hasLoadedAllEntries = ref(false)
const entriesQuery = computed(() => database.ref(getUserRefPath('/_entries')).orderByChild('at').limitToLast(numEntries.value))
const [_entries, isLoading] = useRtdbArray<Entry>(entriesQuery, (entry) => ({
  ...entry,
  _event: events?.find(({ id }) => id === entry.eventId),
}))
export { isLoading }
watch(_entries, (v) => {
  if (v?.length && v.length < numEntries.value) {
    hasLoadedAllEntries.value = true
  }
}, { immediate: true })
// const loadMoreRef = ref<HTMLElement>()
export function loadMoreEntries() {
  // const previousLastEntry = loadMoreRef.value?.previousElementSibling
  numEntries.value += ENTRIES_PAGE_COUNT
  // setTimeout(() => {
  //   previousLastEntry?.nextElementSibling?.scrollIntoView({
  //     behavior: 'smooth',
  //     block: 'start',
  //   })
  // }, 300)
}

export const groupedEntries = computed(() => {
  return _entries.value
    ?.sort((a, b) => b.at - a.at)
    .reduce((acc, entry) => {
      if (acc.length && entry.batchId && entry.batchId === acc[acc.length - 1]?.entries[0]?.batchId) {
        acc[acc.length - 1].entries.push(entry)
      } else {
        acc.push({
          id: entry.batchId || entry.id,
          entries: [entry],
        })
      }
      return acc
    }, [] as { id: string, entries: Entry[] }[])
})
watch(groupedEntries, (v) => {
  if (v?.[v?.length - 1]?.entries[0]?.batchId && !hasLoadedAllEntries.value) {
    // keep loading entries until the current batch is fully loaded
    numEntries.value += 1
  }
})
