<template>
  <form @submit.prevent="handleSubmit" class="AddPlant">
    <fieldset>
      <header>
        <label>Crop</label>
        <button type="button" :class="{ active: isAddingCrop }" @click="isAddingCrop = !isAddingCrop">Add Crop</button>
      </header>

      <select v-model="cropId" required>
        <option
          v-for="crop in crops"
          :key="crop.id"
          :value="crop.id"
        >
          {{crop.name}}: {{crop.nickname}}
        </option>
      </select>
    </fieldset>

    <fieldset>
      <label>Bed</label>
      <TreeView
        :nodes="nodes"
        v-bind="treeView.bind"
        v-on="treeView.on"
      />
    </fieldset>

    <fieldset>
      <label>Name</label>
      <input type="text" v-model="name" :placeholder="placeholder" />
    </fieldset>

    <fieldset>
      <button type="submit" :disabled="!isValid">{{isEditing ? 'Save' : 'Add'}} Plant</button>
    </fieldset>
  </form>
</template>

<script lang="ts">
import { computed, defineComponent, inject, PropType, ref, toRefs } from 'vue'

import { getSuggestedPlantName, NewEntity, Plant, UpdatedEntity, useCrops, usePlantDataTree, useTreeViewPicker } from '../services/data'
import { database, keyField, ServerValue } from '../services/firebase'
import TreeView from './TreeView/TreeView.vue'
import { ITreeNode, set, walkDescendents } from './TreeView'

export default defineComponent({
  name: 'AddPlant',
  components: {
    TreeView,
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
    const bedId = ref(plant.value?.bedId || beds.value?.[0]?.id)
    const name = ref(plant.value?.name)
    const placeholder = computed(() => getSuggestedPlantName(cropId.value, crops.value, plants.value))
    const isValid = computed(() => Boolean(cropId.value && bedId.value))

    const treeView = useTreeViewPicker(bedId, { selectable: (node: ITreeNode) => node.type === 'bed' })
    if (bedId.value) {
      // auto-expand parents above restored selections
      const checkNode = (node: ITreeNode) => {
        const containsDescendent = walkDescendents(node, checkNode).filter(Boolean).length
        if (node.id === bedId.value) {
          return true;
        } else if (containsDescendent) {
          treeView.bind.state.expanded = set(treeView.bind.state.expanded, node, true)
          return true
        }
        return false
      }
      nodes.value.forEach(checkNode)
    }

    return {
      nodes,
      treeView,

      isAddingCrop: inject('isAddingCrop'),
      crops,
      cropId,
      bedId,
      name,
      placeholder,

      isEditing,
      isValid,
      async handleSubmit() {
        if (!isValid.value) return

        if (isEditing.value && plant.value?.[keyField]) {
          const updatedPlant: UpdatedEntity<Plant> = {
            name: name.value || placeholder.value,
            cropId: cropId.value!,
            bedId: bedId.value!,
            updatedAt: ServerValue.TIMESTAMP,
          }
          await database.ref(`/users/mismith/plants/${plant.value?.[keyField]}`).update(updatedPlant)
          emit('update', updatedPlant);
        } else {
          const newPlant: NewEntity<Plant> = {
            name: name.value || placeholder.value,
            cropId: cropId.value!,
            bedId: bedId.value!,
            createdAt: ServerValue.TIMESTAMP,
          }
          database.ref('/users/mismith/plants').push(newPlant)
          emit('create', newPlant);
        }

        name.value = undefined
        cropId.value = undefined
        bedId.value = undefined
      },
    }
  },
})
</script>

<style lang="scss">
$spacing: 8px;

.AddPlant {
  fieldset > .TreeView {
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