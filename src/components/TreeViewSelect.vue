<template>
  <Select
    v-bind="{ ...$attrs, ...$props, value: valueChunks.length }"
    :modelValue="modelValue"
    @update:modelValue="handleChange"
    @clear="handleClear"
    class="TreeViewSelect" 
  >
    <template #value>
      <span v-for="chunk in valueChunks" :key="chunk" class="no-wrap">{{chunk}}</span>
      <!-- <span class="Truncate">
        <span v-for="(chunk, index) in valueChunks" :key="chunk" class="Truncate-text Truncate-text--expandable">
          {{chunk}}<template v-if="valueChunks.length > 1 && index !== valueChunks.length - 1">,</template>
        </span>
      </span> -->
    </template>

    <slot />
  </Select>
</template>

<script lang="ts">
import { computed, defineComponent, toRefs } from 'vue'
import Select from './Select.vue'

export default defineComponent({
  components: {
    Select,
  },
  name: 'TreeViewSelect',
  props: {
    ...Select.props,
    value: {
      type: [String, Array],
      required: false,
    },
  },
  setup(props, { emit }) {
    const { value } = toRefs(props)
    const valueChunks = computed(() => Array.isArray(value.value) ? value.value : [value.value])

    function handleChange(v: any) {
      emit('update:modelValue', v)
    }
    function handleClear() {
      emit('clear')
    }

    return {
      valueChunks,
      handleChange,
      handleClear,
    }
  }
})
</script>

<style lang="scss">
.TreeViewSelect {
  .SelectMenu-modal {
    font-size: 1rem;
  }
}
</style>
