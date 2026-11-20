import React, { useEffect, useRef, useState } from 'react';
import { DrawingElement, DrawingPage, Point, ShapeKind, ToolId } from '../types/drawing';
import {
  drawElement,
  drawGridAndSheet,
  getElementBounds,
  hitTestElement,
  SHEET_HEIGHT,
  SHEET_WIDTH,
  translateElement,
} from '../utils/canvasRenderer';

interface BlueprintCanvasProps {
  page: DrawingPage;
  activeTool: ToolId;
  activeShape: ShapeKind;
  strokeColor: string;
  strokeSize: number;
  strokeOpacity: number;
  dashed: boolean;
  filled: boolean;
  glow: boolean;
  shapeRotation: number;
  snapGrid: boolean;
  zoom: number;
  pan: { x: number; y: number };
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onZoomChange: (nextZoom: number) => void;
  onPanChange: (nextPan: { x: number; y: number }) => void;
  onCommitElement: (el: DrawingElement) => void;
  onUpdateElement: (id: string, updater: (el: DrawingElement) => DrawingElement) => void;
  onEraseElements: (ids: string[]) => void;
  onSampleColor: (hex: string) => void;
  onCursorMove: (pt: { x: number; y: number }) => void;
  onCanvasInteract: () => void;
  onLockedLayerWarning: () => void;
}

