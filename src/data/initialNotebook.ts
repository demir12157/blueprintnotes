import { DrawingPage, NotebookData, PenPreset } from '../types/drawing';

export const DEFAULT_PENS: Record<'pen1' | 'pen2' | 'pen3' | 'highlighter', PenPreset> = {
  pen1: { id: 'pen1', label: 'PEN 1', color: '#F0F7FF', size: 2.5, opacity: 1 },
  pen2: { id: 'pen2', label: 'CYAN', color: '#5CE1E6', size: 2.5, opacity: 1 },
  pen3: { id: 'pen3', label: 'AMBR', color: '#FFD166', size: 2.5, opacity: 1 },
  highlighter: { id: 'highlighter', label: 'HLGT', color: '#5CE1E6', size: 20, opacity: 0.28 },
};

export const COLOR_SWATCHES = [
  { name: 'Blueprint White', hex: '#F0F7FF' },
  { name: 'Technical Cyan', hex: '#5CE1E6' },
  { name: 'Callout Amber', hex: '#FFD166' },
  { name: 'Markup Coral', hex: '#FF6B81' },
  { name: 'Drafting Mint', hex: '#6EF3A5' },
  { name: 'Soft Sky', hex: '#72C8FF' },
];

export const INITIAL_NOTEBOOK: NotebookData = {
  activePageId: 'page-a101',
  pages: [
    {
      id: 'page-a101',
      code: 'A-101',
      title: 'Floor Plan Sketch',
      project: 'BLUEPRINTNOTES STUDIO',
      revision: 2,
      date: '2026-11-20',
      scale: '1 : 50',
      gridStyle: 'blueprint',
      showTitleBlock: true,
      activeLayerId: 'layer-base-1',
      layers: [
        {
          id: 'layer-base-1',
          name: '01 / Architecture',
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: 'source-over',
          elements: [
            {
              id: 'el-1',
              kind: 'rect',
              color: '#F0F7FF',
              size: 2.5,
              opacity: 1,
              x1: 140,
              y1: 140,
              x2: 560,
              y2: 420,
            },
            {
              id: 'el-2',
              kind: 'line',
              color: '#F0F7FF',
              size: 2,
              opacity: 1,
              x1: 360,
              y1: 140,
              x2: 360,
              y2: 420,
            },
            {
              id: 'el-3',
              kind: 'line',
              color: '#F0F7FF',
              size: 2,
              opacity: 1,
              x1: 140,
              y1: 280,
              x2: 360,
              y2: 280,
            },
            {
              id: 'el-4',
              kind: 'circle',
              color: '#5CE1E6',
              size: 2,
              opacity: 1,
              dashed: true,
              glow: true,
              x1: 410,
              y1: 230,
              x2: 510,
              y2: 330,
            },
          ],
        },
        {
          id: 'layer-notes-2',
          name: '02 / Annotations',
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: 'source-over',
          elements: [
            {
              id: 'el-5',
              kind: 'dimension',
              color: '#5CE1E6',
              size: 1.8,
              opacity: 1,
              x1: 140,
              y1: 108,
              x2: 560,
              y2: 108,
            },
            {
              id: 'el-6',
              kind: 'arrow',
              color: '#FFD166',
              size: 2.2,
              opacity: 1,
              x1: 580,
              y1: 220,
              x2: 680,
              y2: 180,
            },
            {
              id: 'el-7',
              kind: 'text',
              color: '#F0F7FF',
              size: 2,
              opacity: 1,
              x1: 700,
              y1: 174,
              text: 'BLUEPRINTNOTES // PHOTOCRAFT ENGINE',
              fontSize: 14,
            },
            {
              id: 'el-8',
              kind: 'text',
              color: '#A8CBE8',
              size: 2,
              opacity: 1,
              x1: 700,
              y1: 204,
              text: '• V: Seç & Taşı   I: Damlalık   G: Kova   S: Şekiller\n• R: Şekli 90° döndür   Ctrl+P: Komut Paleti\n• Sağdaki Katmanlar panelinden katman & efekt yönet',
              fontSize: 13,
            },
          ],
        },
      ],
    },
    {
      id: 'page-a102',
      code: 'A-102',
      title: 'Circuit & Math Notes',
      project: 'BLUEPRINTNOTES STUDIO',
      revision: 1,
      date: '2026-11-20',
      scale: 'NTS',
      gridStyle: 'blueprint',
      showTitleBlock: true,
      activeLayerId: 'layer-a102-1',
      layers: [
        {
          id: 'layer-a102-1',
          name: '01 / Main Layer',
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: 'source-over',
          elements: [],
        },
      ],
    },
  ],
};

/** Ensures any older saved vault without `layers` migrates cleanly */
export function migrateNotebook(data: NotebookData): NotebookData {
  return {
    ...data,
    pages: data.pages.map((p: DrawingPage) => {
      if (Array.isArray(p.layers) && p.layers.length > 0) {
        return {
          ...p,
          activeLayerId: p.activeLayerId || p.layers[0].id,
        };
      }
      const fallbackLayerId = `layer-${p.id}-1`;
      return {
        ...p,
        activeLayerId: fallbackLayerId,
        layers: [
          {
            id: fallbackLayerId,
            name: '01 / Main Layer',
            visible: true,
            locked: false,
            opacity: 1,
            blendMode: 'source-over',
            elements: Array.isArray(p.elements) ? p.elements : [],
          },
        ],
      };
    }),
  };
}
