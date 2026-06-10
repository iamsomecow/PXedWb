export class Vector2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  toArray() {
    return [this.x, this.y];
  }
  equals(other, otherY) {
    if (typeof otherY !== "undefined") {
      return this.x === other && this.y === otherY;
    }
    return this.x === other.x && this.y === other.y;
  }
  scale(scale) {
    this.x *= scale;
    this.y *= scale;
  }
}
export class Index {
  constructor(frameIndex = 0, layerIndexArray = [0]) {
    this.frameIndex = frameIndex;
    this.layerIndexArray = layerIndexArray;
  }
  currentLayerIndex() {
    return this.layerIndexArray[this.frameIndex];
  }
  incrementLayerIndex(increment = 1) {
    this.layerIndexArray[this.frameIndex] += increment;
  }
  incrementFrameIndex(increment = 1) {
    this.frameIndex += increment;
    if (!this.layerIndexArray[this.frameIndex]) {
      this.layerIndexArray[this.frameIndex] = 0;
    }
  }
  setFrameIndex(index) {
    this.frameIndex = index;
    if (!this.layerIndexArray[this.frameIndex]) {
      this.layerIndexArray[this.frameIndex] = 0;
    }
  }
}
/**
 * adds a element to an array at specified index
 * @param {Array} array - array to add element to
 * @param {any} element - element to add to array
 * @param {number} index - index of array to add element
 */

export function AddToArray(array, element, index) {
  return [...array.slice(0, index + 1), element, ...array.slice(index + 1)];
}
export function hexToRgba(hex) {
  hex = hex.replace("#", "");

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // If AA exists → convert to 0–1
  // If not → default to 1
  let a = 255;
  if (hex.length === 8) {
    a = parseInt(hex.slice(6, 8), 16);
  }

  return { r, g, b, a };
}
export function rgbaToHex(rgba) {
  let r = rgba.r.toString(16);
  let g = rgba.g.toString(16);
  let b = rgba.b.toString(16);
  let a = rgba.a.toString(16);
  if (r.length === 1) r = "0" + r;
  if (g.length === 1) g = "0" + g;
  if (b.length === 1) b = "0" + b;
  if (a.length === 1) a = "0" + a;
  if (a === "ff") a = "";
  return "#" + r + g + b + a;
}
export function CombineUintClampedArray(arrays, size) {
  const combined = new Uint8ClampedArray(size.x * size.y * 4);

  for (let i = 0; i < arrays[0].length; i += 4) {
    let r = arrays[0][i];
    let g = arrays[0][i + 1];
    let b = arrays[0][i + 2];
    let a = arrays[0][i + 3] / 255;
    for (let j = 1; j < arrays.length; j++) {
      const fga = arrays[j][i + 3] / 255;
      r = Math.round(r * (1 - fga) + arrays[j][i] * fga);
      g = Math.round(g * (1 - fga) + arrays[j][i + 1] * fga);
      b = Math.round(b * (1 - fga) + arrays[j][i + 2] * fga);
      a = a + fga * (1 - a);
    }
    combined[i] = r;
    combined[i + 1] = g;
    combined[i + 2] = b;
    combined[i + 3] = Math.round(a * 255);
  }
  return combined;
}
/**
 * scales a Uint8ClampedArray
 * @param {Uint8ClampedArray} array 
 * @param {number} scale 
 * @param {Vector2} size

*/
export function ScaleUintClampedArray(array, scale, size) {
  const scaled = new Uint8ClampedArray(array.length * scale * scale);
  let o = 0;
  for (let i = 0; i < array.length; i += 4) {
    if (i !== 0 && i % (size.x * 4) === 0) o++;
    add(i);
  }
  function add(i) {
    let h = 0;
    for (let j = 0; j < scale; j++) {
      for (let t = 0; t < scale; t++) {
        const c = h * 4;
        const s = i * scale;
        const b = c + s + t * 4 + o * size.x * 4 * scale;
        scaled[b] = array[i];
        scaled[b + 1] = array[i + 1];
        scaled[b + 2] = array[i + 2];
        scaled[b + 3] = array[i + 3];
      }
      h += size.x * scale;
    }
  }

  return scaled;
}
export class SpriteMap {
  constructor(spriteSize, width) {
    this.spriteSize = spriteSize;
    this.width = width;
    this.sprites = [];
  }
  outSize = null;
  add(sprite) {
    this.sprites.push(sprite);
  }
  setWidth(newWidth) {
    this.width = newWidth;
  }
  generate() {
    const height = Math.ceil(this.sprites.length / this.width);
    const pixelWidth = this.spriteSize.x * 4;
    const pixelRow = this.width * pixelWidth;
    const out = new Uint8ClampedArray(
      this.width * height * this.spriteSize.x * this.spriteSize.y * 4,
    );
    const row = pixelRow * this.spriteSize.y;
    let currentRow = 0;

    for (let i = 0; i < this.sprites.length; i++) {
      const sprite = this.sprites[i];
      let currentPixelRow = i === 0 ? 0 : (i % this.width) * pixelWidth;

      if (i !== 0 && i % this.width === 0) currentRow += row;

      for (let j = 0; j < sprite.length; j++) {
        if (j !== 0 && j % pixelWidth === 0) currentPixelRow += pixelRow;

        out[currentPixelRow + currentRow + (j % (this.spriteSize.x * 4))] =
          sprite[j];
      }
    }
    this.outSize = new Vector2(this.width * this.spriteSize.x, height * this.spriteSize.y);
    return out;
  }
}
/**
 * Draws a shape on the pixel array
 * @param {String}  type
 * @param {Vector2}  p1
 * @param {Vector2}  p2
 * @param {function}  plot
 */
