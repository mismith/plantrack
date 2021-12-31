<template>
  <form @submit.prevent="handleSubmit" v-bind="$attrs" class="AddPlant">
    <fieldset>
      <label>
        Crop
        <button type="button" :class="{ active: isAddingCrop }" @click="isAddingCrop = !isAddingCrop">Add Crop</button>
      </label>

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
      <button type="submit" :disabled="!cropId || !bedId">Add Plant</button>
    </fieldset>
  </form>
</template>

<script lang="ts">
import { computed, defineComponent, inject, ref } from 'vue'

import { getSuggestedPlantName, NewEntity, Plant, useCrops, usePlantDataTree, useTreeViewPicker } from '../services/data'
import { database, ServerValue } from '../services/firebase'
import TreeView from './TreeView/TreeView.vue'
import { ITreeNode } from './TreeView'

export default defineComponent({
  name: 'AddPlant',
  components: {
    TreeView,
  },
  setup() {
    const { nodes, beds, plants } = usePlantDataTree()
    const crops = useCrops()
    const cropId = ref(crops.value?.[0]?.id)
    const bedId = ref(beds.value?.[0]?.id)
    const name = ref()
    const placeholder = computed(() => getSuggestedPlantName(cropId.value, crops.value, plants.value))

    const treeView = useTreeViewPicker(bedId, { selectable: (node: ITreeNode) => node.type === 'bed' })

    return {
      nodes,
      treeView,

      isAddingCrop: inject('isAddingCrop'),
      crops,
      cropId,
      bedId,
      name,
      placeholder,

      handleSubmit() {
        if (!cropId.value || !bedId.value) return

        const newPlant: NewEntity<Plant> = {
          name: name.value || placeholder.value,
          cropId: cropId.value,
          bedId: bedId.value,
          createdAt: ServerValue.TIMESTAMP,
          entries: null, // @TODO: this shouldn't be necessary
        }
        database.ref('/users/mismith/plants').push(newPlant)
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