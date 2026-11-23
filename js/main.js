import * as app from './state.js';
import { state, doc, preview, DOC_WIDTH, DOC_HEIGHT } from './state.js';
import { BLACK, WHITE, CLEAR, PIXEL_BLACK, PIXEL_WHITE, bitmapToCanvas } from './bitmap.js';
import { PATTERNS, GRAY, STRIPES, patternDataURL } from './patterns.js';
import { HEART_ICON } from './icons.js';
import { line } from './raster.js';
import { localPoint, canvasFor } from './ui/dom.js';
import { createMenubar } from './ui/menubar.js';
import { createToolbox } from './ui/toolbox.js';
import { createPatternPalette } from './ui/patterns.js';
import { createLineWidthPalette } from './ui/linewidth.js';
import { showDialog, isDialogOpen } from './ui/dialog.js';
import { select } from './tools/select.js';
import { lasso } from './tools/lasso.js';
import { bucket } from './tools/bucket.js';
import { pencil } from './tools/pencil.js';
import { eraser, ERASER_SIZE } from './tools/eraser.js';
import { lineTool } from './tools/line.js';
import { rect, rectFill, rrect, rrectFill, oval, ovalFill } from './tools/shape.js';

// ---------- 도구 ----------

const TOOLS = { lasso, select, bucket, pencil, eraser, line: lineTool, rect, rectFill, rrect, rrectFill, oval, ovalFill };

const TOOL_LAYOUT = [
  ['lasso', 'select'],
  ['bucket', 'pencil'],
  ['eraser', 'line'],
  ['rect', 'rectFill'],
  ['rrect', 'rrectFill'],
  ['oval', 'ovalFill'],
];

// 키 하나에 도구 두 개가 있으면 누를 때마다 빈 도형 ↔ 채운 도형으로 바뀐다.
const TOOL_KEYS = {
  a: 'lasso',
  s: 'select',
  b: 'bucket',
  p: 'pencil',
  e: 'eraser',
  l: 'line',
  r: ['rect', 'rectFill'],
  u: ['rrect', 'rrectFill'],
  o: ['oval', 'ovalFill'],
};

const LINE_WIDTHS = [1, 2, 3, 4];

// ---------- DOM ----------

const appEl = document.getElementById('app');
const viewCanvas = document.getElementById('view');

document.documentElement.style.setProperty('--pattern-gray', `url(${patternDataURL(GRAY)})`);
document.documentElement.style.setProperty('--pattern-stripes', `url(${patternDataURL(STRIPES)})`);

const menubar = createMenubar(document.getElementById('menubar'), [
  {
    icon: canvasFor(HEART_ICON, bitmapToCanvas),
    items: [{ label: 'About PicoPaint…', action: showAbout }],
  },
  {
    title: 'File',
    items: [
      { label: 'New', shortcut: '⌘N', action: newDocument },
      '-',
      { label: 'Save as PNG…', shortcut: '⌘S', action: savePNG },
    ],
  },
  {
    title: 'Edit',
    items: [
      { label: 'Undo', shortcut: '⌘Z', action: app.undo, enabled: () => state.undo !== null },
      '-',
      { label: 'Clear', shortcut: '⌫', action: clear },
    ],
  },
  { title: 'Goodies' },
  { title: 'Extras' },
  { title: 'Font' },
  { title: 'Style' },
]);

const toolbox = createToolbox(document.getElementById('toolbox'), TOOL_LAYOUT, {
  onSelect: setTool,
  onDoubleClick(name) {
    if (name === 'eraser') app.clearAll(); // 원본처럼: 지우개 더블클릭 = 전체 지우기
  },
});

const patternPalette = createPatternPalette(document.getElementById('patterns'), PATTERNS, {
  onSelect(index) {
    state.pattern = index;
    patternPalette.update(index);
  },
});

const lineWidthPalette = createLineWidthPalette(document.getElementById('linewidth'), LINE_WIDTHS, {
  onSelect(width) {
    state.lineWidth = width;
    lineWidthPalette.update(width);
  },
});

// ---------- 명령 ----------

let dragging = null; // 마우스를 누르고 있는 동안 사용 중인 도구

function currentTool() {
  return TOOLS[state.tool];
}

function setTool(name) {
  if (dragging) return;
  if (state.tool !== name) {
    app.dropSelection();
    state.tool = name;
  }
  toolbox.update(name);
  updateCursor();
  app.invalidate();
}

function newDocument() {
  app.clearAll();
}

function clear() {
  if (!app.clearSelection()) app.clearAll();
}

function savePNG() {
  app.dropSelection();
  const canvas = document.createElement('canvas');
  canvas.width = DOC_WIDTH;
  canvas.height = DOC_HEIGHT;
  bitmapToCanvas(doc, canvas);
  canvas.toBlob((blob) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'untitled.png';
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  });
}

function showAbout() {
  showDialog(appEl, {
    title: 'PicoPaint',
    lines: ['MacPaint(1984)에 바치는 작은 오마주', 'Bill Atkinson을 기리며'],
  });
}

// ---------- 마우스 ----------

function eventPoint(e) {
  const local = localPoint(viewCanvas, e);
  return { x: Math.floor(local.x), y: Math.floor(local.y) };
}

function updateCursor() {
  const tool = dragging || currentTool();
  let cursor = tool.cursor;
  if (!dragging && tool.cursorAt && state.hover) cursor = tool.cursorAt(app, state.hover);
  viewCanvas.style.cursor = cursor;
}

viewCanvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || isDialogOpen()) return;
  e.preventDefault();
  viewCanvas.setPointerCapture(e.pointerId);
  const p = eventPoint(e);
  state.hover = p;
  dragging = currentTool();
  dragging.onDown(app, p, e);
  updateCursor();
  app.invalidate();
});

