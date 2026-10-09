export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

/** Gap kept between a floating window and the edge of the area it floats in. */
export const WINDOW_MARGIN = 8;

/** Distance a window moves per arrow-key press. */
export const KEY_STEP = 16;

/** Keeps a window fully inside its container; if it is larger than the container, pins it to the margin. */
export function clampPosition(
  position: Point,
  windowSize: Size,
  container: Size,
  margin = WINDOW_MARGIN,
): Point {
  const maxX = Math.max(margin, container.width - windowSize.width - margin);
  const maxY = Math.max(margin, container.height - windowSize.height - margin);
  return {
    x: Math.min(Math.max(position.x, margin), maxX),
    y: Math.min(Math.max(position.y, margin), maxY),
  };
}

const ARROW_DELTAS: Record<string, Point> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

/** Position after an arrow key, or undefined when the key is not an arrow. */
export function moveByKey(
  key: string,
  position: Point,
  windowSize: Size,
  container: Size,
  step = KEY_STEP,
): Point | undefined {
  const delta = ARROW_DELTAS[key];
  if (!delta) return undefined;
  return clampPosition(
    { x: position.x + delta.x * step, y: position.y + delta.y * step },
    windowSize,
    container,
  );
}
