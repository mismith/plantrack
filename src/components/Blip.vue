<template>
  <span class="Blip" :style="{ backgroundColor: color || 'currentColor' }" />
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
  },
})
</script>

<style lang="scss">
.Blip {
  display: inline-block;
  width: 0.75rem;
  height: 0.75rem;
  vertical-align: middle;
  border: solid 1px currentColor;
  border-radius: 1em;
  flex-shrink: 0;
}
</style>