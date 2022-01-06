<template>
  <button v-bind="$attrs" class="Button btn">
    <div class="Button-content" :style="{ opacity: loading ? 0 : undefined }">
      <slot />
    </div>
    <div v-if="loading" class="Button-spinner">
      <Spinner />
    </div>
  </button>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import Spinner from './Spinner.vue'

export default defineComponent({
  name: 'Button',
  components: {
    Spinner,
  },
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
  },
})
</script>

<style lang="scss">
.Button {
  position: relative;

  .Button-spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    inset: 0;
  }
}
</style>