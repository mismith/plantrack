<script setup lang="ts">
import { computed } from 'vue'
import { differenceInDays } from 'date-fns'

import { Entry, events, formatAtAsDate } from '../services/data'
import { useHydratedEntries } from '../services/exporter'
import Button from '../components/Button.vue'
import Blip from '../components/Blip.vue'
import Tag from '../components/Tag.vue'
import AttachmentLink from '../components/AttachmentLink.vue'

const { entries: entriesRaw, beds, plots } = useHydratedEntries()
const entries = computed(() => {
  return entriesRaw.value
    ?.sort((a, b) => b.at - a.at)
    .slice(0, 100)
    .map((entry) => {
      return {
        ...entry,
        $event: events?.find(({ id }) => id === entry.eventId),
      }
    })
})
const groupedEntries = computed(() => {
  return entries.value
    ?.reduce((acc, entry) => {
      if (acc.length && entry.batchId && entry.batchId === acc[acc.length - 1]?.[0]?.batchId) {
        acc[acc.length - 1].push(entry)
      } else {
        acc.push([entry])
      }
      return acc
    }, [] as Entry[][])
})

function getPlotNames(entries: any[]) {
  const plotNames = entries.map((entry) => entry.$plant?.$bed?.$plot?.name || entry.$plant?.$bed?.plotId)
  return plotNames.filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).reverse()
}
function getBedNames(entries: any[]) {
  const plotNames = entries.map((entry) => entry.$plant?.$bed?.name || entry.$plant?.$bedId)
  return plotNames.filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).reverse()
}
function getRelativeDays(at: number) {
  const date = new Date(at)
  const relativeDays = Math.abs(differenceInDays(date, new Date()))
  if (!relativeDays) return 'Today'
  return `${relativeDays} day${relativeDays === 1 ? '' : 's'} ago`
}
</script>

<template>
  <div class="Timeline pl-1 pr-3 pl-md-3 pr-md-4">
    <div
      v-for="(entries, index) in groupedEntries"
      :key="index"
      class="TimelineItem pt-4"
      :class="{ 'TimelineItem--condensed': entries.length <= 1 }"
    >
      <div
        class="TimelineItem-badge"
        :style="{ boxShadow: entries.length <= 1 ? undefined : `inset 0 0 0 2px ${entries[0].$event?.color}` }"
      >
        <Blip v-if="entries.length <= 1" :color="entries[0].$event?.color" />
        <span v-else :style="{ color: entries[0].$event?.color }">{{ entries.length }}</span>
      </div>

      <div class="TimelineItem-body color-fg-default">
        <strong class="mr-1">{{ entries[0].eventId }}</strong>

        <!-- {{ plots?.[beds?.[entries[0].payload?.oldBedId]?.plotId]?.name }}
        {{ beds?.[entries[0].payload?.oldBedId]?.name }} -->
        
        <span v-if="getPlotNames(entries).length <= 1" class="color-fg-muted">
          {{ getPlotNames(entries)[0] }}
        </span>
        <Button v-else class="Label Label--secondary tooltipped tooltipped-s tooltipped-no-delay" :aria-label="getPlotNames(entries).join('\n')">
          {{ getPlotNames(entries).length }} plots
        </Button>
        /
        <span v-if="getBedNames(entries).length <= 1" class="color-fg-muted">
          {{ getBedNames(entries)[0] }}
        </span>
        <Button v-else class="Label Label--secondary tooltipped tooltipped-s tooltipped-no-delay" :aria-label="getBedNames(entries).join('\n')">
          {{ getBedNames(entries).length }} beds
        </Button>

        <ul class="color-fg-muted my-2" style="padding-left: 0.85em;">
          <li v-for="entry in entries" :key="entry.id">
            {{ entry.$plant?.name }}: {{ entry.$plant?.$crop?.nickname }}
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
  </div>
</template>
