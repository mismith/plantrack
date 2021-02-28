<template>
  <AddCrop v-if="isAddingCrop" style="margin: 32px;" />
  <form @submit.prevent="handleSubmit" v-bind="$attrs" class="AddPlant">
    <fieldset>
      <label>
        Crop
        <button type="button" @click="isAddingCrop = !isAddingCrop">Add Crop</button>
      </label>

      <select v-model="cropId">
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
        :state="treeState"
        :options="treeOptions"
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
import { computed, defineComponent, reactive, ref, watch } from 'vue'

import { useCrops, usePlantDataTree } from '../services/data'
import { database, ServerValue } from '../services/firebase'
import TreeView, { ITreeNode } from './TreeView.vue'
import AddCrop from './AddCrop.vue'

export default defineComponent({
  name: 'AddPlant',
  components: {
    AddCrop,
    TreeView,
  },
  setup() {
    const isAddingCrop = ref(false)

    const { nodes, beds, plants } = usePlantDataTree()
    const crops = useCrops()
    const cropId = ref(crops.value?.[0]?.id)
    const bedId = ref(beds.value?.[0]?.id)
    const name = ref()
    const placeholder = computed(() => {
      const crop = crops.value?.find((crop) => crop.id === cropId.value)
      const cropPlants = plants.value?.filter((plant) => plant.cropId === cropId.value)
      return `${crop?.name || 'Plant'}.${(cropPlants?.length || 0) + 1}`
    })

    const treeState = reactive({
      expanded: [],
      hovered: [],
      selected: [bedId.value],
      checked: [],
      renamed: [],
    })
    const treeOptions = reactive({
      indentable: true,
      expandable: true,
      // hoverable: true,
      selectable: (node: ITreeNode) => node.type === 'bed',
      // checkable: true,
      // renamable: true,
    })

    watch(treeState.selected, () => bedId.value = treeState.selected[0])

    return {
      nodes,
      treeState,
      treeOptions,

      isAddingCrop,
      crops,
      cropId,
      bedId,
      name,
      placeholder,

      handleSubmit() {
        database.ref('/users/mismith/plants').push({
          cropId: cropId.value,
          bedId: bedId.value,
          name: name.value || placeholder.value,
          createdAt: ServerValue.TIMESTAMP,
        })
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