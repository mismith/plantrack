<script setup lang="ts">
import { computed, h, PropType, toRefs } from 'vue'
import octicons, { IconName, IconSize } from '@primer/octicons'

const props = defineProps({
  name: {
    type: String as PropType<IconName>,
    required: true,
  },
  size: {
    type: Number as PropType<IconSize>,
    default: 16,
    validator(v: number) {
      return [16, 24].includes(v)
    },
  },
})

const { name, size } = toRefs(props)
const octicon = computed(() => octicons[name.value])

const render = () => h('svg', {
  ...octicon.value?.heights?.[size.value]?.options,
  innerHTML: octicon.value?.heights?.[size.value]?.path,
})
</script>

<template>
  <render />
</template>
