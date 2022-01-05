<template>
  <form @submit.prevent="handleSubmit" class="AddCrop">
    <fieldset>
      <label>ID</label>
      <input type="text" v-model="name" required />
    </fieldset>

    <fieldset>
      <label>Name</label>
      <input type="text" v-model="nickname" />
    </fieldset>

    <fieldset>
      <button type="submit" :disabled="!isValid">{{isEditing ? 'Save' : 'Add'}} Crop</button>
    </fieldset>
  </form>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, toRefs } from 'vue'

import { Crop, NewEntity, UpdatedEntity } from '../services/data'
import { database, getUserRefPath, keyField, ServerValue } from '../services/firebase'

export default defineComponent({
  name: 'AddCrop',
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

    return {
      name,
      nickname,

      isEditing,
      isValid,
      async handleSubmit() {
        if (!isValid.value) return

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

        name.value = undefined
        nickname.value = undefined
      },
    }
  },
})
</script>

<style lang="scss">
$spacing: 8px;

</style>