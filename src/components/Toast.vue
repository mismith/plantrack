<template>
  <aside v-if="modelValue" class="ToastContainer position-fixed bottom-0 right-0">
    <div class="Toast position-relative overflow-hidden anim-fade-up" :class="`Toast--${type}`">
      <span class="Toast-icon">
        <Octicon :name="icon" />
      </span>
      <div class="Toast-content">
        <slot />
        <div
          v-if="timeout"
          class="position-absolute left-0 right-0 bottom-0 anim-grow-x"
          :class="`color-bg-${color}-emphasis`"
          :style="{ animationDuration: `${timeout}ms` }"
        />
      </div>
      <button class="Toast-dismissButton" @click="handleClose">
        <Octicon name="x" />
      </button>
    </div>
  </aside>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, ref, toRefs, watch } from 'vue'

import Octicon from './Octicon.vue'

export default defineComponent({
  name: 'Toast',
  components: {
    Octicon,
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      default: '',
      validator: (v: string) => ['', 'success', 'warning', 'error'].includes(v),
    },
    timeout: {
      type: Number,
      default: 5000,
    },
  },
  setup(props, { emit }) {
    const { modelValue, type, timeout } = toRefs(props)
    function handleClose() {
      emit('update:modelValue', false)
    }

    const icon = computed(() => {
      const icons: Record<string, string> = {
        success: 'check',
        warning: 'alert',
        error: 'stop',
      };
      return icons[type.value] || 'info'
    })
    const color = computed(() => {
      const icons: Record<string, string> = {
        success: 'success',
        warning: 'attention',
        error: 'danger',
      };
      return icons[type.value] || 'accent'
    })

    const toastTimeout = ref()
    watch(modelValue, (v) => {
      window.clearTimeout(toastTimeout.value)
      if (v && timeout.value) {
        toastTimeout.value = window.setTimeout(() => {
          handleClose()
        }, timeout.value)
      }
    }, { immediate: true })
    onBeforeUnmount(() => {
      window.clearTimeout(toastTimeout.value)
    })

    return {
      handleClose,
      icon,
      color,
      timeout,
    }
  }
})
</script>

<style lang="scss">
.ToastContainer {
  z-index: 110;

  .anim-fade-up {
    animation-delay: 0ms;
  }
  .anim-grow-x {
    padding-top: 2px;
    animation-delay: 0ms;
    animation-timing-function: linear;
  }
}
</style>
