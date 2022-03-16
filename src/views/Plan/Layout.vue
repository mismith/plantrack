<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, RendererElement, watch } from 'vue'
import { fabric } from 'fabric-with-gestures'

import { Bed, useBeds, usePersistentRef, usePlots } from '../../services/data'
import { database, getUserRefPath } from '../../services/firebase'
import {
  snapTo,
  useSnappedMovement,
  useSnappedScaling,
  useSnappedRotation,
  ANGLE_SNAP,
  useMouseViewportTransforming,
  useMouseWheelViewportTransforming,
  useTouchViewportTransforming,
} from '../../services/fabric'
import VPButton from '../../components/Button.vue'
import Octicon from '../../components/Octicon.vue'

const canvasContainerRef = ref<HTMLCanvasElement>()
let canvas: fabric.Canvas // @HACK: use global var instead of ref since fabric doesn't like vue's Proxy-fication of the canvas

const isShowingGridlines = usePersistentRef('Layout.isShowingGridlines', false)
const gridSize = usePersistentRef('Layout.gridSize', 10)
const isShowingPlotBounds = usePersistentRef('Layout.isShowingPlotBounds', true)
const isShowingPlotNames = usePersistentRef('Layout.isShowingPlotNames', true)

const selectedObjects = ref<fabric.Object[]>([])

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
      snapAngle: ANGLE_SNAP,
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
function handleZoom(scale: string) {
  canvas?.zoomToPoint(canvas.getVpCenter(), Number.parseFloat(scale))
  storeViewportTransform()
}
function handleFit() {
  if (!(canvas.width && canvas.height)) return

  const allObjects = new fabric.Group(canvas.getObjects().filter(({ selectable }) => selectable))
  const { width, height } = allObjects
  if (!(width && height)) return

  const center = allObjects.getCenterPoint()
  const gutter = 100
  const zoom = Math.min(canvas.width / (width + gutter), canvas.height / (height + gutter))
  allObjects.destroy()

  canvas.setViewportTransform([
    zoom, 0, 0,
    zoom, (-center.x * zoom) + (canvas.width / 2), (-center.y  * zoom) + (canvas.height / 2),
  ]);
  storeViewportTransform()
}

const planAppendRef = inject<RendererElement>('Plan.appendRef')
const isToolsShowing = ref(false)
const isToolsSidebar = ref(false)

function handleResize() {
  if (!canvasContainerRef.value || !canvas) return

  const { width, height } = canvasContainerRef.value?.getBoundingClientRect() as any;
  canvas.setDimensions({ width, height })

  isToolsSidebar.value =(canvasContainerRef.value?.offsetWidth || 0) >= 600
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
  canvas?.on('object:modified', async function ({ action, target, transform: { original } }: any) {
    // @TODO: fix grouped rotation
    const objects = canvas.getActiveObjects()
    const beds = objects.filter(({ data }) => data?.bed?.id).map(({ data }) => data.bed)
    await Promise.all(beds.map(async (bed: Bed) => {
      const updates: Partial<Bed> = {}
      switch (action) {
        case 'rotate': {
          updates.rotation = snapTo((bed.rotation || 0) + (target?.angle || 0) - original.angle, ANGLE_SNAP)
          // fall through
        }
        case 'scale':
        case 'scaleX':
        case 'scaleY': {
          updates.width = snapTo((bed.width || 0) * (target?.scaleX || 0))
          updates.height = snapTo((bed.height || 0) * (target?.scaleY || 0))
          // fall through
        }
        case 'drag': {
          updates.x = snapTo((bed.x || 0) + (target?.left || 0) - original.left)
          updates.y = snapTo((bed.y || 0) + (target?.top || 0) - original.top)
          break;
        }
      }
      await bedsRef.child(bed.id).update(updates)
    }))
  })

  // snap to grid
  useSnappedMovement(canvas)
  useSnappedScaling(canvas)
  useSnappedRotation(canvas)

  // viewport transforming
  useMouseViewportTransforming(canvas, storeViewportTransform)
  useMouseWheelViewportTransforming(canvas, storeViewportTransform)
  useTouchViewportTransforming(canvas, storeViewportTransform)

  // selection syncing
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
  <div class="d-flex flex-auto position-relative">
    <div ref="canvasContainerRef" class="color-bg-inset flex-auto overflow-hidden">
      <canvas />
    </div>
    <Teleport v-if="planAppendRef" :to="planAppendRef">
      <VPButton class="px-2 mr-2" @click="isToolsShowing = !isToolsShowing">
        <Octicon name="gear" />
      </VPButton>
    </Teleport>
    <aside
      v-if="isToolsShowing"
      class="color-bg-default p-3"
      :class="isToolsSidebar ? 'border-left border-color-muted' : 'position-absolute top-0 right-0 Box'"
      style="max-width: 300px;"
    >
      <form @submit.prevent>
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
          <VPButton @click="handleFit">Zoom/Pan to Fit</VPButton>
        </div>
      </form>
    </aside>
  </div>
</template>
