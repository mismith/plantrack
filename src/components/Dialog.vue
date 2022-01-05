<template>
  <div v-if="modelValue" class="Dialog p-3" @click="close">
    <div class="Box Box--overlay anim-scale-in" @click.stop>
      <slot />
      <button class="close-button" @click.prevent.stop="close">
        <Octicon name="x" />
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, toRefs } from 'vue'

import Octicon from './Octicon.vue'

export default defineComponent({
  name: 'Dialog',
  components: {
    Octicon,
  },
  props: {
    modelValue: {
      type: Boolean,
    },
  },
  setup(props, { emit }) {
    const { modelValue } = toRefs(props)

    const close = () => emit('update:modelValue', false)

    return {
      modelValue,
      close,
    }
  },
})
</script>

<style lang="scss" scoped>
.Dialog {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.67);
  z-index: 50;

  > div {
    position: relative;
    max-height: 100%;
    overflow: auto;
  }

  button {
    position: absolute;
    top: 0;
    right: 0;
    width: 36px;
    height: 36px;
  }
}
</style>