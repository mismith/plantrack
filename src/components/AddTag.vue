<template>
  <form @submit.prevent="handleSubmit" class="AddTag">
    <div class="Box-body">
      <fieldset class="form-group required">
        <header class="form-group-header">
          <label>Name</label>
        </header>
        <input type="text" v-model="name" required class="form-control width-full" />
      </fieldset>
      <fieldset class="form-group">
        <header class="form-group-header">
          <label>Color</label>
        </header>
        <div class="d-flex">
          <div class="input-group flex-auto">
            <span class="input-group-button">
              <Button :style="{ backgroundColor: color }">
                &nbsp;
                <input
                  type="color"
                  v-model="color"
                  class="position-absolute height-full width-full"
                  style="inset: 0; opacity: 0; cursor: inherit;"
                />
              </Button>
            </span>
            <input type="text" v-model="color" class="form-control width-full mr-0" />
          </div>
          <button type="button" class="btn-octicon" @click="color = undefined">
            <Octicon name="x-circle-fill" />
          </button>
        </div>
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
import Octicon from './Octicon.vue'

export default defineComponent({
  name: 'AddTag',
  components: {
    Button,
    Octicon,
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
    const color = ref(tag.value?.color)
    const isValid = computed(() => Boolean(name.value))

    const toast = inject<Function>('toast')
    const [runAsync, isLoading] = useAsyncWrapper()
    async function handleSubmit() {
      if (!isValid.value) return

      await runAsync(async () => {
        if (isEditing.value && tag.value?.[keyField]) {
          const updatedTag: UpdatedEntity<Tag> = {
            name: name.value!,
            color: color.value || null,
            updatedAt: ServerValue.TIMESTAMP,
          }
          await database.ref(getUserRefPath(`/tags/${tag.value?.[keyField]}`)).update(updatedTag)
          emit('update', updatedTag)
          toast?.('Tag saved successfully', 'success')
        } else {
          const newTag: NewEntity<Tag> = {
            name: name.value!,
            color: color.value || null,
            createdAt: ServerValue.TIMESTAMP,
          }
          database.ref(getUserRefPath('/tags')).push(newTag)
          emit('create', newTag)
          toast?.('Tag added successfully', 'success')
        }
      })

      name.value = undefined
      color.value = undefined
    }

    return {
      name,
      color,

      isEditing,
      isValid,
      isLoading,
      handleSubmit,
    }
  },
})
</script>
