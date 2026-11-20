import React, { useEffect, useMemo, useState } from 'react';
import { DEFAULT_PENS, INITIAL_NOTEBOOK, migrateNotebook } from './data/initialNotebook';
import {
  DrawingElement,
  DrawingPage,
  GridStyle,
  Layer,
  NotebookData,
  PenPreset,
  ShapeKind,
  ToolId,
} from './types/drawing';
import { ToolRail } from './components/ToolRail';
import { BlueprintCanvas } from './components/BlueprintCanvas';
import { ShapesPopover } from './components/ShapesPopover';
import { ColorWheelPopover } from './components/ColorWheelPopover';
import { LayersPanel } from './components/LayersPanel';
import { CommandItem, CommandPalette } from './components/CommandPalette';
import { renderPageToPngDataUrl, translateElement } from './utils/canvasRenderer';

const STORAGE_KEY = 'blueprintnotes_drawboard_v2';

export default function App() {
  const [notebook, setNotebook] = useState<NotebookData>(INITIAL_NOTEBOOK);
  const [loaded, setLoaded] = useState(false);
  const [vaultPath, setVaultPath] = useState('~/Documents/BlueprintVault');
  const [showPagesSidebar, setShowPagesSidebar] = useState(true);
  const [showLayersPanel, setShowLayersPanel] = useState(true);
  const [cmdOpen, setCmdOpen] = useState(false);

  // Drawboard + PhotoCraft tool state
  const [activeTool, setActiveTool] = useState<ToolId>('pen1');
  const [activeShape, setActiveShape] = useState<ShapeKind>('rect');
  const [shapesOpen, setShapesOpen] = useState(false);
  const [colorWheelOpen, setColorWheelOpen] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const [pens, setPens] = useState<Record<'pen1' | 'pen2' | 'pen3' | 'highlighter', PenPreset>>(DEFAULT_PENS);
  const [shapeColor, setShapeColor] = useState('#F0F7FF');
  const [shapeSize, setShapeSize] = useState(2.5);
  const [strokeOpacity, setStrokeOpacity] = useState(1);
  const [dashed, setDashed] = useState(false);
  const [filled, setFilled] = useState(false);
  const [glow, setGlow] = useState(false);
  const [shapeRotation, setShapeRotation] = useState(0);
  const [snapGrid, setSnapGrid] = useState(true);

  // Viewport state
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 24, y: 20 });
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [toast, setToast] = useState<string | null>(null);

  // Undo / Redo stacks per page (stores Layer[] snapshots)
  const [undoStack, setUndoStack] = useState<Record<string, Layer[][]>>({});
  const [redoStack, setRedoStack] = useState<Record<string, Layer[][]>>({});

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  };

  useEffect(() => {
    async function init() {
      if (window.blueprintAPI) {
        const [p, saved] = await Promise.all([
          window.blueprintAPI.getVaultPath(),
          window.blueprintAPI.loadVault(),
        ]);
        if (p) setVaultPath(p);
        if (saved && Array.isArray(saved.pages) && saved.pages.length > 0) {
          setNotebook(migrateNotebook(saved));
        }
      } else {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as NotebookData;
            if (parsed.pages?.length) setNotebook(migrateNotebook(parsed));
          } catch {
            // fallback
          }
        }
      }
      setLoaded(true);
    }
    init();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const t = window.setTimeout(() => {
      if (window.blueprintAPI) {
        window.blueprintAPI.saveVault(notebook);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notebook));
      }
    }, 300);
    return () => window.clearTimeout(t);
  }, [notebook, loaded]);

  const activePage = useMemo(
    () => notebook.pages.find((p) => p.id === notebook.activePageId) || notebook.pages[0],
    [notebook]
  );

  const activeLayer = useMemo(
    () => activePage.layers.find((l) => l.id === activePage.activeLayerId) || activePage.layers[0],
    [activePage]
  );

  const totalElements = useMemo(
    () => activePage.layers.reduce((sum, l) => sum + l.elements.length, 0),
    [activePage]
  );

  const isPenSlot = (t: ToolId): t is 'pen1' | 'pen2' | 'pen3' | 'highlighter' =>
    t === 'pen1' || t === 'pen2' || t === 'pen3' || t === 'highlighter';

  const currentColor = isPenSlot(activeTool) ? pens[activeTool].color : shapeColor;
  const currentSize = isPenSlot(activeTool) ? pens[activeTool].size : shapeSize;
  const effectiveOpacity = activeTool === 'highlighter' ? pens.highlighter.opacity : strokeOpacity;

  const setCurrentColor = (hex: string) => {
    if (isPenSlot(activeTool)) {
      setPens((prev) => ({
        ...prev,
        [activeTool]: { ...prev[activeTool], color: hex },
      }));
    } else {
      setShapeColor(hex);
    }
  };

  const setCurrentSize = (sz: number) => {
    if (isPenSlot(activeTool)) {
      setPens((prev) => ({
        ...prev,
        [activeTool]: { ...prev[activeTool], size: sz },
      }));
    } else {
      setShapeSize(sz);
    }
  };

  const updateActivePage = (updater: (prev: DrawingPage) => DrawingPage) => {
    setNotebook((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => (p.id === activePage.id ? updater(p) : p)),
    }));
  };

  const pushHistory = (prevLayers: Layer[]) => {
    setUndoStack((prev) => ({
      ...prev,
      [activePage.id]: [...(prev[activePage.id] || []).slice(-39), prevLayers],
    }));
    setRedoStack((prev) => ({ ...prev, [activePage.id]: [] }));
  };

  const handleCommitElement = (el: DrawingElement) => {
    pushHistory(activePage.layers);
    updateActivePage((prev) => ({
      ...prev,
      layers: prev.layers.map((l) =>
        l.id === activeLayer.id ? { ...l, elements: [...l.elements, el] } : l
      ),
    }));
  };

  const handleUpdateElement = (id: string, updater: (el: DrawingElement) => DrawingElement) => {
    updateActivePage((prev) => ({
      ...prev,
      layers: prev.layers.map((l) =>
        l.id === activeLayer.id
          ? { ...l, elements: l.elements.map((e) => (e.id === id ? updater(e) : e)) }
          : l
      ),
    }));
  };

  const handleEraseElements = (ids: string[]) => {
    if (ids.length === 0) return;
    pushHistory(activePage.layers);
    const idSet = new Set(ids);
    if (selectedElementId && idSet.has(selectedElementId)) setSelectedElementId(null);
    updateActivePage((prev) => ({
      ...prev,
      layers: prev.layers.map((l) =>
        l.id === activeLayer.id
          ? { ...l, elements: l.elements.filter((el) => !idSet.has(el.id)) }
          : l
      ),
    }));
  };

  const handleAddLayer = () => {
    pushHistory(activePage.layers);
    const num = String(activePage.layers.length + 1).padStart(2, '0');
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `${num} / Layer ${activePage.layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'source-over',
      elements: [],
    };
    updateActivePage((prev) => ({
      ...prev,
      activeLayerId: newLayer.id,
      layers: [...prev.layers, newLayer],
    }));
    showToast(`YENİ KATMAN: ${newLayer.name}`);
  };

  const handleDeleteLayer = (id: string) => {
    if (activePage.layers.length <= 1) return;
    pushHistory(activePage.layers);
    updateActivePage((prev) => {
      const remaining = prev.layers.filter((l) => l.id !== id);
      return {
        ...prev,
        activeLayerId: prev.activeLayerId === id ? remaining[remaining.length - 1].id : prev.activeLayerId,
        layers: remaining,
      };
    });
  };

  const handleUpdateLayer = (id: string, patch: Partial<Layer>) => {
    updateActivePage((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  };

  const handleMoveLayer = (id: string, dir: -1 | 1) => {
    const idx = activePage.layers.findIndex((l) => l.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= activePage.layers.length) return;
    pushHistory(activePage.layers);
    updateActivePage((prev) => {
      const next = [...prev.layers];
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      return { ...prev, layers: next };
    });
  };

  const handleUndo = () => {
    const stack = undoStack[activePage.id] || [];
    if (stack.length === 0) return;
    const previous = stack[stack.length - 1];
    setUndoStack((prev) => ({ ...prev, [activePage.id]: stack.slice(0, -1) }));
    setRedoStack((prev) => ({
      ...prev,
      [activePage.id]: [...(prev[activePage.id] || []), activePage.layers],
    }));
    updateActivePage((prev) => ({ ...prev, layers: previous }));
  };

  const handleRedo = () => {
    const stack = redoStack[activePage.id] || [];
    if (stack.length === 0) return;
    const next = stack[stack.length - 1];
    setRedoStack((prev) => ({ ...prev, [activePage.id]: stack.slice(0, -1) }));
    setUndoStack((prev) => ({
      ...prev,
      [activePage.id]: [...(prev[activePage.id] || []), activePage.layers],
    }));
    updateActivePage((prev) => ({ ...prev, layers: next }));
  };

  const handleClearActiveLayer = () => {
    if (activeLayer.elements.length === 0) return;
    pushHistory(activePage.layers);
    setSelectedElementId(null);
    updateActivePage((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === activeLayer.id ? { ...l, elements: [] } : l)),
    }));
    showToast(`${activeLayer.name} TEMİZLENDİ (CTRL+Z İLE GERİ AL)`);
  };

  const handleNewPage = () => {
    const num = 100 + notebook.pages.length + 1;
    const layerId = `layer-${Date.now()}`;
    const newPage: DrawingPage = {
      id: `page-${Date.now()}`,
      code: `D-${num}`,
      title: `Çizim Sayfası ${num}`,
      project: 'BLUEPRINTNOTES STUDIO',
      revision: 1,
      date: new Date().toISOString().slice(0, 10),
      scale: '1 : 1',
      gridStyle: 'blueprint',
      showTitleBlock: true,
      activeLayerId: layerId,
      layers: [
        {
          id: layerId,
          name: '01 / Main Layer',
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: 'source-over',
          elements: [],
        },
      ],
    };
    setNotebook((prev) => ({
      activePageId: newPage.id,
      pages: [...prev.pages, newPage],
    }));
    showToast(`YENİ SAYFA: ${newPage.code}`);
  };

  const handleDeletePage = (pageId: string) => {
    if (notebook.pages.length <= 1) return;
    setNotebook((prev) => {
      const remaining = prev.pages.filter((p) => p.id !== pageId);
      return {
        activePageId: prev.activePageId === pageId ? remaining[0].id : prev.activePageId,
        pages: remaining,
      };
    });
  };

  const handleSavePng = async () => {
    const dataUrl = renderPageToPngDataUrl(activePage);
    const filename = `${activePage.code.toLowerCase()}-${activePage.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}.png`;

    if (window.blueprintAPI) {
      const res = await window.blueprintAPI.exportPng({ filename, dataUrl });
      if (res.ok) showToast(`PNG KAYDEDİLDİ: ${filename}`);
    } else {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = filename;
      a.click();
      showToast(`PNG İNDİRİLDİ: ${filename}`);
    }
  };

  const cycleGrid = () => {
    const order: GridStyle[] = ['blueprint', 'dots', 'blank'];
    const next = order[(order.indexOf(activePage.gridStyle) + 1) % order.length];
    updateActivePage((prev) => ({ ...prev, gridStyle: next }));
  };

  const commands: CommandItem[] = [
    { id: 'cmd-new-layer', label: 'Katman: Yeni Katman Ekle', action: handleAddLayer },
    { id: 'cmd-new-page', label: 'Sayfa: Yeni Çizim Sayfası Oluştur', action: handleNewPage },
    { id: 'cmd-png', label: 'Dışa Aktar: PNG Olarak Kaydet', shortcut: 'Ctrl+S', action: handleSavePng },
    { id: 'cmd-select', label: 'Araç: Seç ve Taşı', shortcut: 'V', action: () => setActiveTool('select') },
    { id: 'cmd-shapes', label: 'Araç: Şekiller Menüsü', shortcut: 'S', action: () => { setActiveTool('shapes'); setShapesOpen(true); } },
    { id: 'cmd-fill', label: 'Araç: Boya Kovası / Dolgu', shortcut: 'G', action: () => setActiveTool('fill') },
    { id: 'cmd-eye', label: 'Araç: Renk Damlalığı', shortcut: 'I', action: () => setActiveTool('eyedropper') },
    { id: 'cmd-wheel', label: 'Renk: HSV Renk Çarkını Aç', shortcut: 'K', action: () => setColorWheelOpen(true) },
    { id: 'cmd-glow', label: `Efekt: Neon Blueprint Glow (${glow ? 'Kapat' : 'Aç'})`, action: () => setGlow((g) => !g) },
    { id: 'cmd-grid', label: 'Görünüm: Izgara Stilini Değiştir', action: cycleGrid },
    { id: 'cmd-layers', label: 'Panel: Katmanlar Panelini Aç/Kapat', action: () => setShowLayersPanel((v) => !v) },
    { id: 'cmd-clear', label: 'Katman: Aktif Katmanı Temizle', action: handleClearActiveLayer },
  ];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setCmdOpen((v) => !v);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSavePng();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selectedElementId) {
        e.preventDefault();
        const sel = activeLayer.elements.find((el) => el.id === selectedElementId);
        if (sel) {
          const copy = translateElement({ ...sel, id: `el-${Date.now()}` }, 24, 24);
          handleCommitElement(copy);
          setSelectedElementId(copy.id);
          showToast('ÖĞE ÇOĞALTILDI');
        }
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        e.preventDefault();
        handleEraseElements([selectedElementId]);
      } else if (!e.ctrlKey && !e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === 'v') { setActiveTool('select'); setShapesOpen(false); }
        else if (k === '1') { setActiveTool('pen1'); setShapesOpen(false); }
        else if (k === '2') { setActiveTool('pen2'); setShapesOpen(false); }
        else if (k === '3') { setActiveTool('pen3'); setShapesOpen(false); }
        else if (k === '4') { setActiveTool('highlighter'); setShapesOpen(false); }
        else if (k === 'e') { setActiveTool('eraser'); setShapesOpen(false); }
        else if (k === 's') { setActiveTool('shapes'); setShapesOpen((v) => !v); setColorWheelOpen(false); }
        else if (k === 'g') { setActiveTool('fill'); setShapesOpen(false); }
        else if (k === 'i') { setActiveTool('eyedropper'); setShapesOpen(false); }
        else if (k === 'r') { setShapeRotation((deg) => (deg + 90) % 360); }
        else if (k === '[') { setShapeRotation((deg) => (deg + 345) % 360); }
        else if (k === ']') { setShapeRotation((deg) => (deg + 15) % 360); }
        else if (k === 'k') { setColorWheelOpen((v) => !v); setShapesOpen(false); }
        else if (k === 't') { setActiveTool('text'); setShapesOpen(false); }
        else if (k === 'h') { setActiveTool('hand'); setShapesOpen(false); }
        else if (k === 'escape') { setShapesOpen(false); setColorWheelOpen(false); setCmdOpen(false); setSelectedElementId(null); }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const canUndo = (undoStack[activePage.id]?.length || 0) > 0;
  const canRedo = (redoStack[activePage.id]?.length || 0) > 0;
  const api = window.blueprintAPI;

  return (
    <div
      className="bp-app"
      onClick={() => {
        if (shapesOpen) setShapesOpen(false);
        if (colorWheelOpen) setColorWheelOpen(false);
      }}
    >
      {/* 1. TOP TITLEBAR */}
      <header className="bp-titlebar">
        <div className="bp-titlebar-left bp-no-drag">
          <button
            className={`bp-icon-btn ${showPagesSidebar ? 'active' : ''}`}
            onClick={() => setShowPagesSidebar((s) => !s)}
            title="Sayfa Panelini Aç/Kapat"
          >
            ☰
          </button>
          <img src="./logo.png" alt="BlueprintNotes Logo" className="bp-app-logo" />
          <span className="bp-brand-name">BLUEPRINTNOTES</span>
          <span className="bp-brand-sub">// STUDIO</span>
        </div>

        <div className="bp-tabs bp-no-drag">
          {notebook.pages.map((p) => (
            <button
              key={p.id}
              className={`bp-tab ${p.id === activePage.id ? 'active' : ''}`}
              onClick={() => {
                setNotebook((prev) => ({ ...prev, activePageId: p.id }));
                setSelectedElementId(null);
              }}
            >
              <span className="bp-tab-code">{p.code}</span>
              <span className="bp-tab-name">{p.title}</span>
            </button>
          ))}
        </div>

        <div className="bp-titlebar-right bp-no-drag">
          <button className="bp-icon-btn" onClick={() => setCmdOpen(true)} title="Komut Paleti (Ctrl+P)">
            ⌘ CTRL+P
          </button>
          <button
            className={`bp-icon-btn ${showLayersPanel ? 'active' : ''}`}
            onClick={() => setShowLayersPanel((v) => !v)}
            title="Katmanlar Panelini Aç/Kapat"
          >
            KATMANLAR
          </button>
          <button className="bp-cta-btn" onClick={handleSavePng} title="PNG olarak kaydet (Ctrl+S)">
            SAVE PNG
          </button>
          <div className="bp-win-controls">
            <button className="bp-win-btn" onClick={() => api?.minimize()} title="Küçült">
              —
            </button>
            <button className="bp-win-btn" onClick={() => api?.maximize()} title="Büyüt">
              □
            </button>
            <button className="bp-win-btn close" onClick={() => api?.close()} title="Kapat">
              ×
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <main className="bp-workspace">
        {/* 2A. LEFT TOOL RAIL */}
        <ToolRail
          activeTool={activeTool}
          activeShape={activeShape}
          currentColor={currentColor}
          shapesOpen={shapesOpen}
          colorWheelOpen={colorWheelOpen}
          pens={pens}
          onSelectTool={(t) => {
            setActiveTool(t);
            if (t !== 'shapes') setShapesOpen(false);
            if (t !== 'select') setSelectedElementId(null);
          }}
          onToggleShapesPopover={() => {
            setShapesOpen((v) => !v);
            setColorWheelOpen(false);
          }}
          onToggleColorWheel={() => {
            setColorWheelOpen((v) => !v);
            setShapesOpen(false);
          }}
        />

        {shapesOpen && (
          <ShapesPopover
            activeShape={activeShape}
            dashed={dashed}
            filled={filled}
            rotation={shapeRotation}
            onSelectShape={(s) => {
              setActiveShape(s);
              setActiveTool('shapes');
            }}
            onToggleDashed={() => setDashed((d) => !d)}
            onToggleFilled={() => setFilled((f) => !f)}
            onChangeRotation={setShapeRotation}
            onClose={() => setShapesOpen(false)}
          />
        )}

        {colorWheelOpen && (
          <ColorWheelPopover
            color={currentColor}
            onChange={setCurrentColor}
            onClose={() => setColorWheelOpen(false)}
          />
        )}

        {/* 2B. PAGES SIDEBAR */}
        {showPagesSidebar && (
          <aside className="bp-pages-sidebar">
            <div className="bp-pages-header">
              <span className="bp-section-title">SAYFALAR</span>
              <button className="bp-mini-action" onClick={handleNewPage}>
                + YENİ
              </button>
            </div>

            <div className="bp-pages-list">
              {notebook.pages.map((page) => {
                const isActive = page.id === activePage.id;
                const count = page.layers.reduce((s, l) => s + l.elements.length, 0);
                return (
                  <div
                    key={page.id}
                    className={`bp-page-card ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setNotebook((prev) => ({ ...prev, activePageId: page.id }));
                      setSelectedElementId(null);
                    }}
                  >
                    <div className="bp-page-card-top">
                      <span className="bp-page-code">{page.code}</span>
                      <span className="bp-page-meta">{count} öğe</span>
                      {notebook.pages.length > 1 && (
                        <button
                          className="bp-page-del"
                          title="Sayfayı sil"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePage(page.id);
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <input
                      className="bp-page-title-input"
                      value={page.title}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNotebook((prev) => ({
                          ...prev,
                          pages: prev.pages.map((p) =>
                            p.id === page.id ? { ...p, title: val } : p
                          ),
                        }));
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="bp-vault-footer">
              <span className="bp-vault-status">● OTOMATİK KAYIT AKTİF</span>
              <span className="bp-vault-path" title={vaultPath}>
                {vaultPath}
              </span>
            </div>
          </aside>
        )}

        {/* 2C. CENTER DRAWING STUDIO */}
        <section className="bp-studio-col">
          <div className="bp-props-bar">
            <div className="bp-props-group">
              <button
                className={`bp-color-trigger ${colorWheelOpen ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setColorWheelOpen((v) => !v);
                  setShapesOpen(false);
                }}
                title="Renk Çarkını Aç (K)"
              >
                <span className="bp-wheel-ring-icon small">
                  <span className="bp-wheel-ring-inner" style={{ backgroundColor: currentColor }} />
                </span>
                <span>{currentColor}</span>
              </button>

              <span className="bp-prop-label">KAL {currentSize.toFixed(1)}</span>
              <input
                className="bp-slider"
                type="range"
                min={1}
                max={activeTool === 'highlighter' ? 40 : 16}
                step={0.5}
                value={currentSize}
                onChange={(e) => setCurrentSize(parseFloat(e.target.value))}
              />

              <span className="bp-prop-label">OPK {Math.round(effectiveOpacity * 100)}%</span>
              <input
                className="bp-slider"
                style={{ width: '58px' }}
                type="range"
                min={0.15}
                max={1}
                step={0.05}
                value={effectiveOpacity}
                onChange={(e) => setStrokeOpacity(parseFloat(e.target.value))}
              />

              <button
                className={`bp-tool-pill ${dashed ? 'active' : ''}`}
                onClick={() => setDashed((d) => !d)}
              >
                {dashed ? 'KESİKLİ' : 'DÜZ'}
              </button>
              <button
                className={`bp-tool-pill ${glow ? 'active' : ''}`}
                onClick={() => setGlow((g) => !g)}
                title="Neon Blueprint Parlama Efekti"
              >
                GLOW
              </button>
              {activeTool === 'shapes' && (
                <>
                  <button
                    className={`bp-tool-pill ${filled ? 'active' : ''}`}
                    onClick={() => setFilled((f) => !f)}
                  >
                    {filled ? 'DOLGULU' : 'ÇERÇEVE'}
                  </button>
                  <button
                    className="bp-tool-pill active"
                    onClick={() => setShapeRotation((deg) => (deg + 90) % 360)}
                    title="Şekli 90° döndür (R)"
                  >
                    ↻ {shapeRotation}°
                  </button>
                </>
              )}
            </div>

            <div className="bp-props-group">
              <button className="bp-tool-pill" onClick={cycleGrid}>
                {activePage.gridStyle.toUpperCase()}
              </button>
              <button
                className={`bp-tool-pill ${snapGrid ? 'active' : ''}`}
                onClick={() => setSnapGrid((s) => !s)}
              >
                SNAP
              </button>
              <button
                className={`bp-tool-pill ${activePage.showTitleBlock ? 'active' : ''}`}
                onClick={() =>
                  updateActivePage((prev) => ({
                    ...prev,
                    showTitleBlock: !prev.showTitleBlock,
                  }))
                }
              >
                BAŞLIK
              </button>
            </div>

            <div className="bp-props-group">
              <button className="bp-tool-pill" disabled={!canUndo} onClick={handleUndo}>
                GERİ
              </button>
              <button className="bp-tool-pill" disabled={!canRedo} onClick={handleRedo}>
                İLERİ
              </button>
              <button
                className="bp-tool-pill"
                onClick={() => {
                  setZoom(0.8);
                  setPan({ x: 24, y: 20 });
                }}
              >
                {Math.round(zoom * 100)}%
              </button>
              <button className="bp-tool-pill danger" onClick={handleClearActiveLayer}>
                TEMİZLE
              </button>
            </div>
          </div>

          <BlueprintCanvas
            page={activePage}
            activeTool={activeTool}
            activeShape={activeShape}
            strokeColor={currentColor}
            strokeSize={currentSize}
            strokeOpacity={effectiveOpacity}
            dashed={dashed}
            filled={filled}
            glow={glow}
            shapeRotation={shapeRotation}
            snapGrid={snapGrid}
            zoom={zoom}
            pan={pan}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onZoomChange={setZoom}
            onPanChange={setPan}
            onCommitElement={handleCommitElement}
            onUpdateElement={handleUpdateElement}
            onEraseElements={handleEraseElements}
            onSampleColor={(hex) => {
              setCurrentColor(hex);
              showToast(`RENK ALINDI: ${hex}`);
            }}
            onCursorMove={setCursor}
            onCanvasInteract={() => {
              if (shapesOpen) setShapesOpen(false);
              if (colorWheelOpen) setColorWheelOpen(false);
            }}
            onLockedLayerWarning={() => showToast('BU KATMAN KİLİTLİ VEYA GİZLİ')}
          />
        </section>

        {/* 2D. RIGHT LAYERS PANEL (PhotoCraft) */}
        {showLayersPanel && (
          <LayersPanel
            layers={activePage.layers}
            activeLayerId={activeLayer.id}
            onSelectLayer={(id) => {
              updateActivePage((prev) => ({ ...prev, activeLayerId: id }));
              setSelectedElementId(null);
            }}
            onAddLayer={handleAddLayer}
            onDeleteLayer={handleDeleteLayer}
            onUpdateLayer={handleUpdateLayer}
            onMoveLayer={handleMoveLayer}
          />
        )}
      </main>

      {/* 3. BOTTOM STATUS BAR */}
      <footer className="bp-statusbar">
        <div className="bp-status-left">
          <span>
            ARAÇ: {activeTool === 'shapes' ? `ŞEKİL (${activeShape.toUpperCase()})` : activeTool.toUpperCase()}
          </span>
          <span>|</span>
          <span>KATMAN: {activeLayer.name}</span>
          <span>|</span>
          <span>ÖĞE: {totalElements}</span>
          <span>|</span>
          <span>
            X:{cursor.x} Y:{cursor.y}
          </span>
        </div>
        <div className="bp-status-right">
          <span>CTRL+P: KOMUT PALETİ</span>
          <span>|</span>
          <span>CYANOTYPE STUDIO</span>
        </div>
      </footer>

      {cmdOpen && <CommandPalette commands={commands} onClose={() => setCmdOpen(false)} />}
      {toast && <div className="bp-toast">{toast}</div>}
    </div>
  );
}
