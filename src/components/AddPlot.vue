<template>
  <form @submit.prevent="handleSubmit" class="AddPlot">
    <fieldset>
      <label>Name</label>
      <input type="text" v-model="name" required />
    </fieldset>

    <fieldset>
      <button type="submit" :disabled="!name">{{isEditing ? 'Save' : 'Add'}} Plot</button>
    </fieldset>
  </form>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, toRefs } from 'vue'

import { NewEntity, Plot, UpdatedEntity } from '../services/data'
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

    return {
      name,

      isEditing,
      async handleSubmit() {
        if (!name.value) return

        if (isEditing.value && plot.value?.[keyField]) {
          const updatedPlot: UpdatedEntity<Plot> = {
            name: name.value,
            updatedAt: ServerValue.TIMESTAMP,
          }
          await database.ref(`/users/mismith/plots/${plot.value?.[keyField]}`).update(updatedPlot)

          emit('edit', updatedPlot);
        } else {
          const newPlot: NewEntity<Plot> = {
            name: name.value,
            createdAt: ServerValue.TIMESTAMP,
          }
          await database.ref('/users/mismith/plots').push(newPlot)
        }

        name.value = undefined
      },
    }
  },
})
</script>

<style lang="scss">
$spacing: 8px;

</style>