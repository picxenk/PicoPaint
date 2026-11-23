import { BLACK } from '../bitmap.js';
import { penLine } from '../raster.js';

let last = null;

// 선 두께 팔레트의 두께로, 항상 검은색으로 그린다.
function draw(app, from, to) {
  penLine(from.x, from.y, to.x, to.y, app.state.lineWidth, (x, y) => app.doc.set(x, y, BLACK));
}

export const pencil = {
  name: 'pencil',
  cursor: 'crosshair',

  onDown(app, p) {
    app.pushUndo();
    draw(app, p, p);
    last = p;
  },

  onMove(app, p) {
    if (!last) return;
    // 마우스 이벤트 사이의 빈틈을 직선으로 잇는다.
    draw(app, last, p);
    last = p;
  },

  onUp() {
    last = null;
  },
};
