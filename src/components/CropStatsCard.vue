<template>
  <fieldset class="CropStatsCard">
    <strong>{{crop?.nickname}}</strong>
    <div class="chart">
      <div v-for="[eventId, stat] in stats" :key="eventId" :style="{ color: eventColors[eventId] }">
        <span>
          {{eventId}}:
          {{daysFromElapsed(stat.min)}} &lt;
          {{daysFromElapsed(stat.avg)}}±{{daysFromElapsed(stat.std)}}
          &lt; {{daysFromElapsed(stat.max)}}
        </span>
        <output :style="{ left: getElapsedPercentage(stat.min, stats)+'%', width: getElapsedPercentage(stat.max, stats)-getElapsedPercentage(stat.min, stats)+'%', opacity: 0.25 }" />
        <output :style="{ left: getElapsedPercentage(stat.avg, stats)+'%' }" />
        <output :style="{ left: getElapsedPercentage(stat.avg, stats)-getElapsedPercentage(stat.std, stats)/2+'%', width: getElapsedPercentage(stat.std, stats)+'%', opacity: 0.25 }" />
      </div>
      <output v-if="expectedDaysToHarvest" :style="{ left: getElapsedPercentage(expectedDaysToHarvest, stats)+'%', width: '1px', color: eventColors.harvest }" />
      <br />
    </div>

    <button @click="isShowingPlants = !isShowingPlants">{{filteredCropPlants.length}} plants</button>
    <TransitionExpand>
      <TreeView
        v-if="isShowingPlants"
        v-bind="treeView.bind"
        v-on="treeView.on"
        :nodes="nodes"
      />
    </TransitionExpand>
  </fieldset>
</template>

<script lang="ts">
import { computed, defineComponent, ref, toRefs, watch } from 'vue'
import { differenceInDays } from 'date-fns'

import { events, useCrops, usePlants, useTreeViewPicker } from '../services/data'
import { getPlantsForCropId, getStatsForPlants } from '../services/stats'
import TreeView from '../components/TreeView/TreeView.vue'
import TransitionExpand from '../components/TreeView/TransitionExpand.vue'

const eventColors = events.reduce((acc, event) => {
  acc[event.id] = event.color
  return acc
}, {} as Record<string, string>)

export default defineComponent({
  name: 'CropStatsCard',
  components: {
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

    const nodes = cropPlants
    const treeView = useTreeViewPicker(cropPlantIds, { checkable: true })

    const stats = computed(() => Object.entries(getStatsForPlants(filteredCropPlants.value))
      .sort(([a], [b]) => events.findIndex(({ id }) => id === a) - events.findIndex(({ id }) => id === b))
    )
    function daysFromElapsed(elapsed: number) {
      return differenceInDays(new Date(elapsed), new Date(0))
    }
    function getMaxForRecords(cropStats: [string, Record<string, any>][]) {
      return cropStats.reduce((acc, [_, { max }]) => Math.max(acc, max), 0)
    }
    function getElapsedPercentage(elapsed: number, cropStats: [string, Record<string, any>][]) {
      return Math.round(daysFromElapsed(elapsed) / daysFromElapsed(getMaxForRecords(cropStats)) * 100)
    }


    return {
      cropId,
      crops,
      crop,
      isShowingPlants,
      expectedDaysToHarvest,

      stats,
      daysFromElapsed,
      getMaxForRecords,
      getElapsedPercentage,
      eventColors,

      filteredCropPlants,
      nodes,
      treeView,
    }
  },
})
</script>

<style lang="scss">
.CropStatsCard {
  .chart {
    &,
    > div {
      position: relative;
    }

    output {
      position: absolute;
      top: 0;
      width: 2px;
      height: 100%;
      background-color: currentColor;
      margin-left: -1px;
    }
    &:not(:hover) {
      span {
        opacity: 0.1;
      }
    }
  }
}
</style>