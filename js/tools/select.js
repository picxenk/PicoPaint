let mode = null; // 'marquee' | 'move'
let anchor = null;
let offset = null;

function rectBetween(a, b) {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(b.x - a.x) + 1,
    h: Math.abs(b.y - a.y) + 1,
  };
}

// 선택 영역 안을 누르면 픽셀을 떼어내 이동을 시작한다. 자유 선택(lasso)도 같이 쓴다.
export function startMove(app, p) {
  if (!app.selectionContains(p)) return null;
  const selection = app.state.selection;
  app.liftSelection();
  return { x: p.x - selection.x, y: p.y - selection.y };
}

export function moveTo(app, p, offset) {
  const selection = app.state.selection;
  selection.x = p.x - offset.x;
  selection.y = p.y - offset.y;
}

export const select = {
  name: 'select',
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
    // 바깥을 누르면: 기존 선택을 내려놓고 새 사각형을 그린다.
    app.dropSelection();
    mode = 'marquee';
    anchor = app.clampToDoc(p);
    app.state.marquee = rectBetween(anchor, anchor);
  },

  onMove(app, p) {
    if (mode === 'move') moveTo(app, p, offset);
    else if (mode === 'marquee') app.state.marquee = rectBetween(anchor, app.clampToDoc(p));
  },

  onUp(app) {
    if (mode === 'marquee') {
      const m = app.state.marquee;
      app.state.marquee = null;
      if (m.w > 1 || m.h > 1) app.state.selection = { ...m, buffer: null };
    }
    mode = null;
  },
};
