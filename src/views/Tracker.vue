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
        <div :title="crop.nickname">{{crop.name}}</div>
        <div>
          <template
            v-for="plant in crop.$plants"
            :key="plant.id"
          >
            <div class="bed">
              {{plant.bedId ? beds.find(({ id }) => id === plant.bedId)?.name : 'Culled'}}
            </div>
            <EntryTimeline
              :entries="Object.values(plant.entries || {})"
              :startDate="startDate"
              :endDate="endDate"
            />
          </template>
        </div>
        <!-- <dl v-for="(entries, eventId) in crop.$entryGroups" :key="eventId">
          <dt>{{eventId}} <small>({{entries.length}})</small></dt>
          <template v-if="eventId === 'seed'" />
          <dd v-else-if="eventId === 'sprout'">
            Average days to sprout:
            {{averageDaysSinceSeed(crop, 'sprout')}}
          </dd>
          <dd v-else-if="eventId === 'harvest'">
            Total harvested:
            {{entries.reduce((acc, entry) => acc + entry.payload?.weight?.value || 0, 0)}}
            {{entries[0]?.payload?.weight?.unit}}
          </dd>
        </dl> -->
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { differenceInDays, format, parse } from 'date-fns'

import { Bed, Crop, Plant } from '../services/data'
import { database, useRtdbArray } from '../services/firebase'
import EntryTimeline, { getEndDate, getStartDate } from '../components/EntryTimeline.vue'

export default defineComponent({
  name: 'Tracker',
  components: {
    EntryTimeline,
  },
  setup() {
    const beds = useRtdbArray<Bed>(database.ref('/users/mismith/beds'))
    const crops = useRtdbArray<Crop>(database.ref('/users/mismith/crops'))
    const plants = useRtdbArray<Plant>(database.ref('/users/mismith/plants'))

    const showOnlyActive = ref(false)
  
    const nodes = computed(
      () => crops.value?.map((crop) => {
        const cropPlants = (
          plants.value
            ?.filter(({ cropId }) => crop.id === cropId)
            .map((plant) => {
              const entryGroups = Object.values(plant.entries || {}).reduce(
                (acc, entry) => {
                  acc[entry.eventId] = (acc[entry.eventId] || []).concat(entry)
                  return acc
                },
                {} as any,
              )
              return {
                ...plant,
                $entryGroups: entryGroups,
              }
            })
            .filter((plant) => !showOnlyActive.value || plant.bedId)
        ) || []
        
        return {
          ...crop,
          $plants: cropPlants,
          $entryGroups: cropPlants.reduce(
            (acc, cropPlant) => {
              Object.entries(cropPlant.$entryGroups).forEach(([eventId, entries]) => {
                acc[eventId] = (acc[eventId] || []).concat(entries)
              })
              return acc
            },
            {} as any,
          ),
        }
      })
        .filter((node) => !showOnlyActive.value || node.$plants.length)
    )

    const allEntries = computed(() => nodes.value?.reduce(
      (acc, node) => acc.concat(...Object.values(node.$entryGroups) as any),
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
      averageDaysSinceSeed(plant: Plant, eventId: string) {
        const entries = Object.values(plant.entries || {})
        const seedEntry = entries.find(entry => entry.eventId === 'seed')
        // const created = Object.values(plant.entries || {}).find(entry => entry.eventId === 'seed')
        // console.log(seedEntry)
        const startDate = new Date(seedEntry?.at || plant.createdAt)

        const eventEntries = entries.filter(entry => entry.eventId === eventId)
        const diffs = eventEntries.map(entry => differenceInDays(new Date(entry.at), startDate))

        return diffs.length ? diffs.reduce((acc, diff) => acc + diff, 0) / diffs.length : 0
      },
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
      margin: $spacing / 2;
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

  dl {
    margin-left: $spacing * 2;
    
    dd {
      margin-left: $spacing * 2;
    }
  }
}
</style>