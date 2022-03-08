<template>
  <div class="SelectMenuContainer d-flex width-full position-relative">
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
        <div
          ref="scrollerRef"
          class="SelectMenu-modal width-full overflow-auto"
          @scroll="({ target }) => scrollTop = target.scrollTop"
        >
          <slot name="header" v-bind="slotProps">
            <header v-if="title || editable" class="SelectMenu-header">
              <h3 class="SelectMenu-title">
                <slot name="title">{{ title }}</slot>
              </h3>
              <button
                v-if="editable"
                type="button"
                class="btn-octicon"
                :class="slotProps.edit() ? 'h6' : 'f6'"
                @click="slotProps.edit(!slotProps.edit())"
              >
                {{ slotProps.edit() ? 'Done' : 'Edit' }}
              </button>
            </header>
          </slot>
          <slot v-bind="slotProps">
            <div class="SelectMenu-list">
              <slot name="empty">
                <div class="SelectMenu-blankslate">
                  <Octicon name="circle-slash" :size="24" class="mt-n1" />
                  <h4 class="mt-3">No {{createableType}}s yet</h4>
                  <button
                    v-if="createable"
                    type="button"
                    class="btn btn-sm btn-primary d-inline-flex flex-items-center mt-3"
                    @click="handleCreate"
                  >
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
import { useRestoreKey } from '../services/data'

import Octicon from './Octicon.vue'

export default defineComponent({
  name: 'SelectMenu',
  components: {
    Octicon,
  },
  props: {
    modelValue: {
      // type: any,
      default: false,
    },
    value: {
      // type: any,
      required: false,
    },
    placeholder: {
      type: String,
      default: '',
    },
    title: {
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
    editable: {
      type: Boolean,
      default: false,
    },
    clearable: {
      type: Boolean,
      default: false,
    },
    restoreKey: {
      type: String,
      required: false,
    },
  },
  setup(props, { emit }) {
    const { modelValue, restoreKey } = toRefs(props)

    const isEditing = ref(false)
    function edit(to?: boolean) {
      if (to !== undefined) {
        isEditing.value = to
      }
      return isEditing.value
    }
    const detailsRef = ref()
    function get() {
      return Boolean(detailsRef.value?.open)
    }
    const isOpen = ref(get())
    function open() {
      isOpen.value = true
      detailsRef.value?.setAttribute('open', true)
      emit('open')
    }
    function close() {
      isOpen.value = false
      detailsRef.value?.removeAttribute('open')
      edit(false)
      emit('close')
    }
    function set(v: any) {
      if (v) {
        open()
      } else {
        close()
      }
    }
    const slotProps = {
      edit,
      open,
      close,
      get,
      set,
    }

    watch(modelValue, (v) => {
      set(v)
    }, { immediate: true })
    function handleChange(v: any) {
      set(v)
      emit('update:modelValue', v)
    }
    function handleToggle() {
      handleChange(get())
    }

    function handleCreate() {
      emit('create')
    }
    function handleClear() {
      emit('clear')
    }

    const scrollerRef = ref()
    const scrollTop = ref(0)
    if (restoreKey.value) { // @TODO: what if this value changes post-init?
      const restore = useRestoreKey(restoreKey.value, 'SelectMenu')
      watch(isOpen, (v) => {
        if (v) {
          if (scrollerRef.value) {
            scrollerRef.value.scrollTop = restore.load()
          }
        } else {
          restore.save(scrollTop.value)
        }
      })
    }

    return {
      detailsRef,
      slotProps,

      handleChange,
      handleToggle,

      handleCreate,
      handleClear,

      scrollerRef,
      scrollTop,
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
