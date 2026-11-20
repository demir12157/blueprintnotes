export type ShapeKind =
  | 'line'
  | 'arrow'
  | 'dimension'
  | 'rect'
  | 'circle'
  | 'triangle'
  | 'diamond'
  | 'hexagon'
  | 'star';

export type ToolId =
  | 'select'
  | 'pen1'
  | 'pen2'
  | 'pen3'
  | 'highlighter'
  | 'eraser'
  | 'shapes'
  | 'fill'
  | 'eyedropper'
  | 'text'
  | 'hand';

export type GridStyle = 'blueprint' | 'dots' | 'blank';

export type BlendMode = 'source-over' | 'screen' | 'multiply' | 'overlay' | 'lighter';

export interface Point {
  x: number;
  y: number;
  p?: number;
}

export interface PenPreset {
  id: 'pen1' | 'pen2' | 'pen3' | 'highlighter';
  label: string;
  color: string;
  size: number;
  opacity: number;
}

export interface DrawingElement {
  id: string;
  kind: 'path' | 'text' | ShapeKind;
  color: string;
  size: number;
  opacity: number;
  dashed?: boolean;
  filled?: boolean;
  glow?: boolean;
  rotation?: number; // degrees 0..360
  points?: Point[];
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  text?: string;
  fontSize?: number;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0..1
  blendMode: BlendMode;
  elements: DrawingElement[];
}

export interface DrawingPage {
  id: string;
  code: string;
  title: string;
  project: string;
  revision: number;
  date: string;
  scale: string;
  gridStyle: GridStyle;
  showTitleBlock: boolean;
  activeLayerId: string;
  layers: Layer[];
  /** Legacy field for automatic migration from v1 saves */
  elements?: DrawingElement[];
}

export interface NotebookData {
  activePageId: string;
  pages: DrawingPage[];
}

export interface BlueprintDesktopAPI {
  isElectron: boolean;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  getVaultPath: () => Promise<string>;
  loadVault: () => Promise<NotebookData | null>;
  saveVault: (data: NotebookData) => Promise<{ ok: boolean; path?: string; error?: string }>;
  exportPng: (payload: { filename: string; dataUrl: string }) => Promise<{ ok: boolean; filePath?: string; canceled?: boolean }>;
}

declare global {
  interface Window {
    blueprintAPI?: BlueprintDesktopAPI;
  }
}
