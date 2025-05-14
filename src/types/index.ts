export interface BaseShape {
  id: string;
  type: 'rectangle' | 'ellipse' | 'line' | 'text' | 'freehand' | 'image';
  text?: string;
  fontSize?: number;
  textColor?: string;
  opacity?: number;
}

export interface RectangleConfig extends BaseShape {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface EllipseConfig extends BaseShape {
  type: 'ellipse';
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface LineConfig extends BaseShape {
  type: 'line' | 'freehand';
  points: number[];
  stroke: string;
  strokeWidth: number;
}

export interface TextConfig extends BaseShape {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fill: string;
  width?: number;
  height?: number;
}

export interface ImageConfig extends BaseShape {
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
}

export type ShapeConfig =
  | RectangleConfig
  | EllipseConfig
  | LineConfig
  | TextConfig
  | ImageConfig;

export type Tool = 'select' | 'rectangle' | 'ellipse' | 'line' | 'text' | 'freehand' | 'image';