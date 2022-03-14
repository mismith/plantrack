<script setup lang="ts">
import { inject, onMounted, onUnmounted, ref, watch } from 'vue'
import { fabric } from 'fabric-with-gestures'

import { Bed, useBeds, usePersistentRef, usePlots } from '../../services/data'
import { database, getUserRefPath } from '../../services/firebase'
import { snapTo, snapMoving, snapScaling } from '../../services/fabric'
import VPButton from '../../components/Button.vue'

const canvasContainerRef = ref<HTMLCanvasElement>()
let canvas: fabric.Canvas // @HACK: use global var instead of ref since fabric doesn't like vue's Proxy-fication of the canvas

const isShowingGridlines = usePersistentRef('Layout.isShowingGridlines', false)
const gridSize = usePersistentRef('Layout.gridSize', 10)
const isShowingPlotBounds = usePersistentRef('Layout.isShowingPlotBounds', true)
const isShowingPlotNames = usePersistentRef('Layout.isShowingPlotNames', true)

const selectedObjects = ref([])

function redraw() {
  canvas.clear()

  const bedGroupsByPlotId = beds.value?.reduce((acc, bed) => {
    if (!(bed.width && bed.height)) return acc

    const width = bed.width || 10
    const height = bed.height || 10

    const rect = new fabric.Rect({
      originX: 'center',
      originY: 'center',
      width,
      height,
      fill: getComputedStyle(document.documentElement).getPropertyValue('--color-fg-muted'),
    })
    const text = new fabric.Text(bed.name || bed.id, {
      fill: getComputedStyle(document.documentElement).getPropertyValue('--color-fg-on-emphasis'),
      originX: 'center',
      originY: 'center',
      fontSize: 16, // max size
      fontFamily: '-apple-system, sans-serif',
      // clipPath: rect,
    })
    let attempts = 0
    while (text.getScaledWidth() > width && text.fontSize! > 1 && attempts < 100) {
      attempts++
      text.set({ fontSize: text.fontSize! - 0.5 })
    }
    const group = new fabric.Group([rect, text], {
      data: {
        bed,
      },
      top: bed.y || 0,
      left: bed.x || 0,
      angle: bed.rotation || 0,
      snapAngle: 5,
      centeredRotation: true,
      lockSkewingX: true,
      lockSkewingY: true,
    })
    canvas?.add(group)

    acc[bed.plotId] = (acc[bed.plotId] || []).concat(group)
    return acc
  }, {} as Record<string, fabric.Group[]>)

  if (isShowingPlotBounds.value) {
    Object.entries(bedGroupsByPlotId || {}).map(([plotId, bedGroups]) => {
      const plotGroup = new fabric.Group(bedGroups)
      const bbox = plotGroup.getBoundingRect()
      plotGroup.destroy()

      if (isShowingPlotNames.value) {
        const plotName = plots.value?.find(({ id }) => id === plotId)?.name
        if (plotName) {
          const label = new fabric.Text(plotName, {
            originX: 'left',
            originY: 'bottom',
            left: bbox.left - 2,
            top: bbox.top - 2,
            fill: getComputedStyle(document.documentElement).getPropertyValue('--color-fg-subtle'),
            fontSize: 10,
            fontFamily: '-apple-system, sans-serif',
            selectable: false,
            evented: false,
          })
          canvas.add(label)
          canvas.sendToBack(label)
        }
      }

      const plot = new fabric.Rect({
        left: bbox.left - 2,
        top: bbox.top - 2,
        width: bbox.width + 3,
        height: bbox.height + 3,
        fill: 'transparent',
        stroke: getComputedStyle(document.documentElement).getPropertyValue('--color-fg-subtle'),
        strokeDashArray: [2, 2],
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
      })
      canvas.add(plot)
      canvas.sendToBack(plot)
    })
  }

  if (isShowingGridlines.value) {
    const allObjects = new fabric.Group(canvas.getObjects())
    const bbox = allObjects.getBoundingRect()
    allObjects.destroy()

    const gutter = 100
    const limits = {
      left: Math.round(Math.round(bbox.left / gridSize.value) * gridSize.value) - gutter,
      top: Math.round(Math.round(bbox.top / gridSize.value) * gridSize.value) - gutter,
      right: Math.round(Math.round((bbox.left + bbox.width) / gridSize.value) * gridSize.value) + gutter,
      bottom: Math.round(Math.round((bbox.top + bbox.height) / gridSize.value) * gridSize.value) + gutter,
    }
    for(let x = limits.left + gridSize.value; x < limits.right; x += gridSize.value) {
      const line = new fabric.Line(
        [x, limits.top, x, limits.bottom],
        {
          stroke: getComputedStyle(document.documentElement).getPropertyValue('--color-border-muted'),
          strokeWidth: 0.25,
          selectable: false,
          evented: false,
        },
      )
      canvas.add(line)
      canvas.sendToBack(line)
    }
    for(let y = limits.top + gridSize.value; y < limits.bottom; y += gridSize.value) {
      const line = new fabric.Line(
        [limits.left, y, limits.right, y],
        {
          stroke: getComputedStyle(document.documentElement).getPropertyValue('--color-border-muted'),
          strokeWidth: 0.25,
          selectable: false,
          evented: false,
        },
      )
      canvas.add(line)
      canvas.sendToBack(line)
    }
  }
}

