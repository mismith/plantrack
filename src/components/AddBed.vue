<template>
  <form @submit.prevent="handleSubmit" class="AddBed">
    <fieldset>
      <label>Name</label>
      <input type="text" v-model="name" required />
    </fieldset>

    <fieldset>
      <header>
        <label>Plot</label>
        <button type="button" :class="{ active: isAddingPlot }" @click="isAddingPlot = !isAddingPlot">Add Plot</button>
      </header>

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
      <button type="submit" :disabled="!isValid">{{isEditing ? 'Save' : 'Add'}} Bed</button>
    </fieldset>
  </form>
</template>

<script lang="ts">
import { computed, defineComponent, inject, PropType, ref, toRefs } from 'vue'

import { Bed, NewEntity, UpdatedEntity, usePlots } from '../services/data'
import { database, getUserRefPath, keyField, ServerValue } from '../services/firebase'

export default defineComponent({
  name: 'AddBed',
  props: {
    bed: {
      type: Object as PropType<Bed>,
      required: false,
    },
  },
  setup(props, { emit }) {
    const { bed } = toRefs(props)
    const isEditing = computed(() => Boolean(bed.value))

    const name = ref(bed.value?.name)
    const plots = usePlots()
    const plotId = ref(bed.value?.plotId || plots.value?.[0]?.id)
    const isValid = computed(() => Boolean(name.value && plotId.value))

    return {
      isAddingPlot: inject('isAddingPlot'),
      name,
      plots,
      plotId,

      isEditing,
      isValid,
      async handleSubmit() {
        if (!isValid.value) return

        if (isEditing.value && bed.value?.[keyField]) {
          const updatedBed: UpdatedEntity<Bed> = {
            name: name.value!,
            plotId: plotId.value!,
            updatedAt: ServerValue.TIMESTAMP,
          }
          await database.ref(getUserRefPath(`/beds/${bed.value?.[keyField]}`)).update(updatedBed)
          emit('update', updatedBed);
        } else {
          const newBed: NewEntity<Bed> = {
            name: name.value!,
            plotId: plotId.value!,
            createdAt: ServerValue.TIMESTAMP,
          }
          database.ref(getUserRefPath('/beds')).push(newBed)
          emit('create', newBed);
        }

        name.value = undefined
        // let linger to ease batch additions
        // plotId.value = undefined
      },
    }
  },
})
</script>

<style lang="scss">
$spacing: 8px;

</style>