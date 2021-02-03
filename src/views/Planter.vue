<template>
  <div class="Planter">
    <TreeView
      :nodes="nodes"
      :state="treeState"
      :options="treeOptions"
    >
      <template #node-after="{ node, state }">
        <ol v-if="node.type === 'bed'" :style="`padding-left: ${(state.indent + 2) * 25}px`">
          <li v-for="plant in getPlantsInBed(node.id, data)" :key="plant.id">
            {{plant}}

            <select v-model="newBedId">
              <optgroup
                v-for="plot in nodes"
                :key="plot.id"
                :label="plot.name || plot.id"
              >
                <option
                  v-for="bed in plot.children"
                  :key="bed.id"
                  :value="bed.id"
                  :disabled="bed.id === node.id"
                >
                  {{bed.name || bed.id}}
                </option>
              </optgroup>
            </select>
            <button :disabled="!newBedId" @click="handleMove(node.id, plant.id)">
              Move
            </button>

            <button @click="handleRemove(node.id, plant.id)">Remove</button>
          </li>
          <li>
            <select v-model="newCropId">
              <option
                v-for="crop in data.crops"
                :key="crop.id"
                :value="crop.id"
              >
                {{crop.id}}: {{crop.name}}
              </option>
            </select>
            <button :disabled="!newCropId" @click="handleAdd(node.id)">
              Add Plant
            </button>
          </li>
        </ol>
      </template>
    </TreeView>

    <pre>{{data.records}}</pre>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref } from 'vue'

import data from '../data'
import { getPlantsInBed, addPlant, movePlant, removePlant } from '../services/plants'
import TreeView from '../components/TreeView.vue'

export default defineComponent({
  name: 'Planter',
  components: {
    TreeView,
  },
  setup() {
    const nodes = data.plots.map((plot) => ({
      type: 'plot',
      children: data.beds.filter(({ plotId }) => plotId === plot.id).map((bed) => ({
        type: 'bed',
        ...bed,
      })),
      ...plot,
    }))
    const treeState = reactive({
      expanded: [],
      checked: [],
      renamed: [],
      selected: [],
    })
    const treeOptions = reactive({
      // hoverable: true,
      indentable: true,
      expandable: true,
      // selectable: true,
      checkable: {
        recurse: true, // (node: ITreeNode) => Boolean(node.children?.length),
      },
      // renamable: true,
    })

    const newCropId = ref()
    const newBedId = ref()

    return {
      data,
      nodes,
      treeState,
      treeOptions,
      getPlantsInBed,

      newCropId,
      handleAdd(bedId: string) {
        addPlant({ bedId, cropId: newCropId.value }, data)
      },
      newBedId,
      handleMove(prevBedId: string, plantId: string) {
        movePlant(plantId, { prevBedId, bedId: newBedId.value }, data)
      },
      handleRemove(bedId: string, plantId: string) {
        removePlant(plantId, { bedId }, data)
      },
    }
  },
})
</script>

<style lang="scss">
$spacing: 8px;

.Planter {
}
</style>