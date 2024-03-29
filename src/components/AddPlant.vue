<template>
  <form @submit.prevent="handleSubmit" class="AddPlant">
    <div class="Box-body">
      <fieldset class="form-group required">
        <header class="form-group-header">
          <label>Crop</label>
        </header>
        <SelectMenu
          :value="crops?.find(({ id }) => id === cropIds?.[0])?.name || ''"
          title="Crops"
          createable
          createable-type="crop"
          editable
          @create="handleCropCreate"
        >
          <template #header v-if="!crops?.length"><div /></template>
          <template #default="{ edit, close }">
            <CropTreeView
              v-if="crops?.length"
              v-model="cropIds"
              :editable="edit()"
              @update:model-value="close()"
            />
          </template>
        </SelectMenu>
      </fieldset>

      <fieldset class="form-group required">
        <header class="form-group-header">
          <label>Bed</label>
        </header>
        <SelectMenu
          :value="beds?.find(({ id }) => id === bedIds?.[0])?.name || ''"
          title="Beds"
          createable
          createable-type="bed"
          editable
          @create="handleBedCreate"
        >
          <template #header v-if="!beds?.length"><div /></template>
          <template #default="{ edit, close }">
            <PlantTreeView
              v-if="beds?.length"
              v-model="bedIds"
              :filter="node => node.type !== 'entry'"
              :editable="edit()"
              @update:model-value="close()"
            />
          </template>
        </SelectMenu>
      </fieldset>

      <fieldset class="form-group">
        <header class="form-group-header">
          <label>Name</label>
        </header>
        <input type="text" v-model="name" :placeholder="placeholder" class="form-control width-full" />
      </fieldset>
    </div>

    <footer class="Box-footer">
      <Button type="submit" :disabled="!isValid" :loading="isLoading" class="btn-primary btn-block">
        {{isEditing ? 'Save' : 'Add'}} Plant
      </Button>
    </footer>
  </form>
</template>

<script lang="ts">
import { computed, defineComponent, inject, PropType, Ref, ref, toRefs } from 'vue'

import { Bed, Crop, getSuggestedPlantName, NewEntity, Plant, UpdatedEntity, useCrops, usePlantDataTree } from '../services/data'
import { database, getUserRefPath, keyField, ServerValue } from '../services/firebase'
import { useAsyncWrapper } from '../services/errors'

import Button from './Button.vue'
import SelectMenu from './SelectMenu.vue'
import PlantTreeView from './PlantTreeView.vue'
import Octicon from './Octicon.vue'
import CropTreeView from './CropTreeView.vue'

export default defineComponent({
  name: 'AddPlant',
  components: {
    Button,
    SelectMenu,
    CropTreeView,
    PlantTreeView,
    Octicon,
  },
  props: {
    plant: {
      type: Object as PropType<Plant>,
      required: false,
    },
  },
  setup(props, { emit }) {
    const { plant } = toRefs(props)
    const isEditing = computed(() => Boolean(plant.value))

    const { nodes, beds, plants } = usePlantDataTree()

    const [crops] = useCrops()
    const cropIds = ref([plant.value?.cropId || crops.value?.[0]?.id].filter(Boolean) as string[])
    const isAddingCrop = inject<Ref>('isAddingCrop')!
    function handleCropCreate() {
      isAddingCrop.value = (newCrop: Crop) => {
        cropIds.value = [newCrop.id]
        isAddingCrop.value = false
      }
    }

    const bedIds = ref([plant.value?.bedId || beds.value?.[0]?.id].filter(Boolean) as string[])
    const name = ref(plant.value?.name)
    const placeholder = computed(() => getSuggestedPlantName(cropIds.value?.[0], crops.value, plants.value))
    const isValid = computed(() => Boolean(cropIds.value?.[0] && bedIds.value?.[0]))

    const isAddingBed = inject<Ref>('isAddingBed')!
    function handleBedCreate() {
      isAddingBed.value = (newBed: Bed) => {
        bedIds.value = [newBed.id]
        isAddingBed.value = false
      }
    }

    const toast = inject<Function>('toast')
    const [runAsync, isLoading] = useAsyncWrapper()
    async function handleSubmit() {
      if (!isValid.value) return

      await runAsync(async () => {
        if (isEditing.value && plant.value?.[keyField]) {
          const updatedPlant: UpdatedEntity<Plant> = {
            name: name.value || placeholder.value,
            cropId: cropIds.value[0]!,
            bedId: bedIds.value[0]!,
            updatedAt: ServerValue.TIMESTAMP,
          }
          await database.ref(getUserRefPath(`/plants/${plant.value?.[keyField]}`)).update(updatedPlant)
          emit('update', updatedPlant)
          toast?.('Plant saved successfully', 'success')
        } else {
          const newPlant: NewEntity<Plant> = {
            name: name.value || placeholder.value,
            cropId: cropIds.value[0]!,
            bedId: bedIds.value[0]!,
            createdAt: ServerValue.TIMESTAMP,
          }
          const plantId = (await database.ref(getUserRefPath('/plants')).push(newPlant)).key
          emit('create', { [keyField]: plantId, ...newPlant })
          toast?.('Plant added successfully', 'success')
        }
      })

      name.value = undefined
      // let linger to ease batch additions
      // cropId.value = undefined
      // bedIds.value = []
    }

    return {
      nodes,

      crops,
      cropIds,
      isAddingCrop,
      handleCropCreate,

      beds,
      isAddingBed,
      handleBedCreate,

      bedIds,
      name,
      placeholder,

      isEditing,
      isValid,
      isLoading,
      handleSubmit,
    }
  },
})
</script>

<style lang="scss">
.AddPlant {
  .TreeView {
    .TreeNode {
      > .TreeNodeLeaf {
        &:not(.selectable) {
          .TreeNodeName {
            opacity: 0.5;
          }
        }
      }
    }
  }
}
</style>
