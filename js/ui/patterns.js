import { Bitmap, bitmapToCanvas } from '../bitmap.js';
import { patternAt } from '../patterns.js';
import { element } from './dom.js';

function paintPattern(canvas, rows) {
  const bmp = new Bitmap(canvas.width, canvas.height);
  for (let y = 0; y < bmp.height; y++) {
    for (let x = 0; x < bmp.width; x++) bmp.set(x, y, patternAt(rows, x, y));
  }
  bitmapToCanvas(bmp, canvas);
}

function makeCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function createPatternPalette(el, patterns, { onSelect }) {
  const current = element('div');
  current.id = 'pattern-current';
  const currentCanvas = makeCanvas(26, 21);
  current.append(currentCanvas);

  const grid = element('div');
  grid.id = 'pattern-grid';
  patterns.forEach((pattern, i) => {
    const cell = makeCanvas(36, 15);
    cell.title = pattern.name;
    paintPattern(cell, pattern.rows);
    cell.addEventListener('pointerdown', () => onSelect(i));
    grid.append(cell);
  });

  el.append(current, grid);

  return {
    update(index) {
      paintPattern(currentCanvas, patterns[index].rows);
    },
  };
}
