<template>
  <div class="Exporter" style="display: flex; flex-direction: column; overflow: hidden;">
    <header style="text-align: center;">
      <button class="btn" @click="handleDownload">Download</button>
    </header>
    <div style="flex: auto; display: flex; overflow: hidden;">
      <pre style="flex: 1; overflow-y: auto;">{{ flatEntries }}</pre>
      <pre style="flex: 1; overflow-y: auto;">{{ entries }}</pre>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { downloadCSVRowsAsFile, useExportableData } from '../services/exporter'

export default defineComponent({
  name: 'Exporter',
  setup() {
    const { entries, flatEntries } = useExportableData()

    async function handleDownload() {
      await downloadCSVRowsAsFile(flatEntries.value)
    }

    return {
      entries,
      flatEntries,
      handleDownload,
    }
  },
})
</script>
