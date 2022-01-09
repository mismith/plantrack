<template>
  <form @submit.prevent="handleSubmit" class="AddPlot">
    <div class="Box-body">
      <fieldset class="form-group required">
        <header class="form-group-header">
          <label>Name</label>
        </header>
        <input type="text" v-model="name" required class="form-control width-full" />
      </fieldset>
      <fieldset class="form-group">
        <header class="form-group-header">
          <label>Parent Plot</label>
        </header>
        <TreeViewSelectMenu
          v-model="isParentPlotIdsSelectOpen"
          :value="plots?.find(({ id }) => id === parentPlotIds?.[0])?.name || ''"
          clearable
          @clear="parentPlotIds = []"
        >
          <PlantTreeView
            v-model="parentPlotIds"
            :filter="node => node.type !== 'entry'"
            selectable-type="plot"
          />
        </TreeViewSelectMenu>
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
import TreeViewSelectMenu from './TreeViewSelectMenu.vue'
import PlantTreeView from './PlantTreeView.vue'

export default defineComponent({
  name: 'AddPlot',
  components: {
    Button,
    TreeViewSelectMenu,
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

    const isParentPlotIdsSelectOpen = ref(false)
    watch(parentPlotIds, (v) => {
      if (v.length) {
        isParentPlotIdsSelectOpen.value = false
      }
    })

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
          await database.ref(getUserRefPath('/plots')).push(newPlot)
          emit('create', newPlot)
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
      isParentPlotIdsSelectOpen,
      plots: plots.value?.filter((p) => p[keyField] !== plot.value?.[keyField]),

      isEditing,
      isValid,
      isLoading,
      handleSubmit,
    }
  },
})
</script>