viewCanvas.addEventListener('pointermove', (e) => {
  const p = eventPoint(e);
  state.hover = p;
  if (dragging) dragging.onMove(app, p, e);
  updateCursor();
  app.invalidate();
});

function endDrag(e) {
  if (!dragging) return;
  const p = eventPoint(e);
  dragging.onUp(app, p, e);
  dragging = null;
  updateCursor();
  app.invalidate();
}

viewCanvas.addEventListener('pointerup', endDrag);
viewCanvas.addEventListener('pointercancel', endDrag);
viewCanvas.addEventListener('pointerleave', () => {
  state.hover = null;
  app.invalidate();
});
viewCanvas.addEventListener('contextmenu', (e) => e.preventDefault());

// ---------- 키보드 ----------

// e.code를 쓰면 한글 입력 상태에서도 단축키가 동작한다.
function keyName(e) {
  return e.code.startsWith('Key') ? e.code.slice(3).toLowerCase() : e.key;
}

document.addEventListener('keydown', (e) => {
  if (isDialogOpen()) return;
  const key = keyName(e);

  if (e.metaKey || e.ctrlKey) {
    const command = { z: app.undo, s: savePNG, n: newDocument }[key];
    if (command) {
      e.preventDefault();
      if (dragging) return;
      menubar.close();
      command();
    }
    return;
  }

  if (dragging) return;

  if (key === 'Escape') {
    app.dropSelection();
  } else if (key === 'Delete' || key === 'Backspace') {
    e.preventDefault();
    clear();
  } else if (TOOL_KEYS[key] && !e.altKey) {
    const tool = TOOL_KEYS[key];
    if (Array.isArray(tool)) setTool(state.tool === tool[0] ? tool[1] : tool[0]);
    else setTool(tool);
  }
});

// ---------- 화면 그리기 ----------

const viewCtx = viewCanvas.getContext('2d');
const image = viewCtx.createImageData(DOC_WIDTH, DOC_HEIGHT);
const out = new Uint32Array(image.data.buffer);

function plotView(x, y, color) {
  if (doc.contains(x, y)) out[y * DOC_WIDTH + x] = color;
}

function invertView(x, y) {
  if (!doc.contains(x, y)) return;
  const i = y * DOC_WIDTH + x;
  out[i] = out[i] === PIXEL_BLACK ? PIXEL_WHITE : PIXEL_BLACK;
}

function forEachEdge(r, fn) {
  const right = r.x + r.w - 1;
  const bottom = r.y + r.h - 1;
  for (let x = r.x; x <= right; x++) {
    fn(x, r.y);
    if (bottom !== r.y) fn(x, bottom);
  }
  for (let y = r.y + 1; y < bottom; y++) {
    fn(r.x, y);
    if (right !== r.x) fn(right, y);
  }
}

function render(phase) {
  // 1. 문서 + 미리보기 레이어
  for (let i = 0; i < doc.pixels.length; i++) {
    let value = preview.pixels[i];
    if (value === CLEAR) value = doc.pixels[i];
    out[i] = value === BLACK ? PIXEL_BLACK : PIXEL_WHITE;
  }

  // 2. 떠 있는 선택 영역
  const selection = state.selection;
  if (selection?.buffer) {
    const { buffer } = selection;
    for (let y = 0; y < buffer.height; y++) {
      for (let x = 0; x < buffer.width; x++) {
        const value = buffer.pixels[y * buffer.width + x];
        if (value === BLACK) plotView(selection.x + x, selection.y + y, PIXEL_BLACK);
        else if (value === WHITE) plotView(selection.x + x, selection.y + y, PIXEL_WHITE);
      }
    }
  }

  // 3. 선택 테두리 (marching ants)
  const ant = (x, y) => plotView(x, y, (x + y + phase) & 4 ? PIXEL_BLACK : PIXEL_WHITE);
  if (state.marquee) forEachEdge(state.marquee, ant);
  if (state.lasso) {
    const path = state.lasso;
    for (let i = 1; i < path.length; i++) line(path[i - 1].x, path[i - 1].y, path[i].x, path[i].y, ant);
  }
  if (selection?.outline) {
    for (const p of selection.outline) ant(selection.x + p.x, selection.y + p.y);
  } else if (selection) {
    forEachEdge(selection, ant);
  }

  // 4. 지우개 커서
  if (state.hover && currentTool() === eraser) {
    const half = ERASER_SIZE / 2;
    forEachEdge({ x: state.hover.x - half, y: state.hover.y - half, w: ERASER_SIZE, h: ERASER_SIZE }, invertView);
  }

  viewCtx.putImageData(image, 0, 0);
}

let lastPhase = -1;

function frame(time) {
  const phase = Math.floor(time / 80) & 7;
  if ((state.selection || state.marquee || state.lasso) && phase !== lastPhase) app.invalidate();
  if (state.dirty) {
    render(8 - phase);
    state.dirty = false;
  }
  lastPhase = phase;
  requestAnimationFrame(frame);
}

// ---------- 확대 ----------

function fit() {
  const scale = Math.max(1, Math.floor(Math.min(innerWidth / 512, innerHeight / 342)));
  appEl.style.transform = `scale(${scale})`;
  appEl.style.left = `${Math.floor((innerWidth - 512 * scale) / 2)}px`;
  appEl.style.top = `${Math.floor((innerHeight - 342 * scale) / 2)}px`;
}

window.addEventListener('resize', fit);
fit();

// ---------- 시작 ----------

toolbox.update(state.tool);
patternPalette.update(state.pattern);
lineWidthPalette.update(state.lineWidth);
updateCursor();
requestAnimationFrame(frame);
