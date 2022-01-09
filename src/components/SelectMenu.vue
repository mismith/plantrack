<template>
  <div class="SelectMenuContainer d-flex width-full position-relative">
    <slot name="prepend" />
    <details
      v-bind="$attrs"
      ref="detailsRef"
      class="details-reset details-overlay flex-auto" 
      @toggle="handleToggle"
    >
      <slot name="summary">
        <summary aria-haspopup="true" style="cursor: inherit;">
          <div class="form-control form-select width-full flex-auto mr-0">
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
        </summary>
      </slot>
      <div class="SelectMenu position-fixed">
        <div class="SelectMenu-modal width-full overflow-auto">
          <slot />
        </div>
      </div>
    </details>
    <slot v-if="clearable" name="clearable">
      <button type="button" class="btn-octicon anim-scale-in" @click="handleClear">
        <Octicon name="x-circle-fill" />
      </button>
    </slot>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, toRefs, watch } from 'vue'

import Octicon from './Octicon.vue'

export default defineComponent({
  name: 'SelectMenu',
  components: {
    Octicon,
  },
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
    clearable: {
      type: Boolean,
      default: false,
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

    function handleClear() {
      emit('clear')
    }

    return {
      detailsRef,
      handleToggle,
      handleClear,
    }
  }
})
</script>
