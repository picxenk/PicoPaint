import { floodFill } from '../raster.js';
import { patternAt } from '../patterns.js';

export const bucket = {
  name: 'bucket',
  cursor: 'crosshair',

  onDown(app, p) {
    if (!app.doc.contains(p.x, p.y)) return;
    app.pushUndo();
    const rows = app.currentPattern();
    floodFill(app.doc, p.x, p.y, (x, y) => app.doc.set(x, y, patternAt(rows, x, y)));
  },

  onMove() {},
  onUp() {},
};
