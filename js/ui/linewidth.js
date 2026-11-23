import { Bitmap, BLACK, bitmapToCanvas } from '../bitmap.js';
import { CHECK } from '../icons.js';
import { localPoint } from './dom.js';

const ROW_HEIGHT = 16;

export function createLineWidthPalette(canvas, widths, { onSelect }) {
  canvas.addEventListener('pointerdown', (e) => {
    const { y } = localPoint(canvas, e);
    const index = Math.max(0, Math.min(widths.length - 1, Math.floor(y / ROW_HEIGHT)));
    onSelect(widths[index]);
  });

  return {
    update(active) {
      const bmp = new Bitmap(canvas.width, canvas.height);
      widths.forEach((w, i) => {
        const center = i * ROW_HEIGHT + ROW_HEIGHT / 2;
        bmp.fillRect(17, center - (w >> 1), 30, w, BLACK);
        if (w === active) bmp.draw(CHECK, 4, center - 3);
      });
      bitmapToCanvas(bmp, canvas);
    },
  };
}
