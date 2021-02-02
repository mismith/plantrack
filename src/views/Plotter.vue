<template>
  <div class="Plotter">
    <header>
      <nav>
        <button>&slarr;</button>
        <div>
          <h1>Entity Name</h1>
          <h2>Description or top-tier info about entity</h2>
        </div>
        <input type="range" min="1" max="100" v-model="scale" />
        <button>&#8505;</button>
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
        @mousedown="handleStart"
        ref="gridlinesRef"
      />

      <svg
        :x="pan.x"
        :y="pan.y"
      >
        <g
          :transform="`scale(${scale})`"
        >
          <rect
            v-for="(plot, index) in plots"
            :key="index"
            :x="plot.x"
            :y="plot.y"
            :width="plot.width"
            :height="plot.height"
            fill="gray"
          />
        </g>
      </svg>
    </svg>


    <footer>
      <nav class="PlotterActions">
        <button @click="handleAddSubplot">Add Subplot</button>
        <button>Add Bed</button>
        <button>Add Crop</button>
        <button>Open</button>
      </nav>
    </footer>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref, watchEffect } from 'vue'

export default defineComponent({
  name: 'Plotter',
  setup() {
    const scale = ref(10)
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

    const pan = reactive({
      x: 0,
      y: 0,
    })
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
    const center = reactive({
      x: 0,
      y: 0,
    })
    watchEffect(() => {
      const { width = 0, height = 0 } = gridlinesRef.value?.getBoundingClientRect() || {}
      center.x = width / 2 - pan.x
      center.y = height / 2 - pan.y
      // console.log(2, center)
    })

    const plots = reactive([
      {
        x: 10,
        y: 10,
        width: 7,
        height: 3,
      },
      {
        x: 50,
        y: 25,
        width: 6,
        height: 14,
      },
    ])

    return {
      scale,
      gridlineSettings,
      gridlinesRef,

      pan,
      panning,
      center,
      handleStart({ clientX: startX, clientY: startY }: MouseEvent) {
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
      },

      plots,
      handleAddSubplot() {
        plots.push({
          x: Math.round(center.x / scale.value),
          y: Math.round(center.y / scale.value),
          width: Math.round(Math.random() * 9) + 1,
          height: Math.round(Math.random() * 9) + 1,
        })
      },
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
  }

  > header {
    top: 0;

    > nav {
      display: flex;
      width: 100%;
      background: rgba(0, 0, 0, 0.33);
      color: rgba(255, 255, 255, 1);
      border-radius: $spacing;

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
      background: rgba(0, 0, 0, 0.33);
      border-radius: $spacing * 2;
      pointer-events: all;

      button {
        width: $spacing * 8;
        height: $spacing * 8;
        margin: $spacing;
      }
    }
  }
}
</style>