<script setup lang="ts">
import Button from './Button.vue'

defineProps({
  values: {
    type: Array,
    required: true,
  },
  label: {
    type: String,
    default: 'items',
  },
})
</script>

<template>
  <span v-if="values.length <= 1" class="color-fg-muted">
    {{ values[0] }}
  </span>
  <Button v-else class="Label Label--secondary tooltipped tooltipped-s tooltipped-no-delay" :aria-label="values.join('\n')">
    {{ values.length }} {{ label }}
  </Button>
</template>
