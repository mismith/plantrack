<template>
  <span
    v-bind="$attrs"
    class="Label"
    :style="{
      color: tag ? tag?.color : 'var(--color-border-default)',
      borderColor: (!tag || tag?.color) && 'currentColor',
      borderStyle: !tag ? 'dashed' : undefined,
    }"
  >
    {{tag?.name || 'tag deleted'}}
  </span>
</template>

<script lang="ts">
import { computed, defineComponent, toRefs } from 'vue'

import { useTags } from '../services/data'

export default defineComponent({
  name: 'Tag',
  props: {
    tagId: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { tagId } = toRefs(props)
    const tags = useTags()
    const tag = computed(() => tags.value?.find(({ id }) => id === tagId.value))

    return {
      tags,
      tag,
    }
  },
})
</script>
