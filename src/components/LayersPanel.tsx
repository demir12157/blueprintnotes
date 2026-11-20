import React from 'react';
import { BlendMode, Layer } from '../types/drawing';

interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: string;
  onSelectLayer: (id: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: (id: string) => void;
  onUpdateLayer: (id: string, patch: Partial<Layer>) => void;
  onMoveLayer: (id: string, dir: -1 | 1) => void;
}

const BLEND_MODES: { value: BlendMode; label: string }[] = [
  { value: 'source-over', label: 'Normal' },
  { value: 'screen', label: 'Screen' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'lighter', label: 'Add / Glow' },
];

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onSelectLayer,
  onAddLayer,
  onDeleteLayer,
  onUpdateLayer,
  onMoveLayer,
}) => {
  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[0];

  return (
    <aside className="bp-layers-panel">
      <div className="bp-pages-header">
        <span className="bp-section-title">KATMANLAR</span>
        <button className="bp-mini-action" onClick={onAddLayer} title="Yeni Katman Ekle">
          + KATMAN
        </button>
      </div>

      {/* Active Layer Blend Mode & Opacity */}
      {activeLayer && (
        <div className="bp-layer-controls">
          <div className="bp-layer-ctrl-row">
            <span className="bp-prop-label">KARIŞIM</span>
            <select
              className="bp-blend-select"
              value={activeLayer.blendMode}
              onChange={(e) =>
                onUpdateLayer(activeLayer.id, { blendMode: e.target.value as BlendMode })
              }
            >
              {BLEND_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="bp-layer-ctrl-row">
            <span className="bp-prop-label">OPAKLIK {Math.round(activeLayer.opacity * 100)}%</span>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={activeLayer.opacity}
              className="bp-slider"
              onChange={(e) =>
                onUpdateLayer(activeLayer.id, { opacity: parseFloat(e.target.value) })
              }
            />
          </div>
        </div>
      )}

      {/* Layer Stack (topmost layer rendered first visually) */}
      <div className="bp-pages-list">
        {[...layers].reverse().map((layer, revIdx) => {
          const isActive = layer.id === activeLayerId;
          const actualIndex = layers.length - 1 - revIdx;
          return (
            <div
              key={layer.id}
              className={`bp-layer-card ${isActive ? 'active' : ''} ${!layer.visible ? 'hidden-layer' : ''}`}
              onClick={() => onSelectLayer(layer.id)}
            >
              <div className="bp-layer-row-top">
                <button
                  className={`bp-layer-icon-btn ${layer.visible ? 'on' : ''}`}
                  title={layer.visible ? 'Gizle' : 'Göster'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateLayer(layer.id, { visible: !layer.visible });
                  }}
                >
                  {layer.visible ? '◉' : '○'}
                </button>
                <input
                  className="bp-layer-name-input"
                  value={layer.name}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => onUpdateLayer(layer.id, { name: e.target.value })}
                />
                <button
                  className={`bp-layer-icon-btn ${layer.locked ? 'locked' : ''}`}
                  title={layer.locked ? 'Kilidi Aç' : 'Kilitle'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateLayer(layer.id, { locked: !layer.locked });
                  }}
                >
                  {layer.locked ? '🔒' : '🔓'}
                </button>
              </div>
              <div className="bp-layer-row-bot">
                <span className="bp-page-meta">
                  {layer.elements.length} öğe • {Math.round(layer.opacity * 100)}%
                </span>
                <div className="bp-layer-mini-btns">
                  <button
                    className="bp-page-del"
                    disabled={actualIndex === layers.length - 1}
                    title="Yukarı Taşı"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveLayer(layer.id, 1);
                    }}
                  >
                    ↑
                  </button>
                  <button
                    className="bp-page-del"
                    disabled={actualIndex === 0}
                    title="Aşağı Taşı"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveLayer(layer.id, -1);
                    }}
                  >
                    ↓
                  </button>
                  {layers.length > 1 && (
                    <button
                      className="bp-page-del"
                      title="Katmanı Sil"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteLayer(layer.id);
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
