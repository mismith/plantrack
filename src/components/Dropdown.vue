<template>
  <details
    v-bind="$attrs"
    ref="detailsRef"
    class="Dropdown dropdown details-reset details-overlay" 
    @toggle="handleToggle"
  >
    <slot name="summary" v-bind="{ summaryProps }">
      <summary v-bind="summaryProps" style="cursor: inherit;">
        <slot name="text" />
        <div class="dropdown-caret"></div>
      </summary>
    </slot>
    <div class="dropdown-menu" :class="`dropdown-menu-${direction} ${menuClass}`">
      <slot />
    </div>
  </details>
</template>

<script lang="ts">
import { computed, defineComponent, ref, toRefs, watch } from 'vue'

export default defineComponent({
  name: 'Dropdown',
  props: {
    modelValue: {
      default: false,
    },
    direction: {
      type: String,
      required: true,
    },
    menuClass: {
      type: String,
      required: false,
    },
  },
  setup(props, { emit }) {
    const { modelValue } = toRefs(props)

    const summaryProps = computed(() => ({
      ariaHaspopup: true,
    }))

    const detailsRef = ref()
    watch(modelValue, (v) => {
      if (v) {
        detailsRef.value?.setAttribute('open', true)
      } else {
        detailsRef.value?.removeAttribute('open')
      }
    }, { immediate: true })
    function handleToggle() {
      emit('update:modelValue', detailsRef.value?.open)
    }

    return {
      summaryProps,
      detailsRef,
      handleToggle,
    }
  }
})
</script>

<style lang="scss">
.Dropdown {
    
}
</style>
