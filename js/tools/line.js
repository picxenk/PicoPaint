import { BLACK, CLEAR } from '../bitmap.js';
import { penLine } from '../raster.js';

let start = null;

// Shift: 0°, 45°, 90° 방향으로 고정
function constrain(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  const tan22 = 0.4142;
  if (ay < ax * tan22) return { x: to.x, y: from.y };
  if (ax < ay * tan22) return { x: from.x, y: to.y };
  const d = Math.max(ax, ay);
  return { x: from.x + Math.sign(dx) * d, y: from.y + Math.sign(dy) * d };
}

function draw(app, p, shift) {
  const end = shift ? constrain(start, p) : p;
  app.preview.fill(CLEAR);
  penLine(start.x, start.y, end.x, end.y, app.state.lineWidth, (x, y) => app.preview.set(x, y, BLACK));
}

export const lineTool = {
  name: 'line',
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
