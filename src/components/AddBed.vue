<template>
  <form @submit.prevent="handleSubmit" v-bind="$attrs" class="AddBed">
    <fieldset>
      <label>Name</label>
      <input type="text" v-model="name" required />
    </fieldset>

    <fieldset>
      <label>
        Plot
        <button type="button" :class="{ active: isAddingPlot }" @click="isAddingPlot = !isAddingPlot">Add Plot</button>
      </label>

      <select v-model="plotId" required>
        <option
          v-for="plot in plots"
          :key="plot.id"
          :value="plot.id"
        >
          {{plot.name}}
        </option>
      </select>
    </fieldset>

    <fieldset>
      <button type="submit" :disabled="!name || !plotId">Add Bed</button>
    </fieldset>
  </form>
</template>

<script lang="ts">
import { defineComponent, inject, ref } from 'vue'

import { Bed, NewEntity, usePlots } from '../services/data'
import { database, ServerValue } from '../services/firebase'

export default defineComponent({
  name: 'AddBed',
  setup() {
    const plots = usePlots()
    const plotId = ref(plots.value?.[0]?.id)
    const name = ref()

    return {
      isAddingPlot: inject('isAddingPlot'),
      name,
      plots,
      plotId,

      handleSubmit() {
        if (!name.value || !plotId.value) return

        const newBed: NewEntity<Bed> = {
          name: name.value,
          plotId: plotId.value,
          createdAt: ServerValue.TIMESTAMP,
        }
        database.ref('/users/mismith/beds').push(newBed)
      },
    }
  },
})
</script>

<style lang="scss">
$spacing: 8px;

</style>