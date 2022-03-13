export const GRID_SIZE = 1

export function snapTo(value: number, snapSize = GRID_SIZE) {
  return Math.round(value / snapSize) * snapSize;
}
export function snapMoving({ target }) {
  target.set({
    left: snapTo(target.left),
    top: snapTo(target.top)
  });
}
export function snapScaling({ transform }) {
  const { target } = transform
  const targetWidth = target.width * target.scaleX;
  const targetHeight = target.height * target.scaleY;

  const snap = {
    // closest width to snap to
    width: snapTo(targetWidth),
    height: snapTo(targetHeight),
  };

  const threshold = GRID_SIZE;

  const dist = {
    // distance from current width to snappable width
    width: Math.abs(targetWidth - snap.width),
    height: Math.abs(targetHeight - snap.height),
  };

  const centerPoint = target.getCenterPoint();

  const anchorY = transform.originY;
  const anchorX = transform.originX;

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
  switch (transform.corner) {
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
}
