<template>
  <div class="Tracker">
    <header>
      <label>
        Start Date
        <input
          type="date"
          :value="format(startDate, 'yyyy-MM-dd')"
          @input="e => explicitStartDate = parse(e.target.value, 'yyyy-MM-dd', new Date())"
        />
      </label>
      <label>
        End Date
        <input
          type="date"
          :value="format(endDate, 'yyyy-MM-dd')"
          @input="e => explicitEndDate = parse(e.target.value, 'yyyy-MM-dd', new Date())"
        />
      </label>
      <label>
        <input type="checkbox" v-model="showOnlyActive" />
        Show Only Active Plants
      </label>
    </header>
    <div class="table">
      <div v-for="crop in nodes" :key="crop.id">
        <div :title="`${crop.nickname}\n${getStatsStringForPlants(crop.$plants)}`">
          {{crop.name}}
        </div>
        <div>
          <template
            v-for="plant in crop.$plants"
            :key="plant.id"
          >
            <div :title="plant.name" class="bed">
              {{plant.bedId ? beds.find(({ id }) => id === plant.bedId)?.name : 'Inactive'}}
            </div>
            <EntryTimeline
              :entries="Object.values(plant.entries || {})"
              :startDate="startDate"
              :endDate="endDate"
            />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { format, parse } from 'date-fns'

import { useBeds, useCrops, usePlants } from '../services/data'
import { getEventGroupsForPlants, getPlantsForCropId, getStatsStringForPlants } from '../services/stats'
import EntryTimeline, { getEndDate, getStartDate } from '../components/EntryTimeline.vue'

export default defineComponent({
  name: 'Tracker',
  components: {
    EntryTimeline,
  },
  setup() {
    const beds = useBeds()
    const plants = usePlants()
    const crops = useCrops()

    const showOnlyActive = ref(false)
  
    const nodes = computed(
      () => crops.value?.map((crop) => {
        const cropPlants = getPlantsForCropId(crop.id, plants.value || [])
          .filter((plant) => !showOnlyActive.value || plant.bedId)
        
        return {
          ...crop,
          $plants: cropPlants,
          $eventGroups: getEventGroupsForPlants(cropPlants),
        }
      })
        .filter((node) => !showOnlyActive.value || node.$plants.length)
    )

    const allEntries = computed(() => nodes.value?.reduce(
      (acc, node) => acc.concat(...Object.values(node.$eventGroups) as any),
      [],
    ))
    const explicitStartDate = ref<Date>()
    const explicitEndDate = ref<Date>()
    const defaultStartDate = computed(() => getStartDate(allEntries.value || []))
    const defaultEndDate = computed(() => getEndDate(allEntries.value || []))
    const startDate = computed(() => explicitStartDate.value || defaultStartDate.value)
    const endDate = computed(() => explicitEndDate.value || defaultEndDate.value)

    return {
      nodes,
      beds,
      crops,
      plants,

      showOnlyActive,
      startDate,
      endDate,
      explicitStartDate,
      explicitEndDate,
      format,
      parse,

      getStatsStringForPlants,
    }
  },
})
</script>

<style lang="scss">
$spacing: 8px;

.Tracker {
  > header {
    display: flex;
    justify-content: space-between;
    border-bottom: solid 1px currentColor;

    label {
      display: inline-block;
      margin: $spacing * 0.5;
    }
  }

  .table {
    display: table;

    > * {
      display: table-row;

      > * {
        display: table-cell;
        font-size: 1vw;
        vertical-align: middle;
        border-bottom: solid 1px currentColor;

        &:first-child {
          width: 1%;
          padding: 0 $spacing;
        }

        .bed {
          position: absolute;
          // right: 0;
          z-index: 2;
        }

        > .EntryTimeline {
          > div {
            border-left: inset 0.5px currentColor;

            &.isFirstDayOfMonth {
              border-left-style: solid;
            }
          }
          &:not(:last-child) {
            border-bottom: outset 0.5px currentColor;
          }
        }
      }
    }
  }
}
</style>