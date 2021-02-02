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
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, toRefs } from 'vue'

import dataRaw from '../data'
import TreeView from '../components/TreeView.vue'

function getPlantsInBed(bedId: string, data: any) {
  const bedRecords = data.records.filter(
    (record: any) => record.payload?.bedId === bedId || record.payload?.oldBedId === bedId
  )
  const plantMap = bedRecords.reduce((acc: any, record: any) => {
    switch (record.eventId) {
      case 'seed': {
        acc[record.payload.plantId] = true
        break
      }
      case 'transplant': {
        acc[record.payload.plantId] = record.payload.bedId === bedId
        break
      }
      case 'cull': {
        acc[record.payload.plantId] = false
        break
      }
      default: {
        break
      }
    }
    return acc;
  }, {})
  const plantIds = Object.entries(plantMap).filter(([, v]) => v).map(([k]) => k)
  const plants = data.plants.filter(({ id }: any) => plantIds.includes(id))
  return plants
};
function addPlant({ bedId, cropId }: any, data: any) {
  const id = `plant-${Math.random().toString().slice(2)}`
  data.plants.push({
    id,
    cropId,
  })
  data.records.push({
    id: `record-${Math.random().toString().slice(2)}`,
    eventId: 'seed',
    payload: {
      bedId,
      plantId: id,
    },
  })
}
function movePlant({ oldBedId, bedId, plantId }: any, data: any) {
  data.records.push({
    id: `record-${Math.random().toString().slice(2)}`,
    eventId: 'transplant',
    payload: {
      oldBedId,
      bedId,
      plantId,
    },
  })
}
function removePlant({ bedId, plantId }: any, data: any) {
  data.records.push({
    id: `record-${Math.random().toString().slice(2)}`,
    eventId: 'cull',
    payload: {
      bedId,
      plantId,
    },
  })
}

export default defineComponent({
  name: 'Planter',
  components: {
    TreeView,
  },
  setup() {
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
      // checkable: true,
      checkableRecurses: true,
      // renamable: true,
    })

    const data = reactive(dataRaw)
    const { plots, beds } = data
    const nodes = plots.map((plot) => ({
      type: 'plot',
      children: beds.filter(({ plotId }) => plotId === plot.id).map((bed) => ({
        type: 'bed',
        // children: crops?.map(({ ...plant }) => ({
        //   ...plant,
        //   type: 'plant',
        //   id: Math.random(),
        // })),
        ...bed,
      })),
      ...plot,
    }));
    const newBedId = ref()
    const newCropId = ref()

    return {

      data,
      nodes,
      treeState,
      treeOptions,
      getPlantsInBed,

      newBedId,
      newCropId,
      handleAdd(bedId: string) {
        addPlant({ bedId, cropId: newCropId.value }, data)
      },
      handleMove(oldBedId: string, plantId: string) {
        movePlant({ oldBedId, plantId, bedId: newBedId.value }, data)
      },
      handleRemove(bedId: string, plantId: string) {
        removePlant({ bedId, plantId }, data)
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