const viewportTransform = usePersistentRef<number[]>('Layout.viewportTransform')
function storeViewportTransform() {
  if (canvas?.viewportTransform) {
    viewportTransform.value = canvas.viewportTransform
  }
}
function restoreViewportTransform() {
  if (viewportTransform.value) {
    canvas?.setViewportTransform(viewportTransform.value)
  }
}
function handleZoom(scale: number) {
  canvas?.zoomToPoint(canvas.getVpCenter(), Number.parseFloat(scale))
  storeViewportTransform()
}
function handleFit() {
  const gutter = 100
  const allObjects = new fabric.Group(canvas.getObjects().filter(({ selectable }) => selectable))
  const center = allObjects.getCenterPoint()
  const { width, height } = allObjects
  const zoom = Math.min(canvas.width / (width + gutter), canvas.height / (height + gutter))
  allObjects.destroy()

  canvas.setViewportTransform([
    zoom, 0, 0,
    zoom, (-center.x * zoom) + (canvas.width / 2), (-center.y  * zoom) + (canvas.height / 2),
  ]);
  storeViewportTransform()
}

function handleResize() {
  if (!canvasContainerRef.value || !canvas) return

  const { width, height } = canvasContainerRef.value?.getBoundingClientRect() as any;
  canvas.setDimensions({ width, height })
}
onMounted(() => {
  window.addEventListener('resize', handleResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
const resizeObserver = new ResizeObserver(handleResize)
onUnmounted(() => {
  resizeObserver.disconnect()
})


onMounted(() => {
  if (!canvasContainerRef.value) return
  resizeObserver.observe(canvasContainerRef.value)

  const { width, height } = canvasContainerRef.value?.getBoundingClientRect() as any;
  const canvasEl = canvasContainerRef.value.querySelector('canvas')
  if (!canvasEl) return
  canvasEl.width = width;
  canvasEl.height = height;

  canvas = new fabric.Canvas(canvasEl)

  restoreViewportTransform()

  const bedsRef = database.ref(getUserRefPath('/beds'))
  canvas?.on('object:modified', async function ({ action, target, transform: { original } }) {
    // @TODO: fix grouped rotation
    const objects = canvas.getActiveObjects()
    const beds = objects.filter(({ data }) => data?.bed?.id).map(({ data }) => data.bed)
    await Promise.all(beds.map(async (bed) => {
      const updates: Partial<Bed> = {}
      switch (action) {
        case 'rotate': {
          updates.rotation = snapTo(bed.rotation + target.angle - original.angle, 5)
          // fall through
        }
        case 'scale':
        case 'scaleX':
        case 'scaleY': {
          updates.width = snapTo(bed.width * target.scaleX)
          updates.height = snapTo(bed.height * target.scaleY)
          // fall through
        }
        case 'drag': {
          updates.x = snapTo(bed.x + target.left - original.left)
          updates.y = snapTo(bed.y + target.top - original.top)
          break;
        }
      }
      await bedsRef.child(bed.id).update(updates)
    }))
  })

  // snap to grid
  canvas?.on('object:moving', snapMoving)
  canvas?.on('object:scaling', snapScaling)

  // two-finger move: pan / two-finger pinch: zoom / two-finger move + alt: zoom
  canvas?.on('mouse:wheel', ({ e }) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.ctrlKey) {
      const zoom = (canvas?.getZoom() || 1) * (0.99 ** e.deltaY);
      canvas?.zoomToPoint({ x: e.offsetX, y: e.offsetY }, zoom);
    } else {
      canvas.viewportTransform[4] -= e.deltaX;
      canvas.viewportTransform[5] -= e.deltaY;
      canvas.requestRenderAll();
    }
    storeViewportTransform()
  })

  // alt-drag: pan
  canvas?.on('mouse:down', ({ e }) => {
    if (e.altKey && !e.touches?.length) {
      e.preventDefault()
      e.stopPropagation()
      canvas.isDragging = true
      canvas.selection = false
      canvas.lastPosX = e.clientX
      canvas.lastPosY = e.clientY
    }
    if (e.touches?.length >= 2) {
      canvas.selection = false
    }
  });
  canvas?.on('mouse:move', ({ e }) => {
    if (canvas.isDragging) {
      canvas.viewportTransform[4] += e.clientX - canvas.lastPosX
      canvas.viewportTransform[5] += e.clientY - canvas.lastPosY
      canvas.requestRenderAll()
      canvas.lastPosX = e.clientX
      canvas.lastPosY = e.clientY
      storeViewportTransform()
    }
  });
  canvas?.on('mouse:up', () => {
    // on mouse up we want to recalculate new interaction
    // for all objects, so we call setViewportTransform
    canvas.setViewportTransform(canvas.viewportTransform)
    canvas.isDragging = false
    canvas.selection = true
  });

  // two-finger move: pan / two-finger pinch: zoom
  let touchCache: Record<string, number> | undefined
  canvas?.on('touch:gesture', ({ e, self }) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.touches && e.touches.length === 2) {
      if (self.state === 'start') {
        canvas.selection = false
        touchCache = {
          zoom: canvas.getZoom(),
          x: e.layerX,
          y: e.layerY,
        }
      } else if (touchCache) {
        canvas.relativePan({ x: e.layerX - touchCache.x, y: e.layerY - touchCache.y })
        canvas.zoomToPoint({ x: self.x, y: self.y }, touchCache.zoom * self.scale)
        storeViewportTransform()

        if (self.state === 'end') {
          canvas.selection = true
          touchCache = undefined
        } else {
          touchCache.x = e.layerX
          touchCache.y = e.layerY
        }
      }
    }
  })

  canvas?.on('selection:created', () => {
    selectedObjects.value = canvas.getActiveObjects()
  })
  canvas?.on('selection:updated', () => {
    selectedObjects.value = canvas.getActiveObjects()
  })
  canvas?.on('selection:cleared', () => {
    selectedObjects.value = canvas.getActiveObjects()
  })

  redraw()
})

