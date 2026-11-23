import { Bitmap, BLACK } from '../bitmap.js';
import { line, fillPolygon } from '../raster.js';
import { startMove, moveTo } from './select.js';

let mode = null; // 'draw' | 'move'
let offset = null;

// 경로(닫힌 다각형)를 선택 영역으로 바꾼다: 내부 + 경로 자체를 mask에 칠한다.
function selectionFromPath(points) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const w = Math.max(...xs) - left + 1;
  const h = Math.max(...ys) - top + 1;
  if (w < 2 && h < 2) return null;

  const mask = new Bitmap(w, h);
  const plot = (x, y) => mask.set(x - left, y - top, BLACK);
  fillPolygon(points, plot);
  points.forEach((a, i) => {
    const b = points[(i + 1) % points.length];
    line(a.x, a.y, b.x, b.y, plot);
  });

  // 테두리 = 선택된 픽셀 중 상하좌우에 선택되지 않은 이웃이 있는 픽셀 (marching ants 용)
  const outline = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask.get(x, y) !== BLACK) continue;
      const edge =
        mask.get(x - 1, y) !== BLACK ||
        mask.get(x + 1, y) !== BLACK ||
        mask.get(x, y - 1) !== BLACK ||
        mask.get(x, y + 1) !== BLACK;
      if (edge) outline.push({ x, y });
    }
  }

  return { x: left, y: top, w, h, mask, outline, buffer: null };
}

export const lasso = {
  name: 'lasso',
  cursor: 'crosshair',

  cursorAt(app, p) {
    return app.selectionContains(p) ? 'move' : 'crosshair';
  },

  onDown(app, p) {
    offset = startMove(app, p);
    if (offset) {
      mode = 'move';
      return;
    }
    app.dropSelection();
    mode = 'draw';
    app.state.lasso = [app.clampToDoc(p)];
  },

  onMove(app, p) {
    if (mode === 'move') {
      moveTo(app, p, offset);
    } else if (mode === 'draw') {
      const path = app.state.lasso;
      const q = app.clampToDoc(p);
      const last = path[path.length - 1];
      if (q.x !== last.x || q.y !== last.y) path.push(q);
    }
  },

  onUp(app) {
    if (mode === 'draw') {
      app.state.selection = selectionFromPath(app.state.lasso);
      app.state.lasso = null;
    }
    mode = null;
  },
};
