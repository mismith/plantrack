<script setup lang="ts">
import { ref, toRefs, watch } from 'vue'

import { useAsyncWrapper } from '../services/errors';
import Spinner from './Spinner.vue';
import Octicon from './Octicon.vue';

const props = defineProps<{
  file: File
}>()
const { file } = toRefs(props)

const [runAsync, isLoading] = useAsyncWrapper()

const src = ref<string>()
watch(file, (v) => {
  if (v.type.startsWith('image/')) {
    runAsync(async () => {
      src.value = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          const src = event.target?.result as string
          const img = document.createElement('img')
          img.onload = () => resolve(src)
          img.onerror = reject
          img.src = src
        }
        reader.onerror = reject
        reader.readAsDataURL(file.value)
      })
    })
  }
}, { immediate: true })
</script>

<template>
  <slot v-if="isLoading" name="loading" v-bind="{ file, src }">
    <Spinner v-bind="$attrs" />
  </slot>
  <slot v-else-if="src" v-bind="{ file, src }">
    <img :src="src" :alt="file.name" style="vertical-align: middle;" v-bind="$attrs" />
  </slot>
  <slot v-else name="fallback" v-bind="{ file, src }">
    <Octicon name="file" v-bind="$attrs" />
  </slot>
</template>