const [beds] = useBeds()
const [plots] = usePlots()
const isDarkMode = inject('isDarkMode')
watch([
  beds,
  plots,
  isShowingGridlines,
  gridSize,
  isShowingPlotBounds,
  isShowingPlotNames,
  isDarkMode,
], () => redraw())
</script>

<template>
  <div class="d-flex flex-auto">
    <div ref="canvasContainerRef" class="color-bg-inset flex-auto overflow-hidden">
      <canvas />
    </div>
    <aside class="border-left border-color-muted" style="max-width: 300px;">
      <form @submit.prevent class="px-2">
        <div class="form-checkbox">
          <label>
            <input type="checkbox" v-model="isShowingGridlines" />
            Show gridlines
          </label>
        </div>
        <div class="ml-3">
          <label>
            Grid size
            <input type="number" v-model="gridSize" min="1" max="1000" :disabled="!isShowingGridlines" />
          </label>
        </div>

        <div class="form-checkbox">
          <label>
            <input type="checkbox" v-model="isShowingPlotBounds" />
            Show plot bounds
          </label>
        </div>
        <div class="form-checkbox ml-3">
          <label>
            <input type="checkbox" v-model="isShowingPlotNames" :disabled="!isShowingPlotBounds" />
            Show plot names
          </label>
        </div>

        <div>
          <label>
            Zoom
            <input
              type="range"
              :value="canvas?.getZoom() || 1"
              :min="1"
              :max="100"
              :step="0.0001"
              @input="(e) => handleZoom(e.target.value)"
            />
          </label>
        </div>
        <div>
          <VPButton @click="handleFit">Zoom/Pan to Fit</VPButton>
        </div>
      </form>
    </aside>
  </div>
</template>
