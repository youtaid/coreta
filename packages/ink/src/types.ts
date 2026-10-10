/** One sampled point of a stroke, in CSS pixels relative to the canvas. */
export interface InkPoint {
  x: number;
  y: number;
  /** Pen pressure from 0 to 1. */
  pressure: number;
}

export interface Stroke {
  id: string;
  /** Any canvas color; "currentColor" follows the canvas element's text color, so it tracks the theme. */
  color: string;
  /** Stroke width in CSS pixels at full pressure. */
  size: number;
  points: InkPoint[];
  /** True when the device reports no real pressure (mouse, finger), so it is simulated from speed. */
  simulatePressure: boolean;
}

export type Tool = "pen" | "eraser";
