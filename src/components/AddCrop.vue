<template>
  <form @submit.prevent="handleSubmit" class="AddCrop">
    <fieldset>
      <label>Name</label>
      <input type="text" v-model="name" required />
    </fieldset>

    <fieldset>
      <label>Nickname</label>
      <input type="text" v-model="nickname" />
    </fieldset>

    <fieldset>
      <button type="submit" :disabled="!name">Add Crop</button>
    </fieldset>
  </form>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

import { database, ServerValue } from '../services/firebase'

export default defineComponent({
  name: 'AddCrop',
  setup() {
    const name = ref()
    const nickname = ref()

    return {
      name,
      nickname,

      async handleSubmit() {
        await database.ref('/users/mismith/crops').push({
          name: name.value,
          nickname: nickname.value || null,
          createdAt: ServerValue.TIMESTAMP,
        })

        name.value = null
        nickname.value = null
      },
    }
  },
})
</script>

<style lang="scss">
$spacing: 8px;

</style>