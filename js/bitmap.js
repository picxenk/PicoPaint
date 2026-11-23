// 1-bit 비트맵. 픽셀 하나 = 1바이트 (0 = 흰색, 1 = 검정).
// CLEAR는 미리보기 레이어에서만 쓰는 "투명" 값이다.

export const WHITE = 0;
export const BLACK = 1;
export const CLEAR = 255;

export class Bitmap {
  constructor(width, height, fill = WHITE) {
    this.width = width;
    this.height = height;
    this.pixels = new Uint8Array(width * height).fill(fill);
  }

  // "#"은 검정, 그 외 문자는 흰색인 문자열 배열로 비트맵을 만든다.
  static fromStrings(rows) {
    const bmp = new Bitmap(rows[0].length, rows.length);
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === '#') bmp.set(x, y, BLACK);
      }
    });
    return bmp;
  }

  contains(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  get(x, y) {
    return this.contains(x, y) ? this.pixels[y * this.width + x] : WHITE;
  }

  set(x, y, value) {
    if (this.contains(x, y)) this.pixels[y * this.width + x] = value;
  }

  fill(value) {
    this.pixels.fill(value);
  }

  fillRect(x, y, w, h, value) {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) this.set(x + i, y + j, value);
    }
  }

  copyRect(x, y, w, h) {
    const out = new Bitmap(w, h);
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) out.pixels[j * w + i] = this.get(x + i, y + j);
    }
    return out;
  }

  // src를 (x, y)에 찍는다. CLEAR 픽셀은 건너뛴다.
  draw(src, x, y) {
    for (let j = 0; j < src.height; j++) {
      for (let i = 0; i < src.width; i++) {
        const value = src.pixels[j * src.width + i];
        if (value !== CLEAR) this.set(x + i, y + j, value);
      }
    }
  }
}

// ImageData의 RGBA 4바이트를 Uint32 하나로 다룬다 (리틀 엔디언: 0xAABBGGRR).
export const PIXEL_BLACK = 0xff000000;
export const PIXEL_WHITE = 0xffffffff;

export function bitmapToCanvas(bmp, canvas) {
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(bmp.width, bmp.height);
  const out = new Uint32Array(image.data.buffer);
  for (let i = 0; i < bmp.pixels.length; i++) {
    const value = bmp.pixels[i];
    out[i] = value === BLACK ? PIXEL_BLACK : value === WHITE ? PIXEL_WHITE : 0;
  }
  ctx.putImageData(image, 0, 0);
}
