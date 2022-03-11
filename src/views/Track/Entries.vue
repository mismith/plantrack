<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { Entry, events } from '../../services/data'
import { database, getUserRefPath, useRtdbArray } from '../../services/firebase'
import VPButton from '../../components/Button.vue'
import Octicon from '../../components/Octicon.vue'
import EntriesTimelineItem from '../../components/EntriesTimelineItem.vue'

const ENTRIES_PAGE_COUNT = 36
const numEntries = ref(ENTRIES_PAGE_COUNT)
const hasLoadedAllEntries = ref(false)
const entriesQuery = computed(() => database.ref(getUserRefPath('/_entries')).orderByChild('at').limitToLast(numEntries.value))
const [_entries, isLoading] = useRtdbArray<Entry>(entriesQuery, (entry) => ({
  ...entry,
  _event: events?.find(({ id }) => id === entry.eventId),
}))
watch(_entries, (v) => {
  if (v?.length && v.length < numEntries.value) {
    hasLoadedAllEntries.value = true
  }
}, { immediate: true })
// const loadMoreRef = ref<HTMLElement>()
function loadMoreEntries() {
  // const previousLastEntry = loadMoreRef.value?.previousElementSibling
  numEntries.value += ENTRIES_PAGE_COUNT
  // setTimeout(() => {
  //   previousLastEntry?.nextElementSibling?.scrollIntoView({
  //     behavior: 'smooth',
  //     block: 'start',
  //   })
  // }, 300)
}

const groupedEntries = computed(() => {
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
</script>

<template>
  <div class="Timeline container-md width-full pl-1 pr-1">
    <EntriesTimelineItem
      v-for="{ id, entries } in groupedEntries"
      :key="id"
      :entries="entries"
    />

    <div v-if="!hasLoadedAllEntries" ref="loadMoreRef" class="TimelineItem py-6">
      <div class="TimelineItem-badge">
        <Octicon name="kebab-horizontal" />
      </div>
      <div class="TimelineItem-body">
        <VPButton
          :loading="isLoading"
          :disabled="isLoading"
          v-infinite-scroll="loadMoreEntries"
          :infinite-scroll-distance="200"
          class="mt-n1"
          @click="loadMoreEntries()"
        >
          Load More
        </VPButton>
      </div>
    </div>
    <div v-else-if="groupedEntries?.length" class="TimelineItem-break ml-0"></div>
  </div>
</template>
