// 래스터화: 도형을 픽셀로 바꾸는 함수들.
// Canvas 2D의 lineTo/ellipse는 안티앨리어싱이 생기므로 쓰지 않고 직접 픽셀을 찍는다.
// 모든 함수는 plot(x, y) 콜백으로 픽셀을 내보낸다. 무엇을 어디에 찍을지는 호출하는 쪽이 정한다.

// Bresenham 직선 알고리즘: 정수 덧셈만으로 직선을 그린다.
export function line(x0, y0, x1, y1, plot) {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    plot(x0, y0);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

// 두께 있는 선: 정사각형 펜을 직선을 따라 찍는다 (MacPaint 방식).
export function penLine(x0, y0, x1, y1, size, plot) {
  const offset = (size - 1) >> 1;
  line(x0, y0, x1, y1, (x, y) => {
    for (let j = 0; j < size; j++) {
      for (let i = 0; i < size; i++) plot(x - offset + i, y - offset + j);
    }
  });
}

// 사각형, 둥근 사각형, 타원은 모두 "모서리가 둥근 사각형"이다.
//   rect:  모서리 반지름 0
//   rrect: 모서리 반지름 radius
//   oval:  모서리 반지름 = 가로/세로의 절반
// 1) 각 픽셀이 도형 안에 있는지 판정해 마스크를 만들고
// 2) 안쪽 픽셀 중 lineWidth 거리 안에 바깥이 있으면 테두리, 아니면 내부로 나눈다.
export function shape(x0, y0, x1, y1, options, plotBorder, plotFill) {
  const { kind, lineWidth = 1, radius = 8 } = options;
  const left = Math.min(x0, x1);
  const top = Math.min(y0, y1);
  const w = Math.abs(x1 - x0) + 1;
  const h = Math.abs(y1 - y0) + 1;

  let rx = 0;
  let ry = 0;
  if (kind === 'rrect') rx = ry = Math.min(radius, w / 2, h / 2);
  if (kind === 'oval') {
    rx = w / 2;
    ry = h / 2;
  }

  const mask = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      mask[y * w + x] = insideRoundRect(x + 0.5, y + 0.5, w, h, rx, ry) ? 1 : 0;
    }
  }

  const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === 1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!inside(x, y)) continue;
      let border = false;
      for (let k = 1; k <= lineWidth && !border; k++) {
        border = !inside(x - k, y) || !inside(x + k, y) || !inside(x, y - k) || !inside(x, y + k);
      }
      if (border) plotBorder(left + x, top + y);
      else if (plotFill) plotFill(left + x, top + y);
    }
  }
}

// 점 (px, py)가 크기 w×h, 모서리 반지름 rx/ry인 둥근 사각형 안에 있는가?
function insideRoundRect(px, py, w, h, rx, ry) {
  if (rx <= 0 || ry <= 0) return true;
  // 가장 가까운 모서리 원의 중심. 모서리 영역이 아니면 점 자신이 되어 거리가 0이 된다.
  const cx = px < rx ? rx : px > w - rx ? w - rx : px;
  const cy = py < ry ? ry : py > h - ry ? h - ry : py;
  const dx = (px - cx) / rx;
  const dy = (py - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

// 다각형 내부 채우기 (스캔라인): 각 행마다 변과 만나는 x를 구해 정렬하고, 짝을 지어 그 사이를 칠한다.
// 꼭짓점은 픽셀 중심 좌표로 본다.
export function fillPolygon(points, plot) {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      if (a.y <= y !== b.y <= y) xs.push(a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = Math.ceil(xs[k]); x <= Math.floor(xs[k + 1]); x++) plot(x, y);
    }
  }
}

// 영역 채우기: (x, y)와 같은 색으로 상하좌우 연결된 픽셀을 모두 찾아 plot한다.
// seen 배열로 방문을 기록하므로, plot이 원래 색과 같은 색을 찍어도 무한 반복하지 않는다.
export function floodFill(bmp, x, y, plot) {
  if (!bmp.contains(x, y)) return;
  const { width, height, pixels } = bmp;
  const start = y * width + x;
  const target = pixels[start];
  const seen = new Uint8Array(width * height);
  const stack = [start];
  seen[start] = 1;

  const visit = (i) => {
    if (!seen[i] && pixels[i] === target) {
      seen[i] = 1;
      stack.push(i);
    }
  };

  while (stack.length > 0) {
    const i = stack.pop();
    const px = i % width;
    const py = (i - px) / width;
    if (px > 0) visit(i - 1);
    if (px < width - 1) visit(i + 1);
    if (py > 0) visit(i - width);
    if (py < height - 1) visit(i + width);
    plot(px, py);
  }
}
