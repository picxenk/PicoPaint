import { WHITE } from '../bitmap.js';
import { line } from '../raster.js';

export const ERASER_SIZE = 16;

let last = null;

function erase(app, x, y) {
  const half = ERASER_SIZE / 2;
  app.doc.fillRect(x - half, y - half, ERASER_SIZE, ERASER_SIZE, WHITE);
}

export const eraser = {
  name: 'eraser',
  cursor: 'none', // 커서 대신 지우개 사각형을 화면에 그린다 (main.js)

  onDown(app, p) {
    app.pushUndo();
    erase(app, p.x, p.y);
    last = p;
  },

  onMove(app, p) {
    if (!last) return;
    line(last.x, last.y, p.x, p.y, (x, y) => erase(app, x, y));
    last = p;
  },

  onUp() {
    last = null;
  },
};
