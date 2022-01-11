<template>
  <div class="Plotter">
    <header>
      <nav>
        <!-- <button>&slarr;</button> -->
        <button @click.prevent="handleGroupAlignTop" :disabled="!isGrouped">Align Top</button>
        <button @click.prevent="handleGroupAlignLeft" :disabled="!isGrouped">Align Left</button>
        <div>
          <h1>
            <template v-if="isGrouped">{{ groupedBeds.map(({ name }) => name).join(', ') }}</template>
            <template v-else>{{ selectedBed?.name }}</template>
          </h1>
          <h2>{{ selectedBedPlot?.name }}</h2>
        </div>
        <input type="range" v-model="scale" min="1" max="100" class="d-none d-sm-inline-block" />
        <input type="number" v-model="scale" min="1" max="100" class="form-control" />
        <!-- <button :disabled="!selectedBedPlot">&#8505;</button> -->
      </nav>
    </header>

    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern
          id="minorGridlines" 
          v-if="gridlineSettings.minor"
          :width="gridlineSettings.minor.spacing"
          :height="gridlineSettings.minor.spacing"
          patternUnits="userSpaceOnUse"
        >
          <path
            :d="`
            M ${gridlineSettings.minor.width * gridlineSettings.minor.reach} 0 L 0 0 0 ${gridlineSettings.minor.width * gridlineSettings.minor.reach}
            M 0 ${gridlineSettings.minor.spacing - gridlineSettings.minor.width * gridlineSettings.minor.reach} L 0 ${gridlineSettings.minor.spacing} ${gridlineSettings.minor.width * gridlineSettings.minor.reach} ${gridlineSettings.minor.spacing} 
            M ${gridlineSettings.minor.spacing - gridlineSettings.minor.width * gridlineSettings.minor.reach} ${gridlineSettings.minor.spacing} L ${gridlineSettings.minor.spacing} ${gridlineSettings.minor.spacing} ${gridlineSettings.minor.spacing} ${gridlineSettings.minor.spacing - gridlineSettings.minor.width * gridlineSettings.minor.reach}
            M ${gridlineSettings.minor.spacing} ${gridlineSettings.minor.width * gridlineSettings.minor.reach} L ${gridlineSettings.minor.spacing} 0 ${gridlineSettings.minor.spacing - gridlineSettings.minor.width * gridlineSettings.minor.reach} 0 
            `"
            fill="none"
            :stroke="gridlineSettings.minor.color"
            :stroke-width="gridlineSettings.minor.width"
          />
        </pattern>
        <pattern
          id="majorGridlines"
          v-if="gridlineSettings.major"
          :width="gridlineSettings.major.spacing"
          :height="gridlineSettings.major.spacing"
          patternUnits="userSpaceOnUse"
          :x="pan.x"
          :y="pan.y"
        >
          <rect
            v-if="gridlineSettings.minor"
            :width="gridlineSettings.major.spacing"
            :height="gridlineSettings.major.spacing"
            fill="url(#minorGridlines)"
          />

          <path
            :d="`
            M ${gridlineSettings.major.width * gridlineSettings.major.reach} 0 L 0 0 0 ${gridlineSettings.major.width * gridlineSettings.major.reach}
            M 0 ${gridlineSettings.major.spacing - gridlineSettings.major.width * gridlineSettings.major.reach} L 0 ${gridlineSettings.major.spacing} ${gridlineSettings.major.width * gridlineSettings.major.reach} ${gridlineSettings.major.spacing} 
            M ${gridlineSettings.major.spacing - gridlineSettings.major.width * gridlineSettings.major.reach} ${gridlineSettings.major.spacing} L ${gridlineSettings.major.spacing} ${gridlineSettings.major.spacing} ${gridlineSettings.major.spacing} ${gridlineSettings.major.spacing - gridlineSettings.major.width * gridlineSettings.major.reach}
            M ${gridlineSettings.major.spacing} ${gridlineSettings.major.width * gridlineSettings.major.reach} L ${gridlineSettings.major.spacing} 0 ${gridlineSettings.major.spacing - gridlineSettings.major.width * gridlineSettings.major.reach} 0 
            `"
            fill="none"
            :stroke="gridlineSettings.major.color"
            :stroke-width="gridlineSettings.major.width"
          />
        </pattern>
      </defs>
      <rect
        id="gridlines"
        width="100%"
        height="100%"
        fill="url(#majorGridlines)"
        :style="{ cursor: panning ? 'grabbing' : 'grab' }"
        @mousedown="handleGridDragStart"
        @click="e => handleBedClick(e, null)"
        ref="gridlinesRef"
      />

      <svg
        :x="pan.x"
        :y="pan.y"
        style="overflow: visible;"
      >
        <g
          :transform="`scale(${scale})`"
        >
          <g
            v-for="bed in beds"
            :key="bed.id"
            :transform="`translate(${bed.x || 0}, ${bed.y || 0})`"
            class="bed"
            :class="{ selected: bed.id === selectedBed?.id, grouped: isGrouped && groupedBeds.find(({ id }) => id === bed.id) }"
            @click="e => handleBedClick(e, bed)"
          >
            <rect
              :width="Math.max(MIN_WIDTH, bed.width || 0)"
              :height="Math.max(MIN_HEIGHT, bed.height || 0)"
              fill="gray"
            />
            <text :x="0" :y="1">{{ bed.name }}</text>
            <circle
              :transform="`translate(${Math.max(MIN_WIDTH, bed.width || 0)}, ${Math.max(MIN_HEIGHT, bed.height || 0)})`"
              :r="1/2"
              class="resize-handle"
            />
          </g>

          <g
            v-if="selectedBedPlot && selectedBedPlotBounds"
            :transform="`translate(${selectedBedPlotBounds.min.x - 0.5}, ${selectedBedPlotBounds.min.y - 0.5})`"
            class="plot"
          >
            <rect
              :width="selectedBedPlotBounds.max.x - selectedBedPlotBounds.min.x + 1"
              :height="selectedBedPlotBounds.max.y - selectedBedPlotBounds.min.y + 1"
            />
            <text :x="0" :y="1">{{ selectedBedPlot.name }}</text>
          </g>
        </g>
      </svg>
    </svg>


    <footer>
      <nav class="PlotterActions">
        <button @click="isAddingPlot = true">Add Plot</button>
        <button @click="isAddingBed = true">Add Bed</button>
        <button @click="isAddingCrop = true">Add Crop</button>
        <!-- <button>Open</button> -->
      </nav>
    </footer>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject, nextTick, onMounted, onUnmounted, reactive, ref, watch, watchEffect } from 'vue'
import { gsap } from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { Bed, useBeds, usePlots } from '../services/data'
import { database, getUserRefPath } from '../services/firebase'

gsap.registerPlugin(Draggable)
const ls = {
  get: (key: string, defaultValue?: any) => window.localStorage.getItem(key) === null ? defaultValue : JSON.parse(window.localStorage.getItem(key) as string),
  set: (key: string, value: any) => window.localStorage.setItem(key, JSON.stringify(value)),
}
const MIN_WIDTH = 1
const MIN_HEIGHT = 1
const bedAccumulator = (beds: Bed[], prop: keyof Bed, fn: (a: any, b: any) => any) => {
  const output = beds.reduce((acc, bed) => {
    if (acc === undefined) return bed[prop]
    if (bed[prop] === undefined) return acc
    return fn(acc, bed[prop])
  }, undefined as keyof Bed | undefined)
  if (output === undefined) throw new Error(`No "${prop}" values to accumulate`)
  return output
}

export default defineComponent({
  name: 'Plotter',
  setup() {
    const scale = ref(ls.get('scale', 10))
    watch(scale, v => ls.set('scale', v))
    const gridlineSettings = reactive({
      minor: {
        spacing: computed(() => 1 * scale.value),
        width: 0.5,
        reach: computed(() => 10 / 10 * scale.value),
        color: 'rgba(0, 0, 0, 0.15)',
      },
      major: {
        spacing: computed(() => 10 * scale.value),
        width: 1,
        reach: computed(() => 3 / 10 * scale.value),
        color: 'rgba(0, 0, 0, 0.25)',
      },
    })
    const gridlinesRef = ref()

    const pan = reactive(ls.get('pan', {
      x: 0,
      y: 0,
    }))
    watch(pan, v => ls.set('pan', v))
    const panning = ref(false)
    // watch(() => scale.value, (value, previous) => {
    //   // const diff = (Number(value) - Number(previous)) / Number(value)
    //   const num = Number(value)
    //   const oldDeltaX = pan.x - center.x
    //   const oldDeltaY = pan.y - center.y
    //   const newDeltaX = (num * pan.x - num * center.x) / num
    //   const newDeltaY = (num * pan.y - num * center.y) / num
    //   // pan.x = diff * pan.x
    //   // pan.y = diff * pan.y
    //   console.log(1, oldDeltaX, oldDeltaY, newDeltaX, newDeltaY)
    // })
    // const center = reactive({
    //   x: 0,
    //   y: 0,
    // })
    // watchEffect(() => {
    //   const { width = 0, height = 0 } = gridlinesRef.value?.getBoundingClientRect() || {}
    //   center.x = width / 2 - pan.x
    //   center.y = height / 2 - pan.y
    //   // console.log(2, center)
    // })
    const handleGridDragStart = ({ clientX: startX, clientY: startY }: MouseEvent) => {
      const { x: initialX, y: initialY } = pan
      panning.value = true
      const handleMove = ({ clientX, clientY }: MouseEvent) => {
        pan.x = initialX + clientX - startX
        pan.y = initialY + clientY - startY
      }
      const handleEnd = (e: MouseEvent) => {
        panning.value = false
        handleMove(e)
        document.removeEventListener('mousemove', handleMove)
        document.removeEventListener('mouseup', handleEnd)
      }
      document.addEventListener('mousemove', handleMove)
      document.addEventListener('mouseup', handleEnd)
    }

    const plots = usePlots()
    const beds = useBeds()
    const selectedBed = ref<Bed>()
    const selectedBedPlot = computed(() => plots.value?.find(({ id }) => id === selectedBed.value?.plotId))
    const selectedBedPlotBounds = computed(
      () => {
        const bedsInPlot = beds.value?.filter(({ plotId }) => plotId === selectedBed.value?.plotId)
        return bedsInPlot?.reduce(
          ({ min, max }, { x = 0, y = 0, width = 0, height = 0 }) => {
            if (min.x === undefined || x < min.x) min.x = x
            if (min.y === undefined || y < min.y) min.y = y
            if (max.x === undefined || max.x < x + width) max.x = x + width
            if (max.y === undefined || max.y < y + height) max.y = y + height

            return { min, max }
          },
          { min: {}, max: {} } as { min: { x?: number, y?: number }, max: { x?: number, y?: number }},
        )
      }
    )
    const bedsRef = database.ref(getUserRefPath('/beds'))
    const groupedBeds = ref<Bed[]>([])
    const isGrouped = computed(() => groupedBeds.value?.length > 1)
    const handleGroupAlignLeft = async () => {
      if (!isGrouped.value) return

      const minX = bedAccumulator(groupedBeds.value, 'x', Math.min)

      await Promise.all(groupedBeds.value.map(async (bed) => {
        await bedsRef.child(bed.id).update({ x: minX })
      }))
    }
    const handleGroupAlignTop = async () => {
      if (!isGrouped.value) return

      const minY = bedAccumulator(groupedBeds.value, 'y', Math.min)

      await Promise.all(groupedBeds.value.map(async (bed) => {
        await bedsRef.child(bed.id).update({ y: minY })
      }))
    }

    const handleBedMove = async (bed: Bed, position: { x?: number, y?: number }) => {
      await bedsRef.child(bed.id).update(position)
    }
    const handleBedResize = async (bed: Bed, dimensions: { width?: number, height?: number }) => {
      await bedsRef.child(bed.id).update(dimensions)
    }
    const handleBedClick = (e: MouseEvent, bed: Bed) => {
      if (e.shiftKey && bed && selectedBed.value) {
        if (bed.id !== selectedBed.value?.id) {
          if (groupedBeds.value.find(({ id }) => id === bed.id)) {
            // remove it
            groupedBeds.value = groupedBeds.value.filter(({ id }) => id !== bed.id)
          } else {
            // add it
            groupedBeds.value = groupedBeds.value.concat(bed)
          }
        }
      } else {
        if (bed) {
          groupedBeds.value = [bed]
        } else {
          groupedBeds.value = []
        }
        selectedBed.value = bed
      }
    }
    watchEffect(async () => {
      if (beds.value) {
        await nextTick(); // await for <g>s to render before selecting them

        const getBedFromElement = (el: any) => {
          const index = [...el.parentElement.children].indexOf(el)
          const bed = beds.value?.[index]
          return bed
        }
        Draggable.create('g.bed', {
          cursor: 'move',
          liveSnap: {
            x: v => Math.round(v),
            y: v => Math.round(v),
          },
          minimumMovement: 1,
          onDrag: function () {
            const { x, y, target } = this
            const bed = getBedFromElement(target)
            if (bed) {
              bed.x = x
              bed.y = y
            }
          },
          onDragEnd: function () {
            const { x, y, target } = this
            const bed = getBedFromElement(target)
            if (bed) {
              handleBedMove(bed, { x, y })
            }
          },
        })
        Draggable.create('g.bed .resize-handle', {
          cursor: 'nwse-resize',
          liveSnap:  {
            // @TODO: prevent handle from being dragged above/left of top left min size
            x: v => Math.round(v),
            y: v => Math.round(v),
          },
          minimumMovement: 1,
          onPress: function (e) {
            e.stopPropagation()
          },
          onDrag: function () {
            const { x, y, target } = this
            const bed = getBedFromElement(target.parentElement)
            if (bed) {
              bed.width = x
              bed.height = y
            }
          },
          onDragEnd: function () {
            const { x, y, target } = this
            const bed = getBedFromElement(target.parentElement)
            if (bed) {
              handleBedResize(bed, { width: x, height: y })
            }
          }
        })
      }
    })

    const adjustBedPosition = (bed: Bed, { key, adjustment = 1 }: { key: string, adjustment: number }) => {
      const position = (() => {
        const { x = 0, y = 0 } = bed
        switch (key) {
          case 'ArrowLeft': return { x: x - adjustment }
          case 'ArrowRight': return { x: x + adjustment }
          case 'ArrowUp': return { y: y - adjustment }
          case 'ArrowDown': return { y: y + adjustment }
        }
      })()
      if (!position) return

      Object.assign(bed, position)
      handleBedMove(bed, position)
    }
    const handleKeypress = async (e: KeyboardEvent) => {
      if (!selectedBed.value) return

      const params = {
        key: e.key,
        adjustment: e.shiftKey ? 10 : 1
      }
      if (isGrouped.value) {
        groupedBeds.value.forEach((bed) => {
          adjustBedPosition(bed, params)
        })
      } else {
        adjustBedPosition(selectedBed.value, params)
      }
    }
    onMounted(() => {
      document.addEventListener('keydown', handleKeypress)
    })
    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeypress)
    })

    return {
      MIN_WIDTH,
      MIN_HEIGHT,
      isAddingPlot: inject('isAddingPlot'),
      isAddingBed: inject('isAddingBed'),
      isAddingCrop: inject('isAddingCrop'),

      scale,
      gridlineSettings,
      gridlinesRef,

      pan,
      panning,
      // center,
      handleGridDragStart,

      beds,
      selectedBed,
      selectedBedPlot,
      selectedBedPlotBounds,
      groupedBeds,
      isGrouped,
      handleGroupAlignLeft,
      handleGroupAlignTop,
      handleBedClick,
    }
  },
})
</script>

<style lang="scss">
$spacing: 8px;

.Plotter {
  position: relative;
  width: 100%;
  height: 100%;

  > header,
  > footer {
    display: flex;
    position: absolute;
    left: 0;
    right: 0;
    padding: $spacing;
    pointer-events: none;

    > * {
      pointer-events: auto;
      backdrop-filter: blur(3px);
    }
  }

  button {
    background: rgba(0, 0, 0, 0.33);
    color: rgba(255, 255, 255, 1);
    padding: $spacing;
    border: solid 1px transparent;
    border-radius: $spacing;

    &:focus,
    &:active {
      border-color: currentColor;
      outline: none;
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  > header {
    top: 0;

    > nav {
      display: flex;
      align-items: center;
      gap: $spacing;
      width: 100%;
      background: rgba(0, 0, 0, 0.33);
      color: rgba(255, 255, 255, 1);
      border-radius: $spacing;
      padding: $spacing;

      button {
        width: $spacing * 6;
        height: $spacing * 6;
      }

      > div {
        display: flex;
        flex: auto;
        flex-direction: column;
        justify-content: space-around;
        text-align: center;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;

        h1,
        h2 {
          font-size: inherit;
          padding: 0;
          margin: 0;
        }
      }
    }
  }

  > footer {
    justify-content: center;
    bottom: 0;

    > nav {
      display: flex;
      gap: $spacing;
      background: rgba(0, 0, 0, 0.33);
      border-radius: $spacing * 2;
      pointer-events: all;
      padding: $spacing;

      button {
        width: $spacing * 8;
        height: $spacing * 8;
      }
    }
  }

  svg {
    text {
      fill: currentColor;
      font-size: calc(10px / 10);
    }
    .bed {
      .resize-handle {
        fill: #2D77F6;

        &:hover,
        &:focus,
        &:active {
          fill: #225EC1;
        }
      }
      &:hover {
        rect {
          stroke: #2D77F6;
          stroke-width: calc(1px / 10);
        }
      }
      &:not(:hover):not(.selected) {
        .resize-handle:not(:active) {
          display: none;
        }
      }
      &.selected {
        rect {
          stroke: #2D77F6;
          stroke-width: calc(2px / 10);
          // stroke-dasharray: calc(4px / 10);
        }
        &:hover {
          rect {
            stroke: #225EC1;
          }
        }
      }
      &.grouped {
        rect {
          stroke: red;
          stroke-width: calc(2px / 10);
          stroke-dasharray: calc(2px / 10);
        }
        &:hover {
          rect {
            stroke: red;
          }
        }
      }
    }
    .plot {
      color: #2D77F6;
      pointer-events: none;

      rect {
          fill: none;
          stroke: #2D77F6;
          stroke-width: calc(1px / 10);
          stroke-dasharray: calc(1px / 10);
      }
    }
  }
}
</style>
