import React from 'react';
import { ShapeKind } from '../types/drawing';

interface ShapesPopoverProps {
  activeShape: ShapeKind;
  dashed: boolean;
  filled: boolean;
  rotation: number;
  onSelectShape: (s: ShapeKind) => void;
  onToggleDashed: () => void;
  onToggleFilled: () => void;
  onChangeRotation: (deg: number) => void;
  onClose: () => void;
}

export const SHAPE_OPTIONS: { id: ShapeKind; label: string; svg: React.ReactNode }[] = [
  {
    id: 'line',
    label: 'ÇİZGİ',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="4" y1="20" x2="20" y2="4" />
      </svg>
    ),
  },
  {
    id: 'arrow',
    label: 'OK',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="5" y1="19" x2="19" y2="5" />
        <polyline points="10 5 19 5 19 14" />
      </svg>
    ),
  },
  {
    id: 'dimension',
    label: 'ÖLÇÜ',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="7" x2="3" y2="17" />
        <line x1="21" y1="7" x2="21" y2="17" />
        <polyline points="7 9 3 12 7 15" />
        <polyline points="17 9 21 12 17 15" />
      </svg>
    ),
  },
  {
    id: 'rect',
    label: 'KARE',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="5" width="16" height="14" />
      </svg>
    ),
  },
  {
    id: 'circle',
    label: 'DAİRE',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="8" />
      </svg>
    ),
  },
  {
    id: 'triangle',
    label: 'ÜÇGEN',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 4 21 19 3 19" />
      </svg>
    ),
  },
  {
    id: 'diamond',
    label: 'ELMAS',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 3 21 12 12 21 3 12" />
      </svg>
    ),
  },
  {
    id: 'hexagon',
    label: 'ALTIGEN',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 3 20 7.5 20 16.5 12 21 4 16.5 4 7.5" />
      </svg>
    ),
  },
  {
    id: 'star',
    label: 'YILDIZ',
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 3 14.9 8.8 21 9.7 16.5 14.1 17.6 20.2 12 17.3 6.4 20.2 7.5 14.1 3 9.7 9.1 8.8" />
      </svg>
    ),
  },
];

export const ShapesPopover: React.FC<ShapesPopoverProps> = ({
  activeShape,
  dashed,
  filled,
  rotation,
  onSelectShape,
  onToggleDashed,
  onToggleFilled,
  onChangeRotation,
  onClose,
}) => {
  return (
    <div className="bp-popover bp-shapes-popover" onClick={(e) => e.stopPropagation()}>
      <div className="bp-popover-header">
        <span>SHAPES // ŞEKİLLER</span>
        <button className="bp-popover-close" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="bp-shapes-grid">
        {SHAPE_OPTIONS.map((sh) => (
          <button
            key={sh.id}
            className={`bp-shape-tile ${activeShape === sh.id ? 'active' : ''}`}
            onClick={() => {
              onSelectShape(sh.id);
              onClose();
            }}
          >
            {sh.svg}
            <span>{sh.label}</span>
          </button>
        ))}
      </div>

      <div className="bp-wheel-brightness">
        <span className="bp-prop-label">YÖN / AÇI: {rotation}° (R: +90°)</span>
        <input
          type="range"
          min={0}
          max={360}
          step={15}
          value={rotation}
          className="bp-slider full"
          onChange={(e) => onChangeRotation(parseInt(e.target.value, 10) % 360)}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginTop: '2px' }}>
          {[
            { deg: 0, lbl: '↑ 0°' },
            { deg: 90, lbl: '→ 90°' },
            { deg: 180, lbl: '↓ 180°' },
            { deg: 270, lbl: '← 270°' },
          ].map((opt) => (
            <button
              key={opt.deg}
              className={`bp-tool-pill ${rotation === opt.deg ? 'active' : ''}`}
              style={{ padding: '3px 2px', fontSize: '9px' }}
              onClick={() => onChangeRotation(opt.deg)}
            >
              {opt.lbl}
            </button>
          ))}
        </div>
      </div>

      <div className="bp-shapes-toggles">
        <button
          className={`bp-tool-pill ${dashed ? 'active' : ''}`}
          onClick={onToggleDashed}
        >
          {dashed ? 'KESİKLİ' : 'DÜZ ÇİZGİ'}
        </button>
        <button
          className={`bp-tool-pill ${filled ? 'active' : ''}`}
          onClick={onToggleFilled}
        >
          {filled ? 'DOLGULU' : 'ÇERÇEVE'}
        </button>
      </div>
    </div>
  );
};
