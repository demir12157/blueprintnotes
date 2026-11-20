import { DrawingElement, DrawingPage, Point } from '../types/drawing';

export const SHEET_WIDTH = 1600;
export const SHEET_HEIGHT = 1040;

export function drawGridAndSheet(ctx: CanvasRenderingContext2D, page: DrawingPage) {
  ctx.fillStyle = '#0B2545';
  ctx.fillRect(0, 0, SHEET_WIDTH, SHEET_HEIGHT);

  if (page.gridStyle === 'blueprint') {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(45, 104, 168, 0.22)';
    ctx.lineWidth = 0.75;
    for (let x = 0; x <= SHEET_WIDTH; x += 20) {
      if (x % 80 === 0) continue;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, SHEET_HEIGHT);
    }
    for (let y = 0; y <= SHEET_HEIGHT; y += 20) {
      if (y % 80 === 0) continue;
      ctx.moveTo(0, y);
      ctx.lineTo(SHEET_WIDTH, y);
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(45, 104, 168, 0.45)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= SHEET_WIDTH; x += 80) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, SHEET_HEIGHT);
    }
    for (let y = 0; y <= SHEET_HEIGHT; y += 80) {
      ctx.moveTo(0, y);
      ctx.lineTo(SHEET_WIDTH, y);
    }
    ctx.stroke();
  } else if (page.gridStyle === 'dots') {
    ctx.fillStyle = 'rgba(114, 200, 255, 0.34)';
    for (let x = 20; x < SHEET_WIDTH; x += 20) {
      for (let y = 20; y < SHEET_HEIGHT; y += 20) {
        ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
      }
    }
  }

  ctx.save();
  ctx.strokeStyle = 'rgba(114, 200, 255, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(24, 24, SHEET_WIDTH - 48, SHEET_HEIGHT - 48);

  ctx.font = '700 11px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(92, 225, 230, 0.75)';
  ctx.fillText(`SHEET ${page.code}  //  ${page.title.toUpperCase()}`, 40, 48);
  ctx.restore();

  if (page.showTitleBlock) {
    const bw = 420;
    const bh = 86;
    const bx = SHEET_WIDTH - 24 - bw - 16;
    const by = SHEET_HEIGHT - 24 - bh - 16;

    ctx.save();
    ctx.fillStyle = 'rgba(8, 28, 54, 0.92)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#72C8FF';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, bw, bh);

    ctx.beginPath();
    ctx.strokeStyle = '#3A7CA5';
    ctx.lineWidth = 1;
    ctx.moveTo(bx, by + 32);
    ctx.lineTo(bx + bw, by + 32);
    for (const c of [110, 180, 310]) {
      ctx.moveTo(bx + c, by + 32);
      ctx.lineTo(bx + c, by + bh);
    }
    ctx.stroke();

    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#F0F7FF';
    ctx.fillText(`PROJECT: ${page.project}`, bx + 12, by + 20);
    ctx.fillStyle = '#5CE1E6';
    ctx.fillText('● ACTIVE', bx + bw - 74, by + 20);

    const cells = [
      { x: bx + 10, label: 'SHEET NO', val: page.code, color: '#5CE1E6' },
      { x: bx + 120, label: 'REV', val: String(page.revision).padStart(2, '0'), color: '#FFD166' },
      { x: bx + 190, label: 'DATE', val: page.date, color: '#F0F7FF' },
      { x: bx + 320, label: 'SCALE', val: page.scale, color: '#A8CBE8' },
    ];
    for (const cell of cells) {
      ctx.font = '400 9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#6392BC';
      ctx.fillText(cell.label, cell.x, by + 48);
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.fillStyle = cell.color;
      ctx.fillText(cell.val, cell.x, by + 70);
    }
    ctx.restore();
  }
}

