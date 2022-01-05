<template>
  <div class="EntryTimeline">
    <div
      v-for="day in days"
      :key="day.number"
      :title="day.name"
      :class="day.classes"
    >
      <div class="entries">
        <div
          v-for="(_, eventId) in day.eventIds"
          :key="eventId"
          :title="[day.name].concat(...day.entries
            .filter((entry) => entry.eventId === eventId)
            .map(entry => entryToString(entry, {
              beds,
              plants,
              relativeDate: seedEntry && new Date(seedEntry.at),
            }))
          ).join('\n')"
          :class="{ entry: true, [eventId]: true }"
          :style="`background-color: ${events.find(({ id }) => id === eventId)?.color}`"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, toRefs } from 'vue'
import { differenceInDays, addDays, formatISO, isFirstDayOfMonth, isSameDay, isToday, addWeeks, subWeeks, startOfWeek, endOfWeek, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns'

import { Entry, entryToString, events, useBeds, usePlants } from '../services/data'

export function getMinEntry(entries: Entry[], initial = {} as Pick<Entry, 'at'>) {
  const min = entries.reduce((acc, entry) => {
    if (!acc.at || entry.at < acc.at) return entry
    return acc
  }, initial)
  return min
}
export function getMaxEntry(entries: Entry[], initial = {} as Pick<Entry, 'at'>) {
  const max = entries.reduce((acc, entry) => {
    if (!acc.at || entry.at > acc.at) return entry
    return acc
  }, initial)
  return max
}
export function getStartDate(entries: Entry[], snapToWeek = true) {
  const min = getMinEntry(entries, { at: Date.now() })
  const minDate = new Date(min?.at)
  const startDate = snapToWeek ? startOfWeek(subWeeks(minDate, 1)) : minDate
  return startDate
}
export function getEndDate(entries: Entry[], snapToWeek = true) {
  const max = getMaxEntry(entries, { at: Date.now() })
  const maxDate = new Date(max?.at)
  const endDate = snapToWeek ? endOfWeek(addWeeks(maxDate, 1)) : maxDate
  return endDate
}

export default defineComponent({
  name: 'EntryTimeline',
  props: {
    entries: {
      type: Array as PropType<Entry[]>,
      required: true,
    },
    startDate: {
      type: Date as PropType<Date>,
    },
    endDate: {
      type: Date as PropType<Date>,
    },
  },
  setup(props) {
    const { entries, startDate: explicitStartDate, endDate: explicitEndDate } = toRefs(props)
    const beds = useBeds()
    const plants = usePlants()

    const startDate = computed(() => explicitStartDate?.value || getStartDate(entries.value))
    const endDate = computed(() => explicitEndDate?.value || getEndDate(entries.value))
    const seedEntry = computed(
      () => getMinEntry(entries.value.filter(({ eventId }) => eventId === 'seed'))
    )
    const cullEntry = computed(
      () => getMaxEntry(entries.value.filter(({ eventId }) => eventId === 'cull'))
    )

    const days = computed(() => new Array(differenceInDays(endDate.value, startDate.value))
      .fill(() => true)
      .map((_, index) => {
        const date = addDays(startDate.value, index)
        const dayEntries = entries.value.filter((entry) => isSameDay(new Date(entry.at), date))
        const eventIds = dayEntries.reduce(
          (acc, entry) => {
            acc[entry.eventId] = true
            return acc
          },
          {} as Record<string, boolean>,
        )

        return {
          number: index + 1,
          name: formatISO(date, { representation: 'date' }),
          date,
          entries: dayEntries,
          eventIds,
          classes: {
            isFirstDayOfMonth: isFirstDayOfMonth(date),
            isToday: isToday(date),
            isInactive: (
              seedEntry && isBefore(startOfDay(date), startOfDay(new Date(seedEntry.value.at))))
              || (cullEntry && isAfter(endOfDay(date), endOfDay(new Date(cullEntry.value.at)))
            ),
            hasEntry: dayEntries.length,
          },
        }
      }))

    return {
      days,
      seedEntry,
      cullEntry,
      events,

      beds,
      plants,
      entryToString,
    }
  },
})
</script>

<style lang="scss">
.EntryTimeline {
  display: flex;
  width: 100%;
  height: 100%;

  > div {
    display: flex;
    flex: auto;
    position: relative;

    .entries {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;

      .entry {
        flex: auto;
      }
    }

    &::after {
      content: "";
      display: inline-block;
      width: 100%;
      vertical-align: middle;
      padding-top: calc(100% + 1px);
      pointer-events: none;
    }
    &.isToday {
      border-right: solid 3px blue;
    }
    &.isInactive {
      background-color: rgba(0, 0, 0, 0.15);
    }
    &.hasEntry {
      background-color: currentColor;
    }

    &:hover {
      &::after {
        background-color: currentColor;
        opacity: 0.25;
      }
    }
  }
}
</style>