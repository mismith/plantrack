<script setup lang="ts">
import VPButton from '../../components/Button.vue'
import Octicon from '../../components/Octicon.vue'
import EntriesTimelineItem from '../../components/EntriesTimelineItem.vue'

import { groupedEntries, loadMoreEntries, hasLoadedAllEntries, isLoading } from '../../services/entries';
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
