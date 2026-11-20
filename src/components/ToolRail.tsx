import React from 'react';
import { PenPreset, ShapeKind, ToolId } from '../types/drawing';
import { SHAPE_OPTIONS } from './ShapesPopover';

interface ToolRailProps {
  activeTool: ToolId;
  activeShape: ShapeKind;
  currentColor: string;
  shapesOpen: boolean;
  colorWheelOpen: boolean;
  pens: Record<'pen1' | 'pen2' | 'pen3' | 'highlighter', PenPreset>;
  onSelectTool: (t: ToolId) => void;
  onToggleShapesPopover: () => void;
  onToggleColorWheel: () => void;
}

export const ToolRail: React.FC<ToolRailProps> = ({
  activeTool,
  activeShape,
  currentColor,
  shapesOpen,
  colorWheelOpen,
  pens,
  onSelectTool,
  onToggleShapesPopover,
  onToggleColorWheel,
}) => {
  const penTools: ('pen1' | 'pen2' | 'pen3' | 'highlighter')[] = [
    'pen1',
    'pen2',
    'pen3',
    'highlighter',
  ];

  const currentShapeOpt =
    SHAPE_OPTIONS.find((s) => s.id === activeShape) || SHAPE_OPTIONS[3];

  return (
    <nav className="bp-tool-rail" aria-label="Drawing Tools">
      {/* Select & Move Tool (PhotoCraft) */}
      <button
        className={`bp-rail-btn ${activeTool === 'select' ? 'active' : ''}`}
        onClick={() => onSelectTool('select')}
        title="Seç ve Taşı (V)"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 3l14 9-7 1.5L9 21 5 3z" />
        </svg>
        <span className="bp-rail-label">SEÇ</span>
      </button>

      <div className="bp-rail-divider" />

      {penTools.map((pid, idx) => {
        const pen = pens[pid];
        return (
          <button
            key={pid}
            className={`bp-rail-btn ${activeTool === pid ? 'active' : ''}`}
            onClick={() => onSelectTool(pid)}
            title={`${pen.label} (${idx + 1})`}
          >
            <span
              className="bp-pen-dot"
              style={{
                backgroundColor: pen.color,
                opacity: pid === 'highlighter' ? 0.55 : 1,
                borderRadius: pid === 'highlighter' ? '2px' : '50%',
              }}
            />
            <span className="bp-rail-label">{pen.label}</span>
          </button>
        );
      })}

      <button
        className={`bp-rail-btn ${activeTool === 'eraser' ? 'active' : ''}`}
        onClick={() => onSelectTool('eraser')}
        title="Silgi (E)"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 20H7L3 16c-.8-.8-.8-2 0-2.8L13.8 2.4c.8-.8 2-.8 2.8 0L21.6 7.4c.8.8.8 2 0 2.8L11 20" />
        </svg>
        <span className="bp-rail-label">SİLGİ</span>
      </button>

      <div className="bp-rail-divider" />

      {/* Unified Shapes Tool */}
      <button
        className={`bp-rail-btn has-menu ${activeTool === 'shapes' || shapesOpen ? 'active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelectTool('shapes');
          onToggleShapesPopover();
        }}
        title="Şekiller Aracı (S)"
      >
        {currentShapeOpt.svg}
        <span className="bp-rail-label">ŞEKİL</span>
        <span className="bp-rail-caret">▸</span>
      </button>

      {/* Fill Bucket Tool (PhotoCraft) */}
      <button
        className={`bp-rail-btn ${activeTool === 'fill' ? 'active' : ''}`}
        onClick={() => onSelectTool('fill')}
        title="Boya Kovası / Dolgu (G)"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 11l-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11z" />
          <path d="M20 14s2 2.2 2 3.5a2 2 0 1 1-4 0c0-1.3 2-3.5 2-3.5z" />
        </svg>
        <span className="bp-rail-label">KOVA</span>
      </button>

      {/* Eyedropper Tool (PhotoCraft) */}
      <button
        className={`bp-rail-btn ${activeTool === 'eyedropper' ? 'active' : ''}`}
        onClick={() => onSelectTool('eyedropper')}
        title="Renk Damlalığı (I)"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 22l4-1 11-11-3-3L3 18l-1 4z" />
          <path d="M14 7l3 3" />
          <path d="M16 5l2-2 3 3-2 2" />
        </svg>
        <span className="bp-rail-label">DAMLA</span>
      </button>

      <button
        className={`bp-rail-btn ${activeTool === 'text' ? 'active' : ''}`}
        onClick={() => onSelectTool('text')}
        title="Metin Notu (T)"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
        <span className="bp-rail-label">METİN</span>
      </button>

      <button
        className={`bp-rail-btn ${activeTool === 'hand' ? 'active' : ''}`}
        onClick={() => onSelectTool('hand')}
        title="Tuvali Kaydır (H veya Space)"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 11V6a2 2 0 0 0-4 0v5" />
          <path d="M14 10V4a2 2 0 0 0-4 0v6" />
          <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-5.7-2.4L3.4 16a2 2 0 0 1 2.8-2.8L8 15" />
        </svg>
        <span className="bp-rail-label">EL</span>
      </button>

      <div className="bp-rail-divider" />

      {/* Color Wheel Trigger */}
      <button
        className={`bp-rail-btn ${colorWheelOpen ? 'active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleColorWheel();
        }}
        title="Renk Çarkı (K)"
      >
        <span className="bp-wheel-ring-icon">
          <span className="bp-wheel-ring-inner" style={{ backgroundColor: currentColor }} />
        </span>
        <span className="bp-rail-label">RENK</span>
      </button>
    </nav>
  );
};
