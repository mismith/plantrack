<template>
  <form @submit.prevent="handleSubmit" class="AddPlant">
    <div class="Box-body">
      <fieldset class="form-group required">
        <header class="form-group-header">
          <label>Crop</label>

          <button type="button" class="btn btn-sm" :class="{ active: isAddingCrop }" @click="isAddingCrop = !isAddingCrop">Add Crop</button>
        </header>

        <select v-model="cropId" required class="form-control form-select width-full">
          <option
            v-for="crop in crops"
            :key="crop.id"
            :value="crop.id"
          >
            {{crop.name}}: {{crop.nickname}}
          </option>
        </select>
      </fieldset>

      <fieldset class="form-group required">
        <header class="form-group-header">
          <label>Bed</label>
        </header>
        <TreeViewSelectMenu
          v-model="isBedIdsSelectOpen"
          :value="beds?.find(({ id }) => id === bedIds?.[0])?.name || ''"
        >
          <PlantTreeView
            v-model="bedIds"
            :filter="node => node.type !== 'entry'"
          />
        </TreeViewSelectMenu>
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
import { computed, defineComponent, inject, PropType, ref, toRefs, watch } from 'vue'

import { getSuggestedPlantName, NewEntity, Plant, UpdatedEntity, useCrops, usePlantDataTree } from '../services/data'
import { database, getUserRefPath, keyField, ServerValue } from '../services/firebase'
import { useAsyncWrapper } from '../services/errors'

import Button from './Button.vue'
import TreeViewSelectMenu from './TreeViewSelectMenu.vue'
import PlantTreeView from './PlantTreeView.vue'

export default defineComponent({
  name: 'AddPlant',
  components: {
    Button,
    TreeViewSelectMenu,
    PlantTreeView,
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
    const crops = useCrops()
    const cropId = ref(plant.value?.cropId || crops.value?.[0]?.id)
    const bedIds = ref([plant.value?.bedId || beds.value?.[0]?.id].filter(Boolean))
    const name = ref(plant.value?.name)
    const placeholder = computed(() => getSuggestedPlantName(cropId.value, crops.value, plants.value))
    const isValid = computed(() => Boolean(cropId.value && bedIds.value?.[0]))

    const isBedIdsSelectOpen = ref(false)
    watch(bedIds, (v) => {
      if (v.length) {
        isBedIdsSelectOpen.value = false
      }
    })

    const toast = inject<Function>('toast')
    const [runAsync, isLoading] = useAsyncWrapper()
    async function handleSubmit() {
      if (!isValid.value) return

      await runAsync(async () => {
        if (isEditing.value && plant.value?.[keyField]) {
          const updatedPlant: UpdatedEntity<Plant> = {
            name: name.value || placeholder.value,
            cropId: cropId.value!,
            bedId: bedIds.value[0]!,
            updatedAt: ServerValue.TIMESTAMP,
          }
          await database.ref(getUserRefPath(`/plants/${plant.value?.[keyField]}`)).update(updatedPlant)
          emit('update', updatedPlant);
          toast?.('Plant saved successfully', 'success')
        } else {
          const newPlant: NewEntity<Plant> = {
            name: name.value || placeholder.value,
            cropId: cropId.value!,
            bedId: bedIds.value[0]!,
            createdAt: ServerValue.TIMESTAMP,
          }
          database.ref(getUserRefPath('/plants')).push(newPlant)
          emit('create', newPlant);
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
      beds,
      isBedIdsSelectOpen,

      isAddingCrop: inject('isAddingCrop'),
      crops,
      cropId,
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