function getPolygonPoints(el: DrawingElement): Point[] {
  const x1 = el.x1 ?? 0;
  const y1 = el.y1 ?? 0;
  const x2 = el.x2 ?? 0;
  const y2 = el.y2 ?? 0;
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const rx = (maxX - minX) / 2;
  const ry = (maxY - minY) / 2;

  if (el.kind === 'triangle') {
    const pointingDown = y2 < y1;
    return pointingDown
      ? [
          { x: cx, y: maxY },
          { x: maxX, y: minY },
          { x: minX, y: minY },
        ]
      : [
          { x: cx, y: minY },
          { x: maxX, y: maxY },
          { x: minX, y: maxY },
        ];
  }
  if (el.kind === 'diamond') {
    return [
      { x: cx, y: minY },
      { x: maxX, y: cy },
      { x: cx, y: maxY },
      { x: minX, y: cy },
    ];
  }
  if (el.kind === 'hexagon') {
    const pts: Point[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      pts.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
    }
    return pts;
  }
  if (el.kind === 'star') {
    const pts: Point[] = [];
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const mult = i % 2 === 0 ? 1 : 0.44;
      pts.push({ x: cx + rx * mult * Math.cos(a), y: cy + ry * mult * Math.sin(a) });
    }
    return pts;
  }
  return [];
}

function drawArrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, headLen: number) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - headLen * Math.cos(angle - Math.PI / 6), y - headLen * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(x, y);
  ctx.lineTo(x - headLen * Math.cos(angle + Math.PI / 6), y - headLen * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

export function drawElement(ctx: CanvasRenderingContext2D, el: DrawingElement) {
  ctx.save();
  ctx.globalAlpha = el.opacity ?? 1;
  ctx.strokeStyle = el.color;
  ctx.fillStyle = el.color;
  ctx.lineWidth = el.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (el.dashed) {
    ctx.setLineDash([8, 6]);
  }
  if (el.glow) {
    ctx.shadowColor = el.color;
    ctx.shadowBlur = Math.max(10, el.size * 3.5);
  }

  const fillShape = () => {
    if (el.filled) {
      ctx.save();
      ctx.globalAlpha = (el.opacity ?? 1) * 0.16;
      ctx.fill();
      ctx.restore();
    }
  };

  const applyRotation = () => {
    if (el.rotation && el.x1 !== undefined && el.y1 !== undefined && el.x2 !== undefined && el.y2 !== undefined) {
      const cx = (el.x1 + el.x2) / 2;
      const cy = (el.y1 + el.y2) / 2;
      ctx.translate(cx, cy);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }
  };

  if (el.kind === 'path' && el.points && el.points.length > 0) {
    const pts = el.points;
    ctx.beginPath();
    if (pts.length === 1) {
      ctx.arc(pts[0].x, pts[0].y, el.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const midX = (pts[i].x + pts[i + 1].x) / 2;
        const midY = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
      }
      const last = pts[pts.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
    }
  } else if (el.kind === 'line' && el.x1 !== undefined && el.y1 !== undefined && el.x2 !== undefined && el.y2 !== undefined) {
    ctx.beginPath();
    ctx.moveTo(el.x1, el.y1);
    ctx.lineTo(el.x2, el.y2);
    ctx.stroke();
  } else if (el.kind === 'arrow' && el.x1 !== undefined && el.y1 !== undefined && el.x2 !== undefined && el.y2 !== undefined) {
    const angle = Math.atan2(el.y2 - el.y1, el.x2 - el.x1);
    const headLen = Math.max(12, el.size * 4.5);
    ctx.beginPath();
    ctx.moveTo(el.x1, el.y1);
    ctx.lineTo(el.x2, el.y2);
    ctx.stroke();
    ctx.setLineDash([]);
    drawArrowHead(ctx, el.x2, el.y2, angle, headLen);
  } else if (el.kind === 'dimension' && el.x1 !== undefined && el.y1 !== undefined && el.x2 !== undefined && el.y2 !== undefined) {
    const dx = el.x2 - el.x1;
    const dy = el.y2 - el.y1;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const perp = angle + Math.PI / 2;
    const tick = 9;

    ctx.beginPath();
    ctx.moveTo(el.x1, el.y1);
    ctx.lineTo(el.x2, el.y2);
    ctx.stroke();

    ctx.setLineDash([]);
    // End ticks
    ctx.beginPath();
    ctx.moveTo(el.x1 - Math.cos(perp) * tick, el.y1 - Math.sin(perp) * tick);
    ctx.lineTo(el.x1 + Math.cos(perp) * tick, el.y1 + Math.sin(perp) * tick);
    ctx.moveTo(el.x2 - Math.cos(perp) * tick, el.y2 - Math.sin(perp) * tick);
    ctx.lineTo(el.x2 + Math.cos(perp) * tick, el.y2 + Math.sin(perp) * tick);
    ctx.stroke();

    // Double arrowheads
    if (dist > 28) {
      drawArrowHead(ctx, el.x2, el.y2, angle, 9);
      drawArrowHead(ctx, el.x1, el.y1, angle + Math.PI, 9);
    }

    // Live millimeter measurement label
    if (dist > 20) {
      const mx = (el.x1 + el.x2) / 2;
      const my = (el.y1 + el.y2) / 2;
      const mm = Math.round(dist * 10);
      const label = `${mm} MM`;
      ctx.font = '700 11px "JetBrains Mono", monospace';
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = '#0B2545';
      ctx.fillRect(mx - tw / 2 - 5, my - 18, tw + 10, 15);
      ctx.fillStyle = el.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, mx, my - 10);
    }
  } else if (el.kind === 'rect' && el.x1 !== undefined && el.y1 !== undefined && el.x2 !== undefined && el.y2 !== undefined) {
    applyRotation();
    const x = Math.min(el.x1, el.x2);
    const y = Math.min(el.y1, el.y2);
    const w = Math.abs(el.x2 - el.x1);
    const h = Math.abs(el.y2 - el.y1);
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    fillShape();
    ctx.stroke();
  } else if (el.kind === 'circle' && el.x1 !== undefined && el.y1 !== undefined && el.x2 !== undefined && el.y2 !== undefined) {
    applyRotation();
    const cx = (el.x1 + el.x2) / 2;
    const cy = (el.y1 + el.y2) / 2;
    const rx = Math.max(1, Math.abs(el.x2 - el.x1) / 2);
    const ry = Math.max(1, Math.abs(el.y2 - el.y1) / 2);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    fillShape();
    ctx.stroke();
  } else if (el.kind === 'triangle' || el.kind === 'diamond' || el.kind === 'hexagon' || el.kind === 'star') {
    applyRotation();
    const pts = getPolygonPoints(el);
    if (pts.length >= 3) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      fillShape();
      ctx.stroke();
    }
  } else if (el.kind === 'text' && el.text && el.x1 !== undefined && el.y1 !== undefined) {
    const fs = el.fontSize || 14;
    ctx.font = `500 ${fs}px "JetBrains Mono", "IBM Plex Sans", monospace`;
    ctx.textBaseline = 'top';
    const lines = el.text.split('\n');
    const lh = fs * 1.45;
    lines.forEach((line, idx) => {
      ctx.fillText(line, el.x1!, el.y1! + idx * lh);
    });
  }

  ctx.restore();
}

function distToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export function hitTestElement(el: DrawingElement, rawPt: Point, radius = 14): boolean {
  const tol = Math.max(radius, el.size / 2 + 8);
  let pt = rawPt;
  if (el.rotation && el.x1 !== undefined && el.y1 !== undefined && el.x2 !== undefined && el.y2 !== undefined) {
    const cx = (el.x1 + el.x2) / 2;
    const cy = (el.y1 + el.y2) / 2;
    const rad = (-el.rotation * Math.PI) / 180;
    const dx = rawPt.x - cx;
    const dy = rawPt.y - cy;
    pt = {
      x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: cy + dx * Math.sin(rad) + dy * Math.cos(rad),
    };
  }

  if (el.kind === 'path' && el.points) {
    if (el.points.length === 1) {
      return Math.hypot(pt.x - el.points[0].x, pt.y - el.points[0].y) <= tol;
    }
    for (let i = 0; i < el.points.length - 1; i++) {
      if (distToSegment(pt, el.points[i], el.points[i + 1]) <= tol) return true;
    }
    return false;
  }

  if (
    (el.kind === 'line' || el.kind === 'arrow' || el.kind === 'dimension') &&
    el.x1 !== undefined && el.y1 !== undefined && el.x2 !== undefined && el.y2 !== undefined
  ) {
    return distToSegment(pt, { x: el.x1, y: el.y1 }, { x: el.x2, y: el.y2 }) <= tol;
  }

  if (el.kind === 'rect' && el.x1 !== undefined && el.y1 !== undefined && el.x2 !== undefined && el.y2 !== undefined) {
    const minX = Math.min(el.x1, el.x2);
    const maxX = Math.max(el.x1, el.x2);
    const minY = Math.min(el.y1, el.y2);
    const maxY = Math.max(el.y1, el.y2);
    if (el.filled && pt.x >= minX && pt.x <= maxX && pt.y >= minY && pt.y <= maxY) return true;
    const top = distToSegment(pt, { x: minX, y: minY }, { x: maxX, y: minY });
    const bot = distToSegment(pt, { x: minX, y: maxY }, { x: maxX, y: maxY });
    const lft = distToSegment(pt, { x: minX, y: minY }, { x: minX, y: maxY });
    const rgt = distToSegment(pt, { x: maxX, y: minY }, { x: maxX, y: maxY });
    return Math.min(top, bot, lft, rgt) <= tol;
  }

  if (el.kind === 'circle' && el.x1 !== undefined && el.y1 !== undefined && el.x2 !== undefined && el.y2 !== undefined) {
    const cx = (el.x1 + el.x2) / 2;
    const cy = (el.y1 + el.y2) / 2;
    const rx = Math.max(1, Math.abs(el.x2 - el.x1) / 2);
    const ry = Math.max(1, Math.abs(el.y2 - el.y1) / 2);
    const norm = Math.sqrt(((pt.x - cx) / rx) ** 2 + ((pt.y - cy) / ry) ** 2);
    if (el.filled && norm <= 1) return true;
    return Math.abs(norm - 1) * Math.min(rx, ry) <= tol;
  }

  if (el.kind === 'triangle' || el.kind === 'diamond' || el.kind === 'hexagon' || el.kind === 'star') {
    const pts = getPolygonPoints(el);
    for (let i = 0; i < pts.length; i++) {
      const next = pts[(i + 1) % pts.length];
      if (distToSegment(pt, pts[i], next) <= tol) return true;
    }
    return false;
  }

  if (el.kind === 'text' && el.text && el.x1 !== undefined && el.y1 !== undefined) {
    const fs = el.fontSize || 14;
    const lines = el.text.split('\n');
    const maxLen = Math.max(...lines.map((l) => l.length), 4);
    const w = maxLen * fs * 0.65;
    const h = lines.length * fs * 1.45;
    return pt.x >= el.x1 - 8 && pt.x <= el.x1 + w + 8 && pt.y >= el.y1 - 8 && pt.y <= el.y1 + h + 8;
  }

  return false;
}

