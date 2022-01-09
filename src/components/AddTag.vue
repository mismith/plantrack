<template>
  <form @submit.prevent="handleSubmit" class="AddTag">
    <div class="Box-body">
      <fieldset class="form-group required">
        <header class="form-group-header">
          <label>Name</label>
        </header>
        <input type="text" v-model="name" required class="form-control width-full" />
      </fieldset>
    </div>

    <footer class="Box-footer">
      <Button type="submit" :disabled="!isValid" :loading="isLoading" class="btn-primary btn-block">
        {{isEditing ? 'Save' : 'Add'}} Tag
      </Button>
    </footer>
  </form>
</template>

<script lang="ts">
import { computed, defineComponent, inject, PropType, ref, toRefs } from 'vue'

import { Tag, NewEntity, UpdatedEntity } from '../services/data'
import { database, getUserRefPath, keyField, ServerValue } from '../services/firebase'
import { useAsyncWrapper } from '../services/errors'

import Button from './Button.vue'

export default defineComponent({
  name: 'AddTag',
  components: {
    Button,
  },
  props: {
    tag: {
      type: Object as PropType<Tag>,
      required: false,
    },
  },
  setup(props, { emit }) {
    const { tag } = toRefs(props)
    const isEditing = computed(() => Boolean(tag.value))

    const name = ref(tag.value?.name)
    const isValid = computed(() => Boolean(name.value))

    const toast = inject<Function>('toast')
    const [runAsync, isLoading] = useAsyncWrapper()
    async function handleSubmit() {
      if (!isValid.value) return

      await runAsync(async () => {
        if (isEditing.value && tag.value?.[keyField]) {
          const updatedTag: UpdatedEntity<Tag> = {
            name: name.value!,
            updatedAt: ServerValue.TIMESTAMP,
          }
          await database.ref(getUserRefPath(`/tags/${tag.value?.[keyField]}`)).update(updatedTag)
          emit('update', updatedTag)
          toast?.('Tag saved successfully', 'success')
        } else {
          const newTag: NewEntity<Tag> = {
            name: name.value!,
            createdAt: ServerValue.TIMESTAMP,
          }
          database.ref(getUserRefPath('/tags')).push(newTag)
          emit('create', newTag)
          toast?.('Tag added successfully', 'success')
        }
      })

      name.value = undefined
    }

    return {
      name,

      isEditing,
      isValid,
      isLoading,
      handleSubmit,
    }
  },
})
</script>
