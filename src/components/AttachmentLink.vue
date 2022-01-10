<template>
  <a
    :href="href"
    target="_blank"
    :title="attachment.name"
  >
    <slot v-if="!isLoading">
      <Octicon name="image" />
    </slot>
    <slot v-else name="loading">
      <Spinner />
    </slot>
  </a>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, toRefs, watch } from 'vue'

import { getUserRefPath, storage } from '../services/firebase'
import { Attachment } from '../services/data'
import { useAsyncWrapper } from '../services/errors'

import Octicon from './Octicon.vue'
import Spinner from './Spinner.vue'

export default defineComponent({
  name: 'AttachmentLink',
  components: {
    Octicon,
    Spinner,
  },
  props: {
    attachment: {
      type: Object as PropType<Attachment>,
      required: true,
    },
  },
  setup(props) {
    const { attachment } = toRefs(props)
    const href = ref('#')
    const [runAsync, isLoading] = useAsyncWrapper()
    watch(attachment, ({ id }) => {
      runAsync(async () => {
        const ref = storage.ref(getUserRefPath(`/attachments/${id}`))
        href.value = await ref.getDownloadURL() || '#'
      })
    }, { immediate: true })

    return {
      href,
      isLoading,
    }
  },
})
</script>
