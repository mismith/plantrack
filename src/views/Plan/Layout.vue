<script setup lang="ts">
import { inject, onMounted, ref, watch } from 'vue'
import { fabric } from 'fabric'

import { Bed, useBeds, usePersistentRef } from '../../services/data';
import { database, getUserRefPath } from '../../services/firebase';
import { snapTo, snapMoving, snapScaling } from '../../services/fabric';

const canvasRef = ref<HTMLCanvasElement>()
let canvas: fabric.Canvas

function redraw() {
  canvas.clear()
  beds.value?.forEach((bed) => {
    const width = bed.width || 10
    const height = bed.height || 10

    const rect = new fabric.Rect({
      originX: 'center',
      originY: 'center',
      width,
      height,
      fill: getComputedStyle(document.documentElement).getPropertyValue('--color-fg-default'),
    })
    const text = new fabric.Text(bed.name || bed.id, {
      fill: getComputedStyle(document.documentElement).getPropertyValue('--color-fg-subtle'),
      originX: 'center',
      originY: 'center',
      fontSize: 16, // max size
      fontFamily: '-apple-system, sans-serif',
      // clipPath: rect,
    })
    let attempts = 0
    while (text.getScaledWidth() > width && text.fontSize! > 1 && attempts < 100) {
      attempts++
      text.set({
        fontSize: text.fontSize! - 0.5,
      })
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
  })
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

onMounted(() => {
  if (!canvasRef.value) return

  const { width, height } = canvasRef.value?.parentElement?.getBoundingClientRect() as any;
  canvasRef.value.width = width;
  canvasRef.value.height = height;

  canvas = new fabric.Canvas(canvasRef.value)

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
      await database.ref(getUserRefPath('/beds')).child(bed.id).update(updates)
    }))
  })

  // snap to grid
  canvas?.on('object:moving', snapMoving)
  canvas?.on('object:scaling', snapScaling)

  // two-finger move: pan / tw-finger move + alt: zoom / two-finger pinch: zoom
  canvas?.on('mouse:wheel', function ({ e }) {
    e.preventDefault()
    e.stopPropagation()
    if (e.ctrlKey) {
      const zoom = (canvas?.getZoom() || 1) * (0.99 ** e.deltaY);
      canvas?.zoomToPoint({ x: e.offsetX, y: e.offsetY }, zoom);
    } else {
      this.viewportTransform[4] -= e.deltaX;
      this.viewportTransform[5] -= e.deltaY;
      this.requestRenderAll();
    }
    storeViewportTransform()
  })

  // alt-drag: pan
  canvas?.on('mouse:down', function ({ e }) {
    if (e.altKey) {
      e.preventDefault()
      e.stopPropagation()
      this.isDragging = true
      this.selection = false
      this.lastPosX = e.clientX
      this.lastPosY = e.clientY
    }
  });
  canvas?.on('mouse:move', function ({ e }) {
    if (this.isDragging) {
      this.viewportTransform[4] += e.clientX - this.lastPosX
      this.viewportTransform[5] += e.clientY - this.lastPosY
      this.requestRenderAll()
      this.lastPosX = e.clientX
      this.lastPosY = e.clientY
      storeViewportTransform()
    }
  });
  canvas?.on('mouse:up', function () {
    // on mouse up we want to recalculate new interaction
    // for all objects, so we call setViewportTransform
    this.setViewportTransform(this.viewportTransform)
    this.isDragging = false
    this.selection = true
  });

  // two-finger pinch: zoom ?
  let zoomStartScale = 1
  canvas?.on('touch:gesture', function ({ e, self }) {
    e.preventDefault()
    e.stopPropagation()
    if (e.touches && e.touches.length == 2) {
      if (self.state === 'start') {
        zoomStartScale = self.canvas.getZoom()
      }
      self.canvas.zoomToPoint({ x: self.x, y: self.y }, zoomStartScale * self.scale)
      storeViewportTransform()
    }
  })

  redraw()
})

// const [plots] = usePlots()
const [beds] = useBeds()
watch(beds, redraw)

const isDarkMode = inject('isDarkMode')
watch(isDarkMode, () => redraw())
</script>

<template>
  <div class="flex-auto">
    <canvas ref="canvasRef" />
  </div>
</template>
