<template>
  <form @submit.prevent="handleSubmit" class="AddPlot">
    <fieldset>
      <label>Name</label>
      <input type="text" v-model="name" required />
    </fieldset>
    <fieldset>
      <label>Parent Plot</label>
      <select v-model="parentPlotId">
        <option
          v-for="plot in plots"
          :key="plot.id"
          :value="plot.id"
        >
          {{plot.name}}
        </option>
      </select>
      <!-- @TODO: allow clearing if isEditing -->
    </fieldset>

    <fieldset>
      <button type="submit" :disabled="!name">{{isEditing ? 'Save' : 'Add'}} Plot</button>
    </fieldset>
  </form>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, toRefs } from 'vue'

import { NewEntity, Plot, usePlots, UpdatedEntity } from '../services/data'
import { database, keyField, ServerValue } from '../services/firebase'

export default defineComponent({
  name: 'AddPlot',
  props: {
    plot: {
      type: Object as PropType<Plot>,
      required: false,
    },
  },
  setup(props, { emit }) {
    const { plot } = toRefs(props);
    const isEditing = computed(() => Boolean(plot))

    const name = ref<string | undefined>(plot.value?.name)
    const parentPlotId = ref<string | undefined>(plot.value?.parentPlotId)
    const plots = usePlots()

    return {
      name,
      parentPlotId,
      plots: plots.value?.filter((p) => p[keyField] !== plot.value?.[keyField]),

      isEditing,
      async handleSubmit() {
        if (!name.value) return

        if (isEditing.value && plot.value?.[keyField]) {
          const updatedPlot: UpdatedEntity<Plot> = {
            name: name.value,
            parentPlotId: parentPlotId.value || null,
            updatedAt: ServerValue.TIMESTAMP,
          }
          await database.ref(`/users/mismith/plots/${plot.value?.[keyField]}`).update(updatedPlot)

          emit('edit', updatedPlot);
        } else {
          const newPlot: NewEntity<Plot> = {
            name: name.value,
            parentPlotId: parentPlotId.value || null,
            createdAt: ServerValue.TIMESTAMP,
          }
          await database.ref('/users/mismith/plots').push(newPlot)
        }

        name.value = undefined
        parentPlotId.value = undefined
      },
    }
  },
})
</script>

<style lang="scss">
$spacing: 8px;

</style>