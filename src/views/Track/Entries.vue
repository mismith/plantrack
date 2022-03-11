<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { differenceInDays } from 'date-fns'

import { Entry, events, formatAtAsDate } from '../../services/data'
import { database, getUserRefPath, useRtdbArray } from '../../services/firebase'
import VPButton from '../../components/Button.vue'
import Blip from '../../components/Blip.vue'
import Tag from '../../components/Tag.vue'
import AttachmentLink from '../../components/AttachmentLink.vue'
import MultiCrumb from '../../components/MultiCrumb.vue'
import Octicon from '../../components/Octicon.vue'

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
      if (acc.length && entry.batchId && entry.batchId === acc[acc.length - 1]?.[0]?.batchId) {
        acc[acc.length - 1].push(entry)
      } else {
        acc.push([entry])
      }
      return acc
    }, [] as Entry[][])
})
watch(groupedEntries, (v) => {
  if (v?.[v?.length - 1]?.[0]?.batchId && !hasLoadedAllEntries.value) {
    // keep loading entries until the current batch is fully loaded
    numEntries.value += 1
  }
})

function getAggregated(entries: Entry[], getter: (entry: Entry) => any = Boolean) {
  const aggregated = entries.map(getter)
  return aggregated.filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a.localeCompare(b))
}
function getRelativeDays(at: number) {
  const date = new Date(at)
  const relativeDays = Math.abs(differenceInDays(date, new Date()))
  if (!relativeDays) return 'Today'
  return `${relativeDays} day${relativeDays === 1 ? '' : 's'} ago`
}
</script>

<template>
  <div class="Timeline container-md width-full pl-1 pr-1">
    <div
      v-for="(entries, index) in groupedEntries"
      :key="index"
      class="TimelineItem pt-3 pb-2 pr-3"
      :class="{ 'TimelineItem--condensed': entries.length <= 1 }"
    >
      <a
        :href="`#${entries[0].id}`"
        class="TimelineItem-badge"
        :style="{ boxShadow: entries.length <= 1 ? undefined : `inset 0 0 0 2px ${entries[0]?._event?.color}` }"
      >
        <Blip v-if="entries.length <= 1" :color="entries[0]?._event?.color" />
        <span v-else :style="{ color: entries[0]?._event?.color }">{{ entries.length }}</span>
      </a>

      <div class="TimelineItem-body color-fg-default">
        <strong class="mr-2">{{ entries[0].eventId }}</strong>
        
        <template v-if="entries[0].payload?._oldBed">
          <MultiCrumb
            :values="getAggregated(entries, (entry) => [entry.payload?._oldBed?._plot?.name, entry.payload?._oldBed?.name].filter(Boolean).join(' / '))"
            label="beds"
          />
        </template>
        <template v-if="entries[0].payload?._newBed">
          &rarr;
          <MultiCrumb
            :values="getAggregated(entries, (entry) => [entry.payload?._newBed?._plot?.name, entry.payload?._newBed?.name].filter(Boolean).join(' / '))"
            label="beds"
          />
        </template>
        <template v-if="!(entries[0].payload?._oldBed || entries[0].payload?._newBed)">
          <MultiCrumb
            :values="getAggregated(entries, (entry) => [entry._plant?._bed?._plot?.name, entry._plant?._bed?.name].filter(Boolean).join(' / '))"
            label="beds"
          />
        </template>

        <ul class="color-fg-muted my-2" style="padding-left: 12px;">
          <li v-for="entry in entries" :key="entry.id" :id="`entry-${entry.id}`">
            <span v-if="entry.payload?._oldPlant">
              {{ entry.payload?._oldPlant?.name }}: {{ entry.payload?._oldPlant?._crop?.nickname }}
              <span class="color-fg-default">&rarr;</span>
            </span>
            {{ entry._plant?.name }}: {{ entry._plant?._crop?.nickname }}
          </li>
        </ul>

        <div v-if="entries[0].note" class="markdown-body my-2">
          <blockquote class="color-fg-default">
            {{ entries[0].note }}
          </blockquote>
        </div>
        <figure class="mx-0 my-2">
          <AttachmentLink
            v-for="attachment in entries[0].attachments"
            :key="attachment.id"
            :attachment="attachment"
            preview
          />
        </figure>
        <div class="my-2">
          <Tag
            v-for="tagId in entries[0]?.tagIds"
            :key="tagId"
            :tag-id="tagId"
            class="mr-1"
          />
        </div>

        <div class="color-fg-subtle" style="text-align: right;">
          {{ getRelativeDays(entries[0].at) }}
          •
          {{ formatAtAsDate(entries[0].at) }}
        </div>
      </div>
    </div>
    <div v-if="!hasLoadedAllEntries" ref="loadMoreRef" class="TimelineItem py-6">
      <div class="TimelineItem-badge">
        <Octicon name="kebab-horizontal" />
      </div>
      <div class="TimelineItem-body">
        <VPButton
          :loading="isLoading"
          class="mt-n1"
          @click="loadMoreEntries()"
        >
          Load More
        </VPButton>
      </div>
    </div>
    <div v-else class="TimelineItem-break ml-0"></div>
  </div>
</template>
