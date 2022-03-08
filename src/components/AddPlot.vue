<template>
  <form @submit.prevent="handleSubmit" class="AddPlot">
    <div class="Box-body">
      <fieldset class="form-group required">
        <header class="form-group-header">
          <label>Name</label>
        </header>
        <input type="text" v-model="name" required class="form-control width-full" />
      </fieldset>
      <fieldset v-if="plots?.length" class="form-group">
        <header class="form-group-header">
          <label>Parent Plot</label>
        </header>
        <SelectMenu
          :value="plots?.find(({ id }) => id === parentPlotIds?.[0])?.name || ''"
          title="Plots"
          :clearable="Boolean(parentPlotIds.length)"
          editable
          @clear="parentPlotIds = []"
        >
          <template #header v-if="!plots?.length"><div /></template>
          <template #default="{ edit, close }">
            <PlantTreeView
              v-model="parentPlotIds"
              :filter="node => node.type !== 'entry' && node.id !== 'system'"
              selectable-type="plot"
              :editable="edit()"
              @update:model-value="close()"
            />
          </template>
        </SelectMenu>
      </fieldset>
    </div>

    <footer class="Box-footer">
      <Button type="submit" :disabled="!isValid" :loading="isLoading" class="btn-primary btn-block">
        {{isEditing ? 'Save' : 'Add'}} Plot
      </Button>
    </footer>
  </form>
</template>

<script lang="ts">
import { computed, defineComponent, inject, PropType, ref, toRefs, watch } from 'vue'

import { NewEntity, Plot, usePlots, UpdatedEntity } from '../services/data'
import { database, getUserRefPath, keyField, ServerValue } from '../services/firebase'
import { useAsyncWrapper } from '../services/errors'

import Button from './Button.vue'
import SelectMenu from './SelectMenu.vue'
import PlantTreeView from './PlantTreeView.vue'

export default defineComponent({
  name: 'AddPlot',
  components: {
    Button,
    SelectMenu,
    PlantTreeView,
  },
  props: {
    plot: {
      type: Object as PropType<Plot>,
      required: false,
    },
  },
  setup(props, { emit }) {
    const { plot } = toRefs(props)
    const isEditing = computed(() => Boolean(plot.value))

    const name = ref(plot.value?.name)
    const parentPlotIds = ref([plot.value?.parentPlotId].filter(Boolean))
    const plots = usePlots()
    const isValid = computed(() => Boolean(name.value))

    const toast = inject<Function>('toast')
    const [runAsync, isLoading] = useAsyncWrapper()
    async function handleSubmit() {
      if (!isValid.value) return

      await runAsync(async () => {
        if (isEditing.value && plot.value?.[keyField]) {
          const updatedPlot: UpdatedEntity<Plot> = {
            name: name.value!,
            parentPlotId: parentPlotIds.value?.[0] || null,
            updatedAt: ServerValue.TIMESTAMP,
          }
          await database.ref(getUserRefPath(`/plots/${plot.value?.[keyField]}`)).update(updatedPlot)
          emit('update', updatedPlot)
          toast?.('Plot saved successfully', 'success')
        } else {
          const newPlot: NewEntity<Plot> = {
            name: name.value!,
            parentPlotId: parentPlotIds.value?.[0] || null,
            createdAt: ServerValue.TIMESTAMP,
          }
          const plotId = (await database.ref(getUserRefPath('/plots')).push(newPlot)).key
          emit('create', { [keyField]: plotId, ...newPlot })
          toast?.('Plot added successfully', 'success')
        }
      })

      name.value = undefined
      // let linger to ease batch additions
      // parentPlotId.value = undefined
    }

    return {
      name,
      parentPlotIds,
      plots: plots.value?.filter((p) => p[keyField] !== plot.value?.[keyField]),

      isEditing,
      isValid,
      isLoading,
      handleSubmit,
    }
  },
})
</script>
