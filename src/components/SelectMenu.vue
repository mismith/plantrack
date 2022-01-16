<template>
  <div class="SelectMenuContainer d-flex width-full position-relative">
    <slot name="prepend" />
    <slot v-if="createable" name="createable">
      <button type="button" :title="`New ${createableType}`" class="btn-octicon ml-0 mr-1" @click="handleCreate">
        <Octicon name="plus-circle" />
      </button>
    </slot>
    <details
      v-bind="$attrs"
      ref="detailsRef"
      class="details-reset details-overlay flex-auto" 
      @toggle="handleToggle"
    >
      <slot name="summary">
        <summary aria-haspopup="true" class="form-control form-select width-full flex-auto mr-0" style="cursor: inherit;">
          <template v-if="Array.isArray(value) ? value.length : value">
            <slot name="value">
              {{(Array.isArray(value) ? value : [value]).join(', ')}}
            </slot>
          </template>
          <template v-else>
            <slot name="placeholder">
              <span class="color-fg-subtle">{{placeholder}}</span>
            </slot>
          </template>
        </summary>
      </slot>
      <div class="SelectMenu position-fixed">
        <div class="SelectMenu-modal width-full overflow-auto">
          <slot>
            <div class="SelectMenu-list">
              <slot name="empty">
                <div class="SelectMenu-blankslate">
                  <Octicon name="circle-slash" :size="24" class="mt-n1" />
                  <h4 class="mt-3">No {{createableType}}s yet</h4>
                  <button v-if="createable" type="button" class="btn btn-sm btn-primary d-inline-flex flex-items-center mt-3" @click="handleCreate">
                    <Octicon name="plus-circle" class="mr-2" />
                    New {{createableType}}
                  </button>
                </div>
              </slot>
            </div>
          </slot>
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
    createable: {
      type: Boolean,
      default: false,
    },
    createableType: {
      type: String,
      default: 'item',
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

    function handleCreate() {
      emit('create')
    }
    function handleClear() {
      emit('clear')
    }

    return {
      detailsRef,
      handleToggle,
      handleCreate,
      handleClear,
    }
  }
})
</script>

<style lang="scss">
.SelectMenu {
  .SelectMenu-modal {
    font-size: 1rem;
  }
}
</style>
