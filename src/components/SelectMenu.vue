<template>
  <details
    v-bind="$attrs"
    ref="detailsRef"
    class="SelectMenuContainer details-reset details-overlay position-relative" 
    @toggle="handleToggle"
  >
    <slot name="summary">
      <summary aria-haspopup="true" class="d-flex" style="cursor: inherit;">
        <slot name="prepend" />
        <slot name="trigger">
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
        </slot>
        <slot v-if="clearable" name="clearable">
          <button type="button" class="btn-octicon anim-scale-in" @click="handleClear">
            <Octicon name="x-circle-fill" />
          </button>
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