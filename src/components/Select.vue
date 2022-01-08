<template>
  <details
    v-bind="$attrs"
    ref="detailsRef"
    class="Select details-reset details-overlay position-relative" 
    @toggle="handleToggle"
  >
    <slot name="summary">
      <summary aria-haspopup="true" style="cursor: inherit;">
        <slot name="trigger">
          <div class="form-control form-select width-full">
            <template v-if="value">
              <slot name="value">
                {{value}}
              </slot>
            </template>
            <template v-else>
              <slot name="placeholder">
                <span class="color-fg-subtle">{{placeholder}}</span>
              </slot>
            </template>
          </div>
        </slot>
      </summary>
    </slot>
    <div class="SelectMenu position-fixed">
      <div class="SelectMenu-modal width-full overflow-auto">
        <slot />
      </div>
    </div>
  </details>
</template>

<script lang="ts">
import { defineComponent, ref, toRefs, watch } from 'vue'

export default defineComponent({
  name: 'Select',
  props: {
    modelValue: {
      default: false,
    },
    value: {
      required: false,
    },
    placeholder: {
      type: String,
      default: '',
    },
  },
  setup(props, { emit }) {
    const { modelValue } = toRefs(props)

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
      detailsRef,
      handleToggle,
    }
  }
})
</script>

<style lang="scss">
.Select {
    
}
</style>
