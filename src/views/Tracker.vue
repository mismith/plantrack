<template>
  <div class="Tracker">
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
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { differenceInDays } from 'date-fns'
import { computed, defineComponent } from 'vue'

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

    const nodes = computed(() => crops.value?.map((crop) => {
      const cropPlants = plants.value
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
        }) || []
      
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
    }))

    const allEntries = computed(() => nodes.value?.reduce(
      (acc, node) => acc.concat(...Object.values(node.$entryGroups) as any),
      [],
    ))
    const startDate = computed(() => getStartDate(allEntries.value || []))
    const endDate = computed(() => getEndDate(allEntries.value || []))

    return {
      nodes,
      beds,
      crops,
      plants,

      startDate,
      endDate,

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