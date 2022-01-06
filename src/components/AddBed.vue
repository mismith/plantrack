<template>
  <form @submit.prevent="handleSubmit" class="AddBed">
    <div class="Box-body">
      <fieldset class="form-group required">
        <header class="form-group-header">
          <label>Name</label>
        </header>
        <input type="text" v-model="name" required class="form-control width-full" />
      </fieldset>

      <fieldset class="form-group required">
        <header class="form-group-header">
          <label>Plot</label>

          <button type="button" class="btn btn-sm" :class="{ active: isAddingPlot }" @click="isAddingPlot = !isAddingPlot">Add Plot</button>
        </header>

        <select v-model="plotId" required class="form-select width-full">
          <option
            v-for="plot in plots"
            :key="plot.id"
            :value="plot.id"
          >
            {{plot.name}}
          </option>
        </select>
      </fieldset>
    </div>

    <footer class="Box-footer">
      <Button type="submit" :disabled="!isValid" :loading="isLoading" class="btn-primary btn-block">
        {{isEditing ? 'Save' : 'Add'}} Bed
      </Button>
    </footer>
  </form>
</template>

<script lang="ts">
import { computed, defineComponent, inject, PropType, ref, toRefs } from 'vue'

import { Bed, NewEntity, UpdatedEntity, usePlots } from '../services/data'
import { database, getUserRefPath, keyField, ServerValue } from '../services/firebase'

import Button from './Button.vue'

export default defineComponent({
  name: 'AddBed',
  components: {
    Button,
  },
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
    const isLoading = ref(false)

    return {
      isAddingPlot: inject('isAddingPlot'),
      name,
      plots,
      plotId,

      isEditing,
      isValid,
      isLoading,
      async handleSubmit() {
        if (!isValid.value) return

        isLoading.value = true

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

        isLoading.value = false

        name.value = undefined
        // let linger to ease batch additions
        // plotId.value = undefined
      },
    }
  },
})
</script>
