// 앱 상태와 문서를 바꾸는 공통 동작. 도구들은 이 모듈을 `app`으로 받아 사용한다.

import { Bitmap, WHITE, BLACK, CLEAR } from './bitmap.js';
import { PATTERNS } from './patterns.js';

// 문서 크기 = 창에 보이는 캔버스 크기. 스크롤 없이 그림 전체가 한눈에 보인다.
export const DOC_WIDTH = 416;
export const DOC_HEIGHT = 240;

// 문서: 실제 그림
export const doc = new Bitmap(DOC_WIDTH, DOC_HEIGHT);
// 미리보기 레이어: 드래그 중인 도형. CLEAR가 아닌 픽셀만 문서 위에 보인다.
export const preview = new Bitmap(DOC_WIDTH, DOC_HEIGHT, CLEAR);

export const state = {
  tool: 'pencil',
  pattern: 0,
  lineWidth: 1,
  // 선택 영역 { x, y, w, h, mask?, outline?, buffer }
  //   mask: 자유 선택일 때 영역 모양 (w×h, BLACK = 선택됨). 없으면 사각형 전체.
  //   buffer: 있으면 문서에서 떼어내 "떠 있는" 상태
  selection: null,
  marquee: null, // 드래그 중인 선택 사각형 { x, y, w, h }
  lasso: null, // 드래그 중인 자유 선택 경로 [{ x, y }, ...]
  hover: null, // 마우스 위치 (문서 좌표)
  undo: null, // 마지막 작업 직전의 문서 스냅샷
  dirty: true, // 다시 그려야 하는가
};

export function invalidate() {
  state.dirty = true;
}

export function currentPattern() {
  return PATTERNS[state.pattern].rows;
}

// ---------- 실행 취소 (1단계) ----------

export function pushUndo() {
  state.undo = doc.pixels.slice();
}

// 현재와 스냅샷을 맞바꾼다. 한 번 더 하면 다시 실행(Redo)이 된다.
export function undo() {
  dropSelection();
  if (!state.undo) return;
  const current = doc.pixels.slice();
  doc.pixels.set(state.undo);
  state.undo = current;
  invalidate();
}

// ---------- 미리보기 → 문서 ----------

export function commitPreview() {
  pushUndo();
  doc.draw(preview, 0, 0);
  preview.fill(CLEAR);
  invalidate();
}

// ---------- 선택 영역 ----------

function isSelected(s, x, y) {
  return !s.mask || s.mask.get(x, y) === BLACK;
}

// 문서 좌표 p가 선택 영역 안에 있는가
export function selectionContains(p) {
  const s = state.selection;
  if (!s) return false;
  const x = p.x - s.x;
  const y = p.y - s.y;
  return x >= 0 && y >= 0 && x < s.w && y < s.h && isSelected(s, x, y);
}

// 선택된 픽셀만 흰색으로 지운다.
function eraseSelected(s) {
  for (let y = 0; y < s.h; y++) {
    for (let x = 0; x < s.w; x++) {
      if (isSelected(s, x, y)) doc.set(s.x + x, s.y + y, WHITE);
    }
  }
}

// 선택 영역의 픽셀을 문서에서 떼어낸다 (이동을 시작할 때).
// 선택되지 않은 픽셀은 CLEAR로 두어, 내려놓을 때 그 자리를 덮지 않게 한다.
export function liftSelection() {
  const s = state.selection;
  if (!s || s.buffer) return;
  pushUndo();
  s.buffer = doc.copyRect(s.x, s.y, s.w, s.h);
  for (let y = 0; y < s.h; y++) {
    for (let x = 0; x < s.w; x++) {
      if (!isSelected(s, x, y)) s.buffer.set(x, y, CLEAR);
    }
  }
  eraseSelected(s);
  invalidate();
}

// 떠 있는 픽셀을 문서에 내려놓고 선택을 해제한다.
export function dropSelection() {
  const s = state.selection;
  if (!s) return;
  if (s.buffer) doc.draw(s.buffer, s.x, s.y);
  state.selection = null;
  invalidate();
}

// 선택 영역을 흰색으로 지운다. 선택이 없으면 false.
export function clearSelection() {
  const s = state.selection;
  if (!s) return false;
  if (!s.buffer) {
    pushUndo();
    eraseSelected(s);
  }
  state.selection = null;
  invalidate();
  return true;
}

export function clearAll() {
  dropSelection();
  pushUndo();
  doc.fill(WHITE);
  invalidate();
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function clampToDoc(p) {
  return { x: clamp(p.x, 0, DOC_WIDTH - 1), y: clamp(p.y, 0, DOC_HEIGHT - 1) };
}
