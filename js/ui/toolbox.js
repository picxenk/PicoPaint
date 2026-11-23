import { bitmapToCanvas } from '../bitmap.js';
import { toolIcon } from '../icons.js';
import { element, canvasFor } from './dom.js';

// layout: [['lasso', 'select'], ...] — 2열 배치
export function createToolbox(el, layout, { onSelect, onDoubleClick }) {
  const cells = new Map();

  for (const row of layout) {
    for (const name of row) {
      const cell = element('div', 'tool');
      cell.append(canvasFor(toolIcon(name), bitmapToCanvas));
      cell.addEventListener('pointerdown', () => onSelect(name));
      cell.addEventListener('dblclick', () => onDoubleClick(name));
      el.append(cell);
      cells.set(name, cell);
    }
  }

  return {
    update(active) {
      for (const [name, cell] of cells) cell.classList.toggle('selected', name === active);
    },
  };
}
