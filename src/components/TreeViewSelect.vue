<template>
  <details
    v-bind="$attrs"
    ref="detailsRef"
    class="TreeViewSelect details-reset details-overlay position-relative" 
    @toggle="handleToggle"
  >
    <summary class="form-control form-select width-full" aria-haspopup="true" style="cursor: inherit;">
      <template v-if="displayValueChunks.length">
        <slot name="display-value">
          <span v-for="chunk in displayValueChunks" :key="chunk" class="no-wrap">{{chunk}}</span>
          <!-- <span class="Truncate">
            <span v-for="(chunk, index) in displayValueChunks" :key="chunk" class="Truncate-text Truncate-text--expandable">
              {{chunk}}<template v-if="displayValueChunks.length > 1 && index !== displayValueChunks.length - 1">,</template>
            </span>
          </span> -->
        </slot>
      </template>
      <template v-else>
        <slot name="placeholder">
          <span class="color-fg-subtle">{{placeholder}}</span>
        </slot>
      </template>
    </summary>
    <div class="SelectMenu position-fixed" style="min-width: 300px;">
      <div class="SelectMenu-modal width-full overflow-auto">
        <slot />
      </div>
    </div>
  </details>
</template>

<script lang="ts">
import { computed, defineComponent, ref, toRefs, watch } from 'vue'

export default defineComponent({
  name: 'TreeViewSelect',
  props: {
    modelValue: {
      default: false,
    },
    displayValue: {
      type: [String, Array],
      required: false,
    },
    placeholder: {
      type: String,
      default: '',
    },
  },
  setup(props, { emit }) {
    const { modelValue: isOpen, displayValue } = toRefs(props)
    const displayValueChunks = computed(() => Array.isArray(displayValue.value) ? displayValue.value : [displayValue.value])

    const detailsRef = ref()
    watch(isOpen, (v) => {
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
      displayValueChunks,
      isOpen,
      detailsRef,
      handleToggle,
    }
  }
})
</script>

<style lang="scss">
.TreeViewSelect {
  max-width: calc(100vw - 2 * 16px); // @HACK

  .SelectMenu-modal {
    font-size: 1rem;
  }
}
</style>
