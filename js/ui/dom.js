// 마우스 위치를 요소 내부의 CSS 픽셀 좌표로 바꾼다.
// 앱 전체가 transform: scale()로 확대되어 있어도 동작한다.
export function localPoint(el, e) {
  const rect = el.getBoundingClientRect();
  const scale = rect.width / el.offsetWidth;
  return {
    x: (e.clientX - rect.left) / scale - el.clientLeft,
    y: (e.clientY - rect.top) / scale - el.clientTop,
  };
}

export function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

export function canvasFor(bmp, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  draw(bmp, canvas);
  return canvas;
}
