<script setup lang="ts">
import { PropType } from 'vue'
import { differenceInDays } from 'date-fns'

import { Entry, formatAtAsDate } from '../services/data'
import Blip from './Blip.vue'
import Tag from './Tag.vue'
import AttachmentLink from './AttachmentLink.vue'
import MultiCrumb from './MultiCrumb.vue'

defineProps({
  entries: {
    type: Array as PropType<Entry[]>,
    required: true,
  },
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
function getTotalWeight(entries: Entry[]) {
  const total = entries.reduce((sum, entry) => sum + Number(entry.payload?.weight?.value || 0), 0)
  const unit = entries[0].payload?.weight?.unit
  return `${Number.isInteger(total) ? total : total.toFixed(3).replace(/0$/g, '')}${unit}`
}
</script>

<template>
  <div
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
      
      <span class="mr-2">
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
      </span>

      <span v-if="entries[0]?.payload?.weight" class="branch-name tooltipped tooltipped-s tooltipped-no-delay mr-2" aria-label="Total harvest">
        {{ getTotalWeight(entries) }}
      </span>

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
        <blockquote class="color-fg-default" style="white-space: pre-line;">
          {{ entries[0].note }}
        </blockquote>
      </div>
      <figure v-if="entries[0].attachments" class="d-flex flex-justify-start my-2 overflow-auto">
        <AttachmentLink
          v-for="attachment in entries[0].attachments"
          :key="attachment.id"
          :attachment="attachment"
          preview
          style="background-color: var(--color-border-muted); border: solid 8px var(--color-border-muted); border-radius: 4px;"
        />
        <div v-if="entries[0].attachments.length > 1" class="pr-3" />
      </figure>
      <div v-if="entries[0].tagIds" class="my-2">
        <Tag
          v-for="tagId in entries[0].tagIds"
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
</template>

<style scoped lang="scss">
figure {
  position: relative;
  width: calc(100vw - 1px);
  left: calc(50% - 12px);
  padding-left: 40px;
  margin-left: -50vw;
  gap: 8px;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (min-width: 768px) {
    padding-left: calc(50vw - 50% + 8px);
  }
}
</style>
