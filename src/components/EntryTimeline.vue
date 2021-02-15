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
              relativeDate: seedEntry && new Date(seedEntry.at),
            }))
          ).join('\n')"
          :class="{ entry: true, [eventId]: true}"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { differenceInDays, addDays, formatISO, isFirstDayOfMonth, isSameDay, isToday, addWeeks, subWeeks, startOfWeek, endOfWeek, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns'

import { Bed, Entry, entryToString } from '../services/data'
import { database, useRtdbArray } from '../services/firebase'

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
  components: {
  },
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
  setup({ entries, startDate: explicitStartDate, endDate: explicitEndDate }) {
    const beds = useRtdbArray<Bed>(database.ref('/users/mismith/beds'))

    const startDate = explicitStartDate || getStartDate(entries)
    const endDate = explicitEndDate || getEndDate(entries)
    const seedEntry = getMinEntry(entries.filter(({ eventId }) => eventId === 'seed'))
    const cullEntry = getMaxEntry(entries.filter(({ eventId }) => eventId === 'cull'))

    const days = new Array(differenceInDays(endDate, startDate))
      .fill(() => true)
      .map((_, index) => {
        const date = addDays(startDate, index)
        const dayEntries = entries.filter((entry) => isSameDay(new Date(entry.at), date))
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
            isInactive: (seedEntry && isBefore(startOfDay(date), startOfDay(new Date(seedEntry.at)))) || (cullEntry && isAfter(endOfDay(date), endOfDay(new Date(cullEntry.at)))),
            hasEntry: dayEntries.length,
          },
        }
      })

    return {
      days,
      seedEntry,
      cullEntry,

      beds,
      entryToString,
    }
  },
})
</script>

<style lang="scss">
$spacing: 8px;

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

        &.seed {
          background-color: rgb(255, 234, 116);
        }
        &.sprout {
          background-color: rgb(200, 255, 0);
        }
        &.transplant {
          background-color: rgb(167, 255, 255);
        }
        &.harvest {
          background-color: rgb(0, 200, 0);
        }
        &.cull {
          background-color: red;
        }
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