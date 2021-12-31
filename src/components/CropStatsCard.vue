<template>
  <fieldset class="CropStatsCard">
    <strong>{{crop?.nickname}}</strong>
    <CropStatsChart :stats="stats" :expected-days-to-harvest="expectedDaysToHarvest" detailed />

    <button @click="isShowingPlants = !isShowingPlants">{{filteredCropPlants.length}} plants</button>
    <TransitionExpand>
      <TreeView
        v-if="isShowingPlants"
        v-bind="treeView.bind"
        v-on="treeView.on"
        :nodes="nodes"
      >
        <template #node-append="{ node }">
          <CropStatsChart :stats="getCropPlantStats(node)" style="flex: auto;" />
        </template>
      </TreeView>
    </TransitionExpand>
  </fieldset>
</template>

<script lang="ts">
import { computed, defineComponent, ref, toRefs, watch } from 'vue'

import { events, Plant, useCrops, usePlants, useTreeViewPicker } from '../services/data'
import { getPlantsForCropId, getStatsForPlants } from '../services/stats'
import CropStatsChart from '../components/CropStatsChart.vue'
import TreeView from '../components/TreeView/TreeView.vue'
import TransitionExpand from '../components/TreeView/TransitionExpand.vue'

export default defineComponent({
  name: 'CropStatsCard',
  components: {
    CropStatsChart,
    TreeView,
    TransitionExpand,
  },
  props: {
    cropId: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { cropId } = toRefs(props)
    const crops = useCrops()
    const crop = computed(() => crops.value?.find(({ id }) => id === cropId.value))
    const isShowingPlants = ref(false)
    const expectedDaysToHarvest = computed(() => {
      const { daysToHarvest } = crop.value || {};
      if (daysToHarvest) {
        const [_, min, max] = /^(\d+)\s*-\s*(\d+)$/.exec(String(daysToHarvest)) as any || []
        if (min && max) {
          return Math.round((Number(min) + Number(max)) / 2) * 1000*60*60*24
        }
        return Number(daysToHarvest) * 1000*60*60*24
      }
      return undefined
    })

    const plants = usePlants()
    const cropPlantIds = ref<string[]>([])
    const cropPlants = computed(() => getPlantsForCropId(cropId.value, plants.value || []))
    watch(cropPlants, () => {
      cropPlantIds.value = cropPlants.value.map(({ id }) => id)
    }, { immediate: true })
    const filteredCropPlants = computed(() => cropPlantIds.value.length ? cropPlants.value?.filter(({ id }) => cropPlantIds.value.includes(id)) : cropPlants.value)

    const stats = computed(() => Object.entries(getStatsForPlants(filteredCropPlants.value))
      .sort(([a], [b]) => events.findIndex(({ id }) => id === a) - events.findIndex(({ id }) => id === b))
    )
    function getCropPlantStats(plant: Plant) {
      return Object.entries(getStatsForPlants([plant]))
        .sort(([a], [b]) => events.findIndex(({ id }) => id === a) - events.findIndex(({ id }) => id === b))
    }

    const nodes = cropPlants
    const treeView = useTreeViewPicker(cropPlantIds, { checkable: true })

    return {
      cropId,
      crops,
      crop,
      isShowingPlants,

      expectedDaysToHarvest,
      stats,
      getCropPlantStats,

      filteredCropPlants,
      nodes,
      treeView,
    }
  },
})
</script>
