# BlueprintNotes // Drawboard & Cyanotype Studio

A classic architectural **Cyanotype Blueprint** desktop drawing & note-taking application built with **Electron, React, TypeScript, and HTML5 Canvas**, with its GUI and 512×512 architectural compass logo designed in **Figma**.

## Features

- **Classic Cyanotype Blueprint Aesthetic:** Deep Prussian blue (`#0B2545`), dual-tier 20mm/80mm technical drafting grid, dot grid, blank cyanotype mode, and toggleable architectural Title Block.
- **Drawboard-Style Tool Rail:**
  - **3 Favorite Pen Slots** (`1`, `2`, `3`) + **Highlighter** (`4`) with smooth quadratic Bézier interpolation & stylus pressure support
  - **Select & Move Tool (`V`)** with bounding box, drag-to-move, duplicate (`Ctrl+D`), and delete (`Del`)
  - **Precision Stroke Eraser (`E`)**
  - **Unified Shapes Tool (`S`)** with 9 technical shapes (Line, Arrow, Dimension Line with live `MM` label, Rectangle, Circle, Triangle, Diamond, Hexagon, Star), solid/dashed & outline/fill toggles, and **`0°–360°` orientation/rotation** (`R` for +90°, `[` / `]` for ±15°)
  - **Paint Bucket / Fill (`G`)** & **Eyedropper (`I`)**
  - **Interactive HSV Color Wheel (`K`)** with brightness slider, HEX editor, and blueprint presets
  - **Text Annotations (`T`)** & **Pan/Zoom (`H`, `Space + Drag`, `Ctrl + Wheel`)**
- **PhotoCraft-Inspired Layers & Effects:**
  - Multi-layer stack per page with **visibility**, **lock**, **opacity**, **blend modes** (`Normal`, `Screen`, `Multiply`, `Overlay`, `Add/Glow`), and layer reordering
  - **Neon Blueprint Glow (`GLOW`)** & stroke opacity controls
  - **Command Palette (`Ctrl+P`)** for instant keyboard-driven workflow
- **Local-First Auto-Save & Export:**
  - Auto-saves all pages and layers locally to `~/Documents/BlueprintVault/drawings.json`
  - High-DPI **PNG Export (`Ctrl+S`)**

## Development & Build

```bash
npm install
npm run dev      # Run Electron + Vite in dev mode
npm run build    # Typecheck and build production bundle
npm run dist     # Package standalone Windows portable .exe in release/
```

## Figma Design

- [BlueprintNotes — Desktop GUI & App Logo (Figma)](https://www.figma.com/design/BWfwNEmcNhMwgM0NuFQrki)
