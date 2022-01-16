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
        </header>
        <SelectMenu
          :value="plots?.find(({ id }) => id === plotIds?.[0])?.name || ''"
          createable
          createable-type="plot"
          @create="handlePlotCreate"
        >
          <template #default="{ close }">
            <PlantTreeView
              v-if="plots?.length"
              v-model="plotIds"
              :filter="node => node.type !== 'entry' && node.id !== 'system'"
              selectable-type="plot"
              @update:model-value="close()"
            />
          </template>
        </SelectMenu>
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
import { computed, defineComponent, inject, PropType, Ref, ref, toRefs, watch } from 'vue'

import { Bed, NewEntity, Plot, UpdatedEntity, usePlots } from '../services/data'
import { database, getUserRefPath, keyField, ServerValue } from '../services/firebase'
import { useAsyncWrapper } from '../services/errors'

import Button from './Button.vue'
import SelectMenu from './SelectMenu.vue'
import PlantTreeView from './PlantTreeView.vue'
import Octicon from './Octicon.vue'

export default defineComponent({
  name: 'AddBed',
  components: {
    Button,
    SelectMenu,
    PlantTreeView,
    Octicon,
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
    const plotIds = ref([bed.value?.plotId || plots.value?.[0]?.id].filter(Boolean))
    const isValid = computed(() => Boolean(name.value && plotIds.value?.[0]))

    const isAddingPlot = inject<Ref>('isAddingPlot')!
    function handlePlotCreate() {
      isAddingPlot.value = (newPlot: Plot) => {
        plotIds.value = [newPlot.id]
        isAddingPlot.value = false
      }
    }

    const toast = inject<Function>('toast')
    const [runAsync, isLoading] = useAsyncWrapper()
    async function handleSubmit() {
      if (!isValid.value) return

      await runAsync(async () => {
        if (isEditing.value && bed.value?.[keyField]) {
          const updatedBed: UpdatedEntity<Bed> = {
            name: name.value!,
            plotId: plotIds.value[0]!,
            updatedAt: ServerValue.TIMESTAMP,
          }
          await database.ref(getUserRefPath(`/beds/${bed.value?.[keyField]}`)).update(updatedBed)
          emit('update', updatedBed)
          toast?.('Bed saved successfully', 'success')
        } else {
          const newBed: NewEntity<Bed> = {
            name: name.value!,
            plotId: plotIds.value[0]!,
            createdAt: ServerValue.TIMESTAMP,
          }
          const bedId = (await database.ref(getUserRefPath('/beds')).push(newBed)).key
          emit('create', { [keyField]: bedId, ...newBed })
          toast?.('Bed added successfully', 'success')
        }
      })

      name.value = undefined
      // let linger to ease batch additions
      // plotIds.value = []
    }

    return {
      name,

      plots,
      plotIds,
      isAddingPlot,
      handlePlotCreate,

      isEditing,
      isValid,
      isLoading,
      handleSubmit,
    }
  },
})
</script>
