<template>
  <span
    class="Blip"
    :style="{ backgroundColor: color || 'currentColor', width: size, height: size }"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Blip',
  props: {
    color: {
      type: String,
      required: false,
    },
    size: {
      type: [Number, String],
      default: '0.75rem',
    },
  },
})
</script>

<style lang="scss">
.Blip {
  display: inline-block;
  vertical-align: middle;
  border: solid 1px currentColor;
  border-radius: 1em;
  flex-shrink: 0;
}
</style>
