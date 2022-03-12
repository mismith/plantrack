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
  <Button v-if="!values.length" class="Label Label--secondary tooltipped tooltipped-s tooltipped-no-delay" aria-label="Something went wrong and the values cannot be found">
    &lt;missing&gt;
  </Button>
  <span v-else-if="values.length === 1" class="color-fg-muted">
    {{ values[0] }}
  </span>
  <Button v-else class="Label tooltipped tooltipped-s tooltipped-no-delay" :aria-label="values.join('\n')">
    {{ values.length }} {{ label }}
  </Button>
</template>
