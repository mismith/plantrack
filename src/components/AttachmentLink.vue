<template>
  <a
    :href="href"
    target="_blank"
    :title="attachment.name"
    class="d-inline-flex"
    :class="{ 'tooltipped tooltipped-s tooltipped-multiline tooltipped-no-delay color-fg-danger': isError }"
    :aria-label="isError"
  >
    <slot v-if="isError" name="error">
      <Octicon
        name="alert"
        :size="preview ? 24 : undefined"
        style="color: inherit;"
      />
    </slot>
    <slot v-else-if="!isLoading">
      <img
        v-if="preview && isImage"
        :src="href"
        :alt="attachment.name"
        class="container-sm"
        style="object-fit: contain; max-width: 300px; max-height: min(50vh, 300px);"
        @error="err => isError = err.message || err"
      />
      <Octicon
        v-else
        :name="isImage ? 'image' : 'file'"
        :width="preview ? 128 : undefined"
        :height="preview ? 128 : undefined"
      />
    </slot>
    <slot v-else name="loading">
      <Spinner />
    </slot>
  </a>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, toRefs, watch } from 'vue'

import { getUserRefPath, storage } from '../services/firebase'
import { Attachment } from '../services/data'

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
    preview: {
      // @TODO: check if it's an image first (and don't show preview if not)
      type: Boolean,
      required: false,
    },
  },
  setup(props) {
    const { attachment } = toRefs(props)
    const href = ref()
    const isImage = computed(() => attachment.value?.type.startsWith('image/'))
    const isLoading = ref(false)
    const isError = ref()
    const attachmentId = ref()
    watch(attachment, async ({ id }) => {
      if (isLoading.value || attachmentId.value === id) return

      isLoading.value = true
      attachmentId.value = id
      try {
        const ref = storage.ref(getUserRefPath(`/attachments/${id}`))
        href.value = await ref.getDownloadURL()
      } catch (err: any) {
        isError.value = err.message || err
      }
      isLoading.value = false
    }, { immediate: true })

    return {
      href,
      isImage,
      isLoading,
      isError,
    }
  },
})
</script>
