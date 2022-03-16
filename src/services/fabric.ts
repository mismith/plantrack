import { fabric } from 'fabric-with-gestures'

export const GRID_SIZE = 1
export const GRID_SNAP = GRID_SIZE
export const ANGLE_SNAP = 15

export function snapTo(value: number | null | undefined, snapSize = GRID_SNAP) {
  return Math.round((value || 0) / snapSize) * snapSize;
}
export function useSnappedMovement(canvas: fabric.Canvas, snapSize?: number) {
  canvas?.on('object:moving', ({ target }) => {
    target!.set({
      left: snapTo(target!.left, snapSize),
      top: snapTo(target!.top, snapSize)
    });
  })
}
export function useSnappedScaling(canvas: fabric.Canvas, snapSize?: number) {
  canvas?.on('object:scaling', ({ transform }) => {
    const target = (transform as any).target
    const targetWidth = target.width * target.scaleX;
    const targetHeight = target.height * target.scaleY;
  
    const snap = {
      // closest width to snap to
      width: snapTo(targetWidth, snapSize),
      height: snapTo(targetHeight, snapSize),
    };
  
    const threshold = GRID_SIZE;
  
    const dist = {
      // distance from current width to snappable width
      width: Math.abs(targetWidth - snap.width),
      height: Math.abs(targetHeight - snap.height),
    };
  
    const centerPoint = target.getCenterPoint();
  
    const anchorY = transform!.originY;
    const anchorX = transform!.originX;
  
    const anchorPoint = target.translateToOriginPoint(
      centerPoint,
      anchorX,
      anchorY,
    );
  
    const attrs = {
      scaleX: target.scaleX,
      scaleY: target.scaleY,
    };
  
    // eslint-disable-next-line default-case
    switch (transform!.corner) {
      case 'tl':
      case 'br':
      case 'tr':
      case 'bl':
        if (dist.width < threshold) {
          attrs.scaleX = snap.width / target.width;
        }
  
        if (dist.height < threshold) {
          attrs.scaleY = snap.height / target.height;
        }
  
        break;
      case 'mt':
      case 'mb':
        if (dist.height < threshold) {
          attrs.scaleY = snap.height / target.height;
        }
  
        break;
      case 'ml':
      case 'mr':
        if (dist.width < threshold) {
          attrs.scaleX = snap.width / target.width;
        }
  
        break;
    }
  
    if (attrs.scaleX !== target.scaleX || attrs.scaleY !== target.scaleY) {
      target.set(attrs);
      target.setPositionByOrigin(anchorPoint, anchorX, anchorY);
    }
  })
}
export function useSnappedRotation(canvas: fabric.Canvas, snapSize: number = ANGLE_SNAP) {
  canvas?.on('object:rotating', ({ target }) => {
    target!.set({
      angle: snapTo(target!.left, snapSize),
    });
  })
}

export function useMouseViewportTransforming(canvas: fabric.Canvas, onTransform?: Function, ) {
  // alt + drag: pan
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
      onPan?.()
    }
  });
  canvas?.on('mouse:up', () => {
    canvas.setViewportTransform(canvas.viewportTransform)
    canvas.isDragging = false
    canvas.selection = true
  });
}
export function useMouseWheelViewportTransforming(canvas: fabric.Canvas, onTransform?: Function) {
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
    onTransform?.()
  })
}
export function useTouchViewportTransforming(canvas: fabric.Canvas, onTransform?: Function) {
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
        onTransform?.()

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
}

// export function useViewportFit(canvas: fabric.Canvas, { objects = canvas.getObjects(), gutter = 100 }, onTransform?: Function) {
//   return () => {
//     const allObjects = new fabric.Group(objects)
//     const { width, height } = allObjects
//     if (!(canvas.width && canvas.height && width && height)) return

//     const center = allObjects.getCenterPoint()
//     const zoom = Math.min((canvas.width || 0) / (width + gutter), (canvas.height || 0) / (height + gutter))
//     allObjects.destroy()

//     canvas.setViewportTransform([
//       zoom, 0, 0,
//       zoom, (-center.x * zoom) + (canvas.width / 2), (-center.y  * zoom) + (canvas.height / 2),
//     ]);
//     onTransform?.()
//   }
// }
