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
import { defineComponent, onBeforeUnmount, ref, toRefs, watch } from 'vue'

import Octicon from './Octicon.vue'

const stack = ref<string[]>([])

export default defineComponent({
  name: 'Dialog',
  components: {
    Octicon,
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const { modelValue } = toRefs(props)

    const close = () => emit('update:modelValue', false)

    const id = `${Date.now()}${Math.random()}`
    function handleEsc({ key }: KeyboardEvent) {
      if (key === 'Escape' && stack.value[stack.value.length - 1] === id) {
        close()
      }
    }
    watch(modelValue, (isOpen) => {
      if (isOpen) {
        stack.value.push(id)
        document.addEventListener('keydown', handleEsc)
      } else {
        stack.value.pop()
        document.removeEventListener('keydown', handleEsc)
      }
    }, { immediate: true })
    onBeforeUnmount(() => {
      document.removeEventListener('keydown', handleEsc)
    })

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
  z-index: 100;

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