export const BlueprintCanvas: React.FC<BlueprintCanvasProps> = ({
  page,
  activeTool,
  activeShape,
  strokeColor,
  strokeSize,
  strokeOpacity,
  dashed,
  filled,
  glow,
  shapeRotation,
  snapGrid,
  zoom,
  pan,
  selectedElementId,
  onSelectElement,
  onZoomChange,
  onPanChange,
  onCommitElement,
  onUpdateElement,
  onEraseElements,
  onSampleColor,
  onCursorMove,
  onCanvasInteract,
  onLockedLayerWarning,
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewportSize, setViewportSize] = useState({ w: 1000, h: 720 });
  const [spacePressed, setSpacePressed] = useState(false);

  const draftRef = useRef<DrawingElement | null>(null);
  const isDrawingRef = useRef(false);
  const isPanningRef = useRef(false);
  const isMovingRef = useRef(false);
  const moveStartRef = useRef<{ x: number; y: number; orig: DrawingElement | null }>({
    x: 0,
    y: 0,
    orig: null,
  });
  const panStartRef = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const erasedDuringDragRef = useRef<Set<string>>(new Set());

  const [textInput, setTextInput] = useState<{
    sheetX: number;
    sheetY: number;
    screenX: number;
    screenY: number;
    value: string;
  } | null>(null);

  const activeLayer = page.layers.find((l) => l.id === page.activeLayerId) || page.layers[0];

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setViewportSize({ w: Math.max(100, rect.width), h: Math.max(100, rect.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !textInput && document.activeElement?.tagName !== 'INPUT') {
        setSpacePressed(true);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpacePressed(false);
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [textInput]);

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = viewportSize.w;
    const h = viewportSize.h;

    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#07182E';
    ctx.fillRect(0, 0, w, h);

    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#0B2545';
    ctx.fillRect(0, 0, SHEET_WIDTH, SHEET_HEIGHT);
    ctx.shadowBlur = 0;

    drawGridAndSheet(ctx, page);

    // Render all visible layers in order
    for (const layer of page.layers) {
      if (!layer.visible) continue;
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.blendMode;
      for (const el of layer.elements) {
        drawElement(ctx, el);
      }
      if (layer.id === activeLayer?.id && draftRef.current) {
        drawElement(ctx, draftRef.current);
      }
      ctx.restore();
    }

    // Draw selection box around selected element
    if (selectedElementId && activeLayer) {
      const sel = activeLayer.elements.find((e) => e.id === selectedElementId);
      if (sel) {
        const b = getElementBounds(sel);
        if (b) {
          ctx.save();
          ctx.strokeStyle = '#5CE1E6';
          ctx.lineWidth = 1.5 / zoom;
          ctx.setLineDash([6 / zoom, 4 / zoom]);
          ctx.strokeRect(b.x, b.y, b.w, b.h);
          ctx.setLineDash([]);
          ctx.fillStyle = '#5CE1E6';
          const hs = 6 / zoom;
          for (const [cx, cy] of [
            [b.x, b.y],
            [b.x + b.w, b.y],
            [b.x, b.y + b.h],
            [b.x + b.w, b.y + b.h],
          ]) {
            ctx.fillRect(cx - hs / 2, cy - hs / 2, hs, hs);
          }
          ctx.restore();
        }
      }
    }

    ctx.restore();
  };

  useEffect(() => {
    redraw();
  });

  const screenToSheet = (clientX: number, clientY: number, applySnap = false): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    let x = (clientX - rect.left - pan.x) / zoom;
    let y = (clientY - rect.top - pan.y) / zoom;
    if (applySnap && snapGrid) {
      x = Math.round(x / 20) * 20;
      y = Math.round(y / 20) * 20;
    }
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    onCanvasInteract();

    if (textInput) {
      commitTextInput();
      return;
    }

    if (e.button === 1 || spacePressed || activeTool === 'hand') {
      isPanningRef.current = true;
      panStartRef.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    if (e.button !== 0) return;

    // Eyedropper tool (works even on locked layers!)
    if (activeTool === 'eyedropper') {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const sx = Math.floor((e.clientX - rect.left) * dpr);
      const sy = Math.floor((e.clientY - rect.top) * dpr);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        const px = ctx.getImageData(sx, sy, 1, 1).data;
        const hex =
          '#' +
          [px[0], px[1], px[2]]
            .map((v) => v.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase();
        onSampleColor(hex);
      }
      return;
    }

    if (!activeLayer || activeLayer.locked || !activeLayer.visible) {
      onLockedLayerWarning();
      return;
    }

    const isShape = activeTool === 'shapes';
    const pt = screenToSheet(e.clientX, e.clientY, isShape);

    // Select & Move tool
    if (activeTool === 'select') {
      const hit = [...activeLayer.elements].reverse().find((el) => hitTestElement(el, pt));
      if (hit) {
        onSelectElement(hit.id);
        isMovingRef.current = true;
        moveStartRef.current = { x: pt.x, y: pt.y, orig: hit };
        e.currentTarget.setPointerCapture(e.pointerId);
      } else {
        onSelectElement(null);
      }
      return;
    }

    // Fill Bucket tool
    if (activeTool === 'fill') {
      const hit = [...activeLayer.elements].reverse().find((el) => hitTestElement(el, pt));
      if (hit) {
        onUpdateElement(hit.id, (el) => ({
          ...el,
          color: strokeColor,
          filled: el.kind === 'path' || el.kind === 'line' || el.kind === 'arrow' || el.kind === 'dimension' || el.kind === 'text' ? el.filled : true,
        }));
      }
      return;
    }

    if (activeTool === 'text') {
      const rect = canvasRef.current!.getBoundingClientRect();
      setTextInput({
        sheetX: pt.x,
        sheetY: pt.y,
        screenX: e.clientX - rect.left,
        screenY: e.clientY - rect.top,
        value: '',
      });
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    if (activeTool === 'eraser') {
      erasedDuringDragRef.current = new Set();
      const hits = activeLayer.elements.filter((el) => hitTestElement(el, pt)).map((el) => el.id);
      if (hits.length > 0) {
        hits.forEach((id) => erasedDuringDragRef.current.add(id));
        onEraseElements(hits);
      }
      return;
    }

    if (activeTool === 'pen1' || activeTool === 'pen2' || activeTool === 'pen3' || activeTool === 'highlighter') {
      draftRef.current = {
        id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: 'path',
        color: strokeColor,
        size: strokeSize,
        opacity: strokeOpacity,
        dashed: activeTool !== 'highlighter' && dashed,
        glow: activeTool !== 'highlighter' && glow,
        points: [{ x: pt.x, y: pt.y, p: e.pressure || 0.5 }],
      };
      redraw();
      return;
    }

    if (isShape) {
      draftRef.current = {
        id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        kind: activeShape,
        color: strokeColor,
        size: strokeSize,
        opacity: strokeOpacity,
        dashed,
        filled,
        glow,
        rotation: shapeRotation,
        x1: pt.x,
        y1: pt.y,
        x2: pt.x,
        y2: pt.y,
      };
      redraw();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rawPt = screenToSheet(e.clientX, e.clientY, false);
    onCursorMove({ x: Math.round(rawPt.x), y: Math.round(rawPt.y) });

    if (isPanningRef.current) {
      const dx = e.clientX - panStartRef.current.mx;
      const dy = e.clientY - panStartRef.current.my;
      onPanChange({ x: panStartRef.current.px + dx, y: panStartRef.current.py + dy });
      return;
    }

    if (isMovingRef.current && moveStartRef.current.orig) {
      const dx = rawPt.x - moveStartRef.current.x;
      const dy = rawPt.y - moveStartRef.current.y;
      const orig = moveStartRef.current.orig;
      onUpdateElement(orig.id, () => translateElement(orig, dx, dy));
      return;
    }

    if (!isDrawingRef.current) return;

    if (activeTool === 'eraser' && activeLayer) {
      const hits = activeLayer.elements
        .filter((el) => !erasedDuringDragRef.current.has(el.id) && hitTestElement(el, rawPt))
        .map((el) => el.id);
      if (hits.length > 0) {
        hits.forEach((id) => erasedDuringDragRef.current.add(id));
        onEraseElements(hits);
      }
      return;
    }

    const draft = draftRef.current;
    if (!draft) return;

    if (draft.kind === 'path' && draft.points) {
      const last = draft.points[draft.points.length - 1];
      if (Math.hypot(rawPt.x - last.x, rawPt.y - last.y) >= 1.5) {
        draft.points.push({ x: rawPt.x, y: rawPt.y, p: e.pressure || 0.5 });
        redraw();
      }
    } else if (draft.x1 !== undefined && draft.y1 !== undefined) {
      let pt = screenToSheet(e.clientX, e.clientY, true);
      if (e.shiftKey) {
        const dx = pt.x - draft.x1;
        const dy = pt.y - draft.y1;
        if (draft.kind === 'line' || draft.kind === 'arrow' || draft.kind === 'dimension') {
          const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
          const dist = Math.hypot(dx, dy);
          pt = {
            x: draft.x1 + Math.cos(angle) * dist,
            y: draft.y1 + Math.sin(angle) * dist,
          };
        } else {
          const side = Math.max(Math.abs(dx), Math.abs(dy));
          pt = {
            x: draft.x1 + Math.sign(dx || 1) * side,
            y: draft.y1 + Math.sign(dy || 1) * side,
          };
        }
      }
      draft.x2 = pt.x;
      draft.y2 = pt.y;
      redraw();
    }
  };

  const handlePointerUp = () => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      return;
    }
    if (isMovingRef.current) {
      isMovingRef.current = false;
      moveStartRef.current.orig = null;
      return;
    }
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const draft = draftRef.current;
    draftRef.current = null;
    if (draft) {
      onCommitElement(draft);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const nextZoom = Math.min(3, Math.max(0.35, Number((zoom * factor).toFixed(2))));
      const rect = canvasRef.current!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const scaleChange = nextZoom / zoom;
      onPanChange({
        x: mx - (mx - pan.x) * scaleChange,
        y: my - (my - pan.y) * scaleChange,
      });
      onZoomChange(nextZoom);
    } else {
      onPanChange({
        x: pan.x - e.deltaX,
        y: pan.y - e.deltaY,
      });
    }
  };

  const commitTextInput = () => {
    if (!textInput) return;
    if (textInput.value.trim()) {
      onCommitElement({
        id: `el-${Date.now()}`,
        kind: 'text',
        color: strokeColor,
        size: 2,
        opacity: strokeOpacity,
        glow,
        x1: textInput.sheetX,
        y1: textInput.sheetY,
        text: textInput.value.trim(),
        fontSize: Math.max(12, Math.round(strokeSize * 4 + 6)),
      });
    }
    setTextInput(null);
  };

  const cursorStyle =
    spacePressed || activeTool === 'hand'
      ? isPanningRef.current
        ? 'grabbing'
        : 'grab'
      : activeTool === 'select'
      ? isMovingRef.current
        ? 'grabbing'
        : 'default'
      : activeTool === 'text'
      ? 'text'
      : activeTool === 'eraser'
      ? 'cell'
      : 'crosshair';

  return (
    <div ref={viewportRef} className="bp-canvas-viewport" onWheel={handleWheel}>
      <canvas
        ref={canvasRef}
        className="bp-canvas-element"
        style={{ cursor: cursorStyle }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      {textInput && (
        <div
          className="bp-text-overlay"
          style={{
            left: Math.min(viewportSize.w - 280, Math.max(12, textInput.screenX)),
            top: Math.min(viewportSize.h - 120, Math.max(12, textInput.screenY)),
          }}
        >
          <textarea
            autoFocus
            placeholder="Not yaz... (Ctrl+Enter ile yerleştir)"
            value={textInput.value}
            onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setTextInput(null);
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') commitTextInput();
            }}
          />
          <div className="bp-text-overlay-actions">
            <button className="bp-tool-pill" onClick={() => setTextInput(null)}>
              İPTAL
            </button>
            <button className="bp-tool-pill active" onClick={commitTextInput}>
              YERLEŞTİR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
