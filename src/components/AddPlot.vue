<template>
  <form @submit.prevent="handleSubmit" class="AddPlot">
    <fieldset>
      <label>Name</label>
      <input type="text" v-model="name" required />
    </fieldset>

    <fieldset>
      <button type="submit" :disabled="!name">Add Plot</button>
    </fieldset>
  </form>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

import { NewEntity, Plot } from '../services/data'
import { database, ServerValue } from '../services/firebase'

export default defineComponent({
  name: 'AddPlot',
  setup() {
    const name = ref<string>()

    return {
      name,

      async handleSubmit() {
        if (!name.value) return

        const newPlot: NewEntity<Plot> = {
          name: name.value,
          createdAt: ServerValue.TIMESTAMP,
        }
        await database.ref('/users/mismith/plots').push(newPlot)

        name.value = undefined
      },
    }
  },
})
</script>

<style lang="scss">
$spacing: 8px;

</style>