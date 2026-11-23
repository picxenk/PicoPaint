import { BLACK, CLEAR } from '../bitmap.js';
import { shape } from '../raster.js';
import { patternAt } from '../patterns.js';

// Shift: 정사각형 / 원
function constrainSquare(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const d = Math.max(Math.abs(dx), Math.abs(dy));
  return { x: from.x + (dx < 0 ? -d : d), y: from.y + (dy < 0 ? -d : d) };
}

// kind: 'rect' | 'rrect' | 'oval'. filled이면 내부를 현재 패턴으로 칠한다.
export function makeShapeTool(name, kind, filled) {
  let start = null;

  function draw(app, p, shift) {
    const end = shift ? constrainSquare(start, p) : p;
    const { preview } = app;
    const rows = app.currentPattern();
    preview.fill(CLEAR);
    shape(
      start.x,
      start.y,
      end.x,
      end.y,
      { kind, lineWidth: app.state.lineWidth },
      (x, y) => preview.set(x, y, BLACK),
      filled ? (x, y) => preview.set(x, y, patternAt(rows, x, y)) : null,
    );
  }

  return {
    name,
    cursor: 'crosshair',

    onDown(app, p, e) {
      start = p;
      draw(app, p, e.shiftKey);
    },

    onMove(app, p, e) {
      if (start) draw(app, p, e.shiftKey);
    },

    onUp(app, p, e) {
      if (!start) return;
      draw(app, p, e.shiftKey);
      app.commitPreview();
      start = null;
    },
  };
}

export const rect = makeShapeTool('rect', 'rect', false);
export const rectFill = makeShapeTool('rectFill', 'rect', true);
export const rrect = makeShapeTool('rrect', 'rrect', false);
export const rrectFill = makeShapeTool('rrectFill', 'rrect', true);
export const oval = makeShapeTool('oval', 'oval', false);
export const ovalFill = makeShapeTool('ovalFill', 'oval', true);
