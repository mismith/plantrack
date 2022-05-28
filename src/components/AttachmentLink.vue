<template>
  <a
    :href="href"
    target="_blank"
    :title="attachment.name"
    class="d-inline-flex"
    :class="{ 'tooltipped tooltipped-s tooltipped-multiline tooltipped-no-delay color-fg-danger': isError }"
    :style="preview ? 'background-color: var(--color-border-muted); border: solid 8px var(--color-border-muted); border-radius: 4px;' : undefined"
    :aria-label="isError"
  >
    <slot v-if="isError" name="error">
      <Octicon
        name="alert"
        :size="preview ? 24 : undefined"
        style="color: inherit;"
      />
    </slot>
    <slot v-else-if="isLoading" name="loading">
      <Spinner />
    </slot>
    <slot v-else>
      <img
        v-if="preview && isImage"
        :src="src"
        :alt="attachment.name"
        style="object-fit: contain; width: 100%; max-width: 300px; max-height: min(50vh, 300px);"
        @error="(err: any) => isError = err.message || err"
      />
      <Octicon
        v-else
        :name="isImage ? 'image' : 'file'"
        :width="preview ? 128 : undefined"
        :height="preview ? 128 : undefined"
      />
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
    const { attachment, preview } = toRefs(props)
    const href = ref()
    const src = ref()
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
        src.value = href.value

        if (isImage.value && preview.value) {
          await new Promise(async (resolve, reject) => {
            try {
              const thumbRef = storage.ref(getUserRefPath(`/attachments/thumbnails/${id}`))
              src.value = await thumbRef.getDownloadURL()
            } catch (error) {
              // ignore / fallback to full image src
            }
            const img = document.createElement('img')
            img.onload = resolve
            img.onerror = reject
            img.src = src.value
          })
        }
      } catch (err: any) {
        isError.value = err.message || err
      }
      isLoading.value = false
    }, { immediate: true })

    return {
      href,
      src,
      isImage,
      isLoading,
      isError,
    }
  },
})
</script>
