<template>
  <form @submit.prevent="handleSubmit" class="AddCrop">
    <div class="Box-body">
      <fieldset class="form-group required">
        <header class="form-group-header">
          <label>ID</label>
        </header>
        <input type="text" v-model="name" required class="form-control width-full" />
      </fieldset>

      <fieldset class="form-group">
        <header class="form-group-header">
          <label>Name</label>
        </header>
        <input type="text" v-model="nickname" class="form-control width-full" />
      </fieldset>
    </div>

    <footer class="Box-footer">
      <Button type="submit" :disabled="!isValid" :loading="isLoading" class="btn-primary btn-block">
        {{isEditing ? 'Save' : 'Add'}} Crop
      </Button>
    </footer>
  </form>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, toRefs } from 'vue'

import { Crop, NewEntity, UpdatedEntity } from '../services/data'
import { database, getUserRefPath, keyField, ServerValue } from '../services/firebase'

import Button from './Button.vue'

export default defineComponent({
  name: 'AddCrop',
  components: {
    Button,
  },
  props: {
    crop: {
      type: Object as PropType<Crop>,
      required: false,
    },
  },
  setup(props, { emit }) {
    const { crop } = toRefs(props)
    const isEditing = computed(() => Boolean(crop.value))

    const name = ref(crop.value?.name)
    const nickname = ref(crop.value?.nickname)
    const isValid = computed(() => Boolean(name.value))
    const isLoading = ref(false)

    return {
      name,
      nickname,

      isEditing,
      isValid,
      isLoading,
      async handleSubmit() {
        if (!isValid.value) return

        isLoading.value = true

        if (isEditing.value && crop.value?.[keyField]) {
          const updatedCrop: UpdatedEntity<Crop> = {
            name: name.value!,
            nickname: nickname.value || null,
            updatedAt: ServerValue.TIMESTAMP,
          }
          await database.ref(getUserRefPath(`/crops/${crop.value?.[keyField]}`)).update(updatedCrop)
          emit('update', updatedCrop);
        } else {
          const newCrop: NewEntity<Crop> = {
            name: name.value!,
            nickname: nickname.value || null,
            createdAt: ServerValue.TIMESTAMP,
          }
          database.ref(getUserRefPath('/crops')).push(newCrop)
          emit('create', newCrop);
        }

        isLoading.value = false

        name.value = undefined
        nickname.value = undefined
      },
    }
  },
})
</script>
