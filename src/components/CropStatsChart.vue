<template>
  <div class="CropStatsChart">
    <div v-for="[eventId, stat] in stats" :key="eventId" :style="{ color: eventColors[eventId] }">
      <span v-if="detailed">
        {{eventId}}:
        {{daysFromElapsed(stat.min)}} &lt;
        {{daysFromElapsed(stat.avg)}}±{{daysFromElapsed(stat.std)}}
        &lt; {{daysFromElapsed(stat.max)}}
        <small>(n={{stat.records.length}})</small>
      </span>
      <output :style="{ left: getElapsedPercentage(stat.min, stats)+'%', width: getElapsedPercentage(stat.max, stats)-getElapsedPercentage(stat.min, stats)+'%', opacity: 0.25 }" />
      <output :style="{ left: getElapsedPercentage(stat.avg, stats)+'%' }" />
      <output :style="{ left: getElapsedPercentage(stat.avg, stats)-getElapsedPercentage(stat.std, stats)/2+'%', width: getElapsedPercentage(stat.std, stats)+'%', opacity: 0.25 }" />
    </div>
    <output v-if="expectedDaysToHarvest" :style="{ left: getElapsedPercentage(expectedDaysToHarvest, stats)+'%', width: '1px', color: eventColors.harvest }" />
  </div>
</template>

<script lang="ts">
import { defineComponent, toRefs } from 'vue'
import { differenceInDays } from 'date-fns'

import { events } from '../services/data'

const eventColors = events.reduce((acc, event) => {
  acc[event.id] = event.color
  return acc
}, {} as Record<string, string>)

export default defineComponent({
  name: 'CropStatsChart',
  props: {
    stats: {
      type: Object,
      required: true,
    },
    expectedDaysToHarvest: {
      type: Number,
      required: false,
    },
    detailed: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
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
      daysFromElapsed,
      getMaxForRecords,
      getElapsedPercentage,
      eventColors,
    }
  },
})
</script>

<style lang="scss">
.CropStatsChart {
  padding-left: 1px;
  padding-right: 1px;

  &,
  > div {
    position: relative;
    min-height: 4px;
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
</style>