export function drawShape(type, p1, p2, plot) {
  if (!p1 || !p2) {
    console.error("unexpected null. type: ", type, ", p1: ", p1, ", p2: ", p2);
  }
  switch (type) {
    case "line":
      drawLine(p1, p2);
      break;
    case "rectangle":
      drawRectangle(p1, p2);
      break;
    case "right triangle":
      drawRightTriangle(p1, p2);
      break;
    case "triangle":
      drawTriangle(p1, p2);
      break;
    case "diamond":
      drawDiamond(p1, p2);
      break;
    case "oval":
      const xc = (p1.x + p2.x) / 2;
      const yc = (p1.y + p2.y) / 2;
      const rx = Math.abs(p2.x - p1.x) / 2;
      const ry = Math.abs(p2.y - p1.y) / 2;
      drawEllipse(xc, yc, rx, ry, plot);
      break;
    default:
      throw new Error(`Unknown shape type: ${type}`);
  }
  function drawLine(p1, p2) {
    const dx = Math.abs(p2.x - p1.x);
    const dy = Math.abs(p2.y - p1.y);
    const sx = p1.x < p2.x ? 1 : -1;
    const sy = p1.y < p2.y ? 1 : -1;
    let err = dx - dy;
    let x = p1.x;
    let y = p1.y;
    while (true) {
      plot(x, y);
      if (x === p2.x && y === p2.y) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }
  function drawRectangle(p1, p2) {
    drawLine(p1, new Vector2(p2.x, p1.y));
    drawLine(p1, new Vector2(p1.x, p2.y));
    drawLine(p2, new Vector2(p1.x, p2.y));
    drawLine(p2, new Vector2(p2.x, p1.y));
  }
  function drawRightTriangle(p1, p2) {
    const p3 = new Vector2(p1.x, p2.y);
    drawLine(p1, p2);
    drawLine(p1, p3);
    drawLine(p2, p3);
  }
  function drawTriangle(p1, p2) {
    const p3 = new Vector2(
      Math.round((p1.x + p2.x) / 2),
      Math.round(p1.y - Math.abs(p2.x - p1.x) * Math.sin(Math.PI / 3)),
    );
    drawLine(p1, p2);
    drawLine(p1, p3);
    drawLine(p2, p3);
  }
  function drawDiamond(p1, p2) {
    const t1 = new Vector2(Math.floor((p1.x + p2.x) / 2), p1.y);
    const t2 = new Vector2(Math.ceil((p1.x + p2.x) / 2), p1.y);
    const b1 = new Vector2(Math.floor((p1.x + p2.x) / 2), p2.y);
    const b2 = new Vector2(Math.ceil((p1.x + p2.x) / 2), p2.y);
    const l1 = new Vector2(p1.x, Math.floor((p1.y + p2.y) / 2));
    const l2 = new Vector2(p1.x, Math.ceil((p1.y + p2.y) / 2));
    const r1 = new Vector2(p2.x, Math.floor((p1.y + p2.y) / 2));
    const r2 = new Vector2(p2.x, Math.ceil((p1.y + p2.y) / 2));
    drawLine(t1, l1);
    drawLine(t2, r1);
    drawLine(b1, l2);
    drawLine(b2, r2);
  }
  /**
   * Draws a pixel-perfect ellipse using the Midpoint Ellipse Algorithm.
   * @param {number} xc - X coordinate of the center
   * @param {number} yc - Y coordinate of the center
   * @param {number} rx - Radius along X-axis
   * @param {number} ry - Radius along Y-axis
   * @param {function} plot - Callback to plot a pixel (x, y)
   */
  function drawEllipse(xc, yc, rx, ry, plot) {
    let x = xc % 1;
    let y = ry;

    // Decision parameters
    let rxSq = rx * rx;
    let rySq = ry * ry;
    let dx = 2 * rySq * x;
    let dy = 2 * rxSq * y;

    // Region 1
    let p1 = rySq - rxSq * ry + 0.25 * rxSq;
    while (dx < dy) {
      plot(xc + x, yc + y);
      plot(xc - x, yc + y);
      plot(xc + x, yc - y);
      plot(xc - x, yc - y);

      if (p1 < 0) {
        x++;
        dx += 2 * rySq;
        p1 += dx + rySq;
      } else {
        x++;
        y--;
        dx += 2 * rySq;
        dy -= 2 * rxSq;
        p1 += dx - dy + rySq;
      }
    }

    // Region 2
    let p2 =
      rySq * (x + 0.5) * (x + 0.5) + rxSq * (y - 1) * (y - 1) - rxSq * rySq;
    while (y >= 0) {
      plot(xc + x, yc + y);
      plot(xc - x, yc + y);
      plot(xc + x, yc - y);
      plot(xc - x, yc - y);

      if (p2 > 0) {
        y--;
        dy -= 2 * rxSq;
        p2 += rxSq - dy;
      } else {
        y--;
        x++;
        dx += 2 * rySq;
        dy -= 2 * rxSq;
        p2 += dx - dy + rxSq;
      }
    }
  }
}
