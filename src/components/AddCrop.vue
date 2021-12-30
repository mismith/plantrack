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
      <button type="submit" :disabled="!name">Add Crop</button>
    </fieldset>
  </form>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

import { Crop, NewEntity } from '../services/data'
import { database, ServerValue } from '../services/firebase'

export default defineComponent({
  name: 'AddCrop',
  setup() {
    const name = ref<string>()
    const nickname = ref<string>()

    return {
      name,
      nickname,

      async handleSubmit() {
        if (!name.value) return

        const newCrop: NewEntity<Crop> = {
          name: name.value,
          nickname: nickname.value || null,
          createdAt: ServerValue.TIMESTAMP,
        }
        await database.ref('/users/mismith/crops').push(newCrop)

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