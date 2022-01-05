<template>
  <form @submit.prevent="handleSubmit" class="AddPlot">
    <fieldset>
      <label>Name</label>
      <input type="text" v-model="name" required />
    </fieldset>
    <fieldset>
      <label>Parent Plot</label>
      <select v-model="parentPlotId">
        <option :value="undefined">-</option>
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
      <button type="submit" :disabled="!isValid">{{isEditing ? 'Save' : 'Add'}} Plot</button>
    </fieldset>
  </form>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, toRefs } from 'vue'

import { NewEntity, Plot, usePlots, UpdatedEntity } from '../services/data'
import { database, getUserRefPath, keyField, ServerValue } from '../services/firebase'

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
    const isEditing = computed(() => Boolean(plot.value))

    const name = ref(plot.value?.name)
    const parentPlotId = ref(plot.value?.parentPlotId)
    const plots = usePlots()
    const isValid = computed(() => Boolean(name.value))

    return {
      name,
      parentPlotId,
      plots: plots.value?.filter((p) => p[keyField] !== plot.value?.[keyField]),

      isEditing,
      isValid,
      async handleSubmit() {
        if (!isValid.value) return

        if (isEditing.value && plot.value?.[keyField]) {
          const updatedPlot: UpdatedEntity<Plot> = {
            name: name.value!,
            parentPlotId: parentPlotId.value || null,
            updatedAt: ServerValue.TIMESTAMP,
          }
          await database.ref(getUserRefPath(`/plots/${plot.value?.[keyField]}`)).update(updatedPlot)
          emit('update', updatedPlot);
        } else {
          const newPlot: NewEntity<Plot> = {
            name: name.value!,
            parentPlotId: parentPlotId.value || null,
            createdAt: ServerValue.TIMESTAMP,
          }
          await database.ref(getUserRefPath('/plots')).push(newPlot)
          emit('create', newPlot);
        }

        name.value = undefined
        // let linger to ease batch additions
        // parentPlotId.value = undefined
      },
    }
  },
})
</script>

<style lang="scss">
$spacing: 8px;

</style>