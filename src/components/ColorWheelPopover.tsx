import React, { useEffect, useRef, useState } from 'react';
import { COLOR_SWATCHES } from '../data/initialNotebook';

interface ColorWheelPopoverProps {
  color: string;
  onChange: (hex: string) => void;
  onClose: () => void;
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2) || 'ff', 16) / 255;
  const g = parseInt(clean.slice(2, 4) || 'ff', 16) / 255;
  const b = parseInt(clean.slice(4, 6) || 'ff', 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

const WHEEL_SIZE = 188;

export const ColorWheelPopover: React.FC<ColorWheelPopoverProps> = ({
  color,
  onChange,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const draggingRef = useRef(false);
  const [hsv, setHsv] = useState(() => hexToHsv(color));
  const [hexDraft, setHexDraft] = useState(color.toUpperCase());

  useEffect(() => {
    setHsv(hexToHsv(color));
    setHexDraft(color.toUpperCase());
  }, [color]);

  // Draw crisp HSV color wheel canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const r = WHEEL_SIZE / 2;
    const img = ctx.createImageData(WHEEL_SIZE, WHEEL_SIZE);
    const data = img.data;

    for (let y = 0; y < WHEEL_SIZE; y++) {
      for (let x = 0; x < WHEEL_SIZE; x++) {
        const dx = x - r;
        const dy = y - r;
        const dist = Math.hypot(dx, dy);
        if (dist <= r - 1) {
          let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          if (angle < 0) angle += 360;
          const sat = Math.min(1, dist / (r - 1));
          const hex = hsvToHex(angle, sat, hsv.v);
          const idx = (y * WHEEL_SIZE + x) * 4;
          data[idx] = parseInt(hex.slice(1, 3), 16);
          data[idx + 1] = parseInt(hex.slice(3, 5), 16);
          data[idx + 2] = parseInt(hex.slice(5, 7), 16);
          data[idx + 3] = 255;
        }
      }
    }
    ctx.putImageData(img, 0, 0);

    // Subtle crisp outer ring
    ctx.beginPath();
    ctx.arc(r, r, r - 1.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(114, 200, 255, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Active reticle indicator
    const rad = (hsv.h * Math.PI) / 180;
    const px = r + Math.cos(rad) * hsv.s * (r - 3);
    const py = r + Math.sin(rad) * hsv.s * (r - 3);
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px, py, 8.5, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#081C36';
    ctx.stroke();
  }, [hsv, color]);

  const pickFromPointer = (clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const r = WHEEL_SIZE / 2;
    const dx = clientX - rect.left - r;
    const dy = clientY - rect.top - r;
    const dist = Math.min(r - 1, Math.hypot(dx, dy));
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (angle < 0) angle += 360;
    const sat = dist / (r - 1);
    const nextHsv = { h: angle, s: sat, v: hsv.v };
    setHsv(nextHsv);
    const nextHex = hsvToHex(nextHsv.h, nextHsv.s, nextHsv.v);
    setHexDraft(nextHex);
    onChange(nextHex);
  };

  const handleBrightness = (v: number) => {
    const nextHsv = { ...hsv, v };
    setHsv(nextHsv);
    const nextHex = hsvToHex(nextHsv.h, nextHsv.s, nextHsv.v);
    setHexDraft(nextHex);
    onChange(nextHex);
  };

  return (
    <div className="bp-popover bp-color-popover" onClick={(e) => e.stopPropagation()}>
      <div className="bp-popover-header">
        <span>COLOR WHEEL // RENK ÇARKI</span>
        <button className="bp-popover-close" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="bp-wheel-wrap">
        <canvas
          ref={canvasRef}
          width={WHEEL_SIZE}
          height={WHEEL_SIZE}
          className="bp-wheel-canvas"
          onPointerDown={(e) => {
            draggingRef.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            pickFromPointer(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (draggingRef.current) pickFromPointer(e.clientX, e.clientY);
          }}
          onPointerUp={() => {
            draggingRef.current = false;
          }}
        />
      </div>

      <div className="bp-wheel-brightness">
        <span className="bp-prop-label">BRIGHTNESS {Math.round(hsv.v * 100)}%</span>
        <input
          type="range"
          min={0.15}
          max={1}
          step={0.01}
          value={hsv.v}
          className="bp-slider full"
          onChange={(e) => handleBrightness(parseFloat(e.target.value))}
        />
      </div>

      <div className="bp-wheel-hex-row">
        <span className="bp-wheel-preview" style={{ backgroundColor: color }} />
        <input
          className="bp-hex-input"
          value={hexDraft}
          maxLength={7}
          onChange={(e) => {
            const val = e.target.value.toUpperCase();
            setHexDraft(val);
            if (/^#[0-9A-F]{6}$/.test(val)) {
              onChange(val);
            }
          }}
        />
      </div>

      <div className="bp-wheel-presets">
        {[
          ...COLOR_SWATCHES,
          { name: 'Electric Violet', hex: '#B983FF' },
          { name: 'Signal Orange', hex: '#FF9F43' },
        ].map((sw) => (
          <button
            key={sw.hex}
            className={`bp-swatch ${color.toUpperCase() === sw.hex ? 'active' : ''}`}
            style={{ backgroundColor: sw.hex }}
            title={sw.name}
            onClick={() => onChange(sw.hex)}
          />
        ))}
      </div>
    </div>
  );
};