export function getElementBounds(el: DrawingElement): { x: number; y: number; w: number; h: number } | null {
  if (el.kind === 'path' && el.points && el.points.length > 0) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of el.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return { x: minX - 6, y: minY - 6, w: maxX - minX + 12, h: maxY - minY + 12 };
  }
  if (el.kind === 'text' && el.text && el.x1 !== undefined && el.y1 !== undefined) {
    const fs = el.fontSize || 14;
    const lines = el.text.split('\n');
    const maxLen = Math.max(...lines.map((l) => l.length), 4);
    return { x: el.x1 - 6, y: el.y1 - 6, w: maxLen * fs * 0.65 + 12, h: lines.length * fs * 1.45 + 12 };
  }
  if (el.x1 !== undefined && el.y1 !== undefined && el.x2 !== undefined && el.y2 !== undefined) {
    const minX = Math.min(el.x1, el.x2);
    const minY = Math.min(el.y1, el.y2);
    return {
      x: minX - 6,
      y: minY - 6,
      w: Math.abs(el.x2 - el.x1) + 12,
      h: Math.abs(el.y2 - el.y1) + 12,
    };
  }
  return null;
}

export function translateElement(el: DrawingElement, dx: number, dy: number): DrawingElement {
  if (el.kind === 'path' && el.points) {
    return {
      ...el,
      points: el.points.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy })),
    };
  }
  return {
    ...el,
    x1: el.x1 !== undefined ? el.x1 + dx : undefined,
    y1: el.y1 !== undefined ? el.y1 + dy : undefined,
    x2: el.x2 !== undefined ? el.x2 + dx : undefined,
    y2: el.y2 !== undefined ? el.y2 + dy : undefined,
  };
}

export function renderPageToPngDataUrl(page: DrawingPage): string {
  const off = document.createElement('canvas');
  off.width = SHEET_WIDTH;
  off.height = SHEET_HEIGHT;
  const ctx = off.getContext('2d')!;
  drawGridAndSheet(ctx, page);
  for (const layer of page.layers) {
    if (!layer.visible) continue;
    ctx.save();
    ctx.globalAlpha = layer.opacity;
    ctx.globalCompositeOperation = layer.blendMode;
    for (const el of layer.elements) {
      drawElement(ctx, el);
    }
    ctx.restore();
  }
  return off.toDataURL('image/png');
}
