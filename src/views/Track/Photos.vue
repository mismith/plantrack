<script setup lang="ts">
import { computed, watch } from 'vue';

import VPButton from '../../components/Button.vue'
import AttachmentLink from '../../components/AttachmentLink.vue'
import { groupedEntries, loadMoreEntries, hasLoadedAllEntries, isLoading } from '../../services/entries'

const groupedEntriesWithPhotos = computed(() => {
  return groupedEntries.value?.filter(({ entries }) => entries[0].attachments)
})
</script>

<template>
  <div class="d-flex flex-wrap flex-justify-around p-2">
    <template
      v-for="{ entries } in groupedEntriesWithPhotos"
    >
      <div
        v-for="attachment in entries[0].attachments"
        :key="attachment.id"
        class="d-inline-flex flex-justify-center flex-items-center p-1"
        style="max-width: min(200px, 25%);"
      >
        <AttachmentLink
          :attachment="attachment"
          preview
          class="width-full"
        />
      </div>
    </template>
  </div>
  <footer class="d-flex flex-justify-center">
    <VPButton
      v-if="!hasLoadedAllEntries"
      :loading="isLoading"
      :disabled="isLoading"
      v-infinite-scroll="loadMoreEntries"
      :infinite-scroll-distance="200"
      @click="loadMoreEntries()"
    >
      Load More
    </VPButton>
  </footer>
</template>
