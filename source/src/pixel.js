import { drawShape, Vector2, Index, AddToArray } from "./utility.js";
const MAX_UNDO_LEVELS = 50;

class Stacks {
  constructor(stacks) {
    this.stacks = stacks || {
      undo: { 0: { 0: [[]] } },
      redo: { 0: { 0: [[]] } },
    };
  }
  pushUndo(
    color,
    position,
    FrameIndex = this.currentFrameIndex,
    LayerIndex = this.currentLayerIndex,
  ) {
    
    if (!this.stacks.undo[FrameIndex]) {
      this.stacks.undo[FrameIndex] = {};
    }
    if (!this.stacks.undo[FrameIndex][LayerIndex]) {
      this.stacks.undo[FrameIndex][LayerIndex] = [[]];
    }

    if (this.stacks.undo[FrameIndex][LayerIndex].length >= MAX_UNDO_LEVELS) {
      this.stacks.undo[FrameIndex][LayerIndex].shift();
    }
    this.stacks.undo[FrameIndex][LayerIndex][
      this.stacks.undo[FrameIndex][LayerIndex].length - 1
    ].unshift({ color, position });
  }
  pushRedo(
    color,
    position,
    FrameIndex = this.currentFrameIndex,
    LayerIndex = this.currentLayerIndex,
  ) {
    
    if (!this.stacks.redo[FrameIndex]) {
      this.stacks.redo[FrameIndex] = {};
    }
    if (!this.stacks.redo[FrameIndex][LayerIndex]) {
      this.stacks.redo[FrameIndex][LayerIndex] = [[]];
    }

    if (this.stacks.redo[FrameIndex][LayerIndex].length >= MAX_UNDO_LEVELS) {
      this.stacks.redo[FrameIndex][LayerIndex].shift();
    }
    this.stacks.redo[FrameIndex][LayerIndex][
      this.stacks.redo[FrameIndex][LayerIndex].length - 1
    ].unshift({ color, position });
    
  }
  newUndoLevel(
    FrameIndex = this.currentFrameIndex,
    LayerIndex = this.currentLayerIndex,
  ) {
    
    if (!this.stacks.undo[FrameIndex]) {
      this.stacks.undo[FrameIndex] = {};
    }
    if (!this.stacks.undo[FrameIndex][LayerIndex]) {
      this.stacks.undo[FrameIndex][LayerIndex] = [[]];
    }
    this.stacks.undo[FrameIndex][LayerIndex].push([]);
  }
  newRedoLevel(
    FrameIndex = this.currentFrameIndex,
    LayerIndex = this.currentLayerIndex,
  ) {
    
    if (!this.stacks.redo[FrameIndex]) {
      this.stacks.redo[FrameIndex] = {};
    }
    if (!this.stacks.redo[FrameIndex][LayerIndex]) {
      this.stacks.redo[FrameIndex][LayerIndex] = [[]];
    }
    this.stacks.redo[FrameIndex][LayerIndex].push([]);
  }
  undo(
    FrameIndex = this.currentFrameIndex,
    LayerIndex = this.currentLayerIndex,
  ) {
    
    if (
      !this.stacks.undo[FrameIndex] ||
      !this.stacks.undo[FrameIndex][LayerIndex] ||
      this.stacks.undo[FrameIndex][LayerIndex].length === 0
    ) {
      return;
    }
    const lastAction = this.stacks.undo[FrameIndex][LayerIndex].pop();

    if (!this.stacks.redo[FrameIndex]) {
      this.stacks.redo[FrameIndex] = {};
    }
    if (!this.stacks.redo[FrameIndex][LayerIndex]) {
      this.stacks.redo[FrameIndex][LayerIndex] = [[]];
    }

    return lastAction;
  }
  redo(
    FrameIndex = this.currentFrameIndex,
    LayerIndex = this.currentLayerIndex,
  ) {
    
    if (
      !this.stacks.redo[FrameIndex] ||
      !this.stacks.redo[FrameIndex][LayerIndex] ||
      this.stacks.redo[FrameIndex][LayerIndex].length === 0
    ) {
      return null;
    }
    const nextAction = this.stacks.redo[FrameIndex][LayerIndex].pop();
    if (!this.stacks.undo[FrameIndex]) {
      this.stacks.undo[FrameIndex] = {};
    }
    if (!this.stacks.undo[FrameIndex][LayerIndex]) {
      this.stacks.undo[FrameIndex][LayerIndex] = [[]];
    }
    return nextAction;
  }
}
class State {
  constructor(
    size,
    state = this.newState(size),
    index = new Index(),
    stacks = new Stacks(),
  ) {
    this.size = size;
    this.state = state;
    this.currentFrameIndex = index.frameIndex;
    this.currentLayerIndex = index.currentLayerIndex();
    this.Index = index;
    this.stacks = stacks;
  }
  newState(size, img = new Uint8ClampedArray(size.x * size.y * 4)) {
    return [[img]];
  }
  getShownLayers() {
    return this.state[this.currentFrameIndex].slice(
      0,
      this.currentLayerIndex + 1,
    );
  }
  incrementFrame(increment = 1) {
    if (!this.state[this.currentFrameIndex + increment]) {
      if (this.currentFrameIndex + increment === -1) return;
      this.state[this.currentFrameIndex + increment] = [
        new Uint8ClampedArray(this.size.x * this.size.y * 4),
      ];
    }

    this.Index.incrementFrameIndex(increment);
    this.currentFrameIndex = this.Index.frameIndex;
    this.currentLayerIndex = this.Index.currentLayerIndex();
  }
  loopFrame(increment = 1) {
    const newFrameIndex =
      (this.currentFrameIndex + increment) % this.state.length;

    this.Index.setFrameIndex(newFrameIndex);
    this.currentFrameIndex = this.Index.frameIndex;
    this.currentLayerIndex = this.Index.currentLayerIndex();
  }
  incrementLayer(increment = 1) {
    if (
      !this.state[this.currentFrameIndex][this.currentLayerIndex + increment]
    ) {
      if (this.currentLayerIndex + increment === -1) return;
      this.state[this.currentFrameIndex][this.currentLayerIndex + increment] =
        new Uint8ClampedArray(this.size.x * this.size.y * 4);
    }
    this.Index.incrementLayerIndex(increment);
    this.currentLayerIndex = this.Index.currentLayerIndex();
  }
  duplicateFrame(frame = this.currentFrameIndex) {
    this.state = AddToArray(this.state, this.state[frame].map((v) => { return new Uint8ClampedArray(v)}), frame);
    this.Index.layerIndexArray = AddToArray(this.Index.layerIndexArray, this.Index.layerIndexArray[frame], frame);
    this.incrementFrame(1);

  }
  /**
   * Gets the current layer of the current frame
   * @returns uint8clampedarray of the current layer of the current frame
   */
  current() {
    return this.state[this.currentFrameIndex][this.currentLayerIndex];
  }
  plotPixel(
    position,
    color,
    FrameIndex = this.currentFrameIndex,
    LayerIndex = this.currentLayerIndex,
  ) {
    const index = position.y * this.size.x * 4 + position.x * 4;
    const oldColor = {
      r: this.state[FrameIndex][LayerIndex][index],
      g: this.state[FrameIndex][LayerIndex][index + 1],
      b: this.state[FrameIndex][LayerIndex][index + 2],
      a: this.state[FrameIndex][LayerIndex][index + 3],
    };
    this.stacks.pushUndo(oldColor, position, FrameIndex, LayerIndex);
    this.state[FrameIndex][LayerIndex][index] = color.r;
    this.state[FrameIndex][LayerIndex][index + 1] = color.g;
    this.state[FrameIndex][LayerIndex][index + 2] = color.b;
    this.state[FrameIndex][LayerIndex][index + 3] = color.a;
  }
  undoPixel(
    position,
    color,
    FrameIndex = this.currentFrameIndex,
    LayerIndex = this.currentLayerIndex,
  ) {
    const index = position.y * this.size.x * 4 + position.x * 4;
    const oldColor = {
      r: this.state[FrameIndex][LayerIndex][index],
      g: this.state[FrameIndex][LayerIndex][index + 1],
      b: this.state[FrameIndex][LayerIndex][index + 2],
      a: this.state[FrameIndex][LayerIndex][index + 3],
    };
    this.stacks.pushRedo(oldColor, position, FrameIndex, LayerIndex);
    this.state[FrameIndex][LayerIndex][index] = color.r;
    this.state[FrameIndex][LayerIndex][index + 1] = color.g;
    this.state[FrameIndex][LayerIndex][index + 2] = color.b;
    this.state[FrameIndex][LayerIndex][index + 3] = color.a;
  }
  plotPixels(
    position,
    pixels,
    pixelsSize,
    FrameIndex = this.currentFrameIndex,
    LayerIndex = this.currentLayerIndex,
  ) {
    for (let i = 0; i < pixels.length; i += 4) {
      const x = (i / 4) % pixelsSize.x;
      const y = Math.floor(i / 4 / pixelsSize.x);
      const color = {
        r: pixels[i],
        g: pixels[i + 1],
        b: pixels[i + 2],
        a: pixels[i + 3],
      };
      this.plotPixel(
        new Vector2(position.x + x, position.y + y),
        color,
        FrameIndex,
        LayerIndex,
      );
    }
  }
  getPixel(
    position,
    FrameIndex = this.currentFrameIndex,
    LayerIndex = this.currentLayerIndex,
  ) {
    const index = position.y * this.size.x * 4 + position.x * 4;
    return [
      this.state[FrameIndex][LayerIndex][index],
      this.state[FrameIndex][LayerIndex][index + 1],
      this.state[FrameIndex][LayerIndex][index + 2],
      this.state[FrameIndex][LayerIndex][index + 3],
    ];
  }
  getPixels(
    min,
    max,
    FrameIndex = this.currentFrameIndex,
    LayerIndex = this.currentLayerIndex,
  ) {
    const pixels = new Uint8ClampedArray(
      (max.x + 1 - min.x) * (max.y + 1 - min.y) * 4,
    );
    for (let y = min.y; y < max.y + 1; y++) {
      for (let x = min.x; x < max.x + 1; x++) {
        const pixel = this.getPixel(new Vector2(x, y), FrameIndex, LayerIndex);
        const index =
          ((y - min.y) * (max.x - min.x) + (x + (y - min.y) - min.x)) * 4;
        pixels[index + 0] = pixel[0];
        pixels[index + 1] = pixel[1];
        pixels[index + 2] = pixel[2];
        pixels[index + 3] = pixel[3];
      }
    }
    return pixels;
  }
}
export class PixelEditor {
  constructor(
    size,
    state = new State(size),
    clickPoint = null,
    preview = new Uint8ClampedArray(size.x * size.y * 4),
    selectionStart = null,
    selectionEnd = null,
    clipboard = null,
    clipboardSize = null,
  ) {
    this.size = size;
    this.state = state;
    this.clickPoint = clickPoint;
    this.preview = preview;
    this.selectionStart = selectionStart;
    this.selectionEnd = selectionEnd;
    this.clipboard = clipboard;
    this.clipboardSize = clipboardSize;
  }
  setState(size, i) {
    this.size = size;
    this.state = new State(size, [[i]]);
    this.clickPoint = null;
    this.preview = new Uint8ClampedArray(size.x * size.y * 4);
    this.selectionStart = null;
    this.selectionEnd = null;
  }
  clear(size) {
    this.size = size;
    this.state = new State(size);
    this.clickPoint = null;
    this.preview = new Uint8ClampedArray(size.x * size.y * 4);
    this.selectionStart = null;
    this.selectionEnd = null;
  }
  clearPreview() {
    this.preview.fill(0);
  }
  plot(position, color) {
    this.state.plotPixel(position, color);
  }
  plotPreview(position, color) {
    const index = position.y * this.size.x * 4 + position.x * 4;
    this.preview[index] = color.r;
    this.preview[index + 1] = color.g;
    this.preview[index + 2] = color.b;
    this.preview[index + 3] = color.a;
  }
  plotShape(type, position, color) {
    if (this.clickPoint === null) {
      this.clickPoint = position;
    } else {
      this.newUndoLevel();
      drawShape(type, this.clickPoint, position, (x, y) =>
        this.plot(new Vector2(x, y), color),
      );
      this.clickPoint = null;
    }
  }
  previewShape(type, position, color, position2 = this.clickPoint) {
    this.clearPreview();
    
    if (position2 === null) {
      return;
    }
    drawShape(type, position2, position, (x, y) =>
      this.plotPreview(new Vector2(x, y), color),
    );
  }
  select(position) {
    if (this.clickPoint === null) {
      this.clickPoint = position;
      this.selectionStart = null;
      this.selectionEnd = null;
      return;
    }
    this.selectionStart = new Vector2(
      Math.min(this.clickPoint.x, position.x),
      Math.min(this.clickPoint.y, position.y),
    );
    this.selectionEnd = new Vector2(
      Math.max(this.clickPoint.x, position.x),
      Math.max(this.clickPoint.y, position.y),
    );
    this.clickPoint = null;
  }
  previewSelect(position) {
    if (this.selectionStart === null && this.clickPoint === null) return;
    this.clearPreview();
    this.previewShape(
      "rectangle",
      this.selectionStart === null ? position : this.selectionStart,
      { r: 100, g: 100, b: 255, a: 128 },
      this.selectionEnd === null ? this.clickPoint : this.selectionEnd,
    );
  }
  copySelection() {
    console.log(this.selectionStart, this.selectionEnd);
    if (this.selectionStart && this.selectionEnd) {
      this.clipboard = this.state.getPixels(
        this.selectionStart,
        this.selectionEnd,
      );
      this.clipboardSize = new Vector2(
        this.selectionEnd.x - this.selectionStart.x + 1,
        this.selectionEnd.y - this.selectionStart.y + 1,
      );
      console.log(this.clipboardSize, this.clipboard);
    }
  }
  rotateClipboardClockwise() {
    if (this.selectionStart && this.selectionEnd) {
      this.newUndoLevel();
      const width = this.clipboardSize.x;
      const height = this.clipboardSize.y;
      const rotatedPixels = new Uint8ClampedArray(this.clipboard.length);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const newIndex = (x * height + (height - 1 - y)) * 4;
          const oldIndex = (y * width + x) * 4;
          rotatedPixels[newIndex] = this.clipboard[oldIndex];
          rotatedPixels[newIndex + 1] = this.clipboard[oldIndex + 1];
          rotatedPixels[newIndex + 2] = this.clipboard[oldIndex + 2];
          rotatedPixels[newIndex + 3] = this.clipboard[oldIndex + 3];
        }
      }
      this.clipboard = rotatedPixels;
    }
  }
  rotateClipboardCounterClockwise() {
    if (this.selectionStart && this.selectionEnd) {
      this.newUndoLevel();
      const width = this.clipboardSize.x;
      const height = this.clipboardSize.y;
      const rotatedPixels = new Uint8ClampedArray(this.clipboard.length);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const newIndex = ((width - 1 - x) * height + y) * 4;
          const oldIndex = (y * width + x) * 4;
          rotatedPixels[newIndex] = this.clipboard[oldIndex];
          rotatedPixels[newIndex + 1] = this.clipboard[oldIndex + 1];
          rotatedPixels[newIndex + 2] = this.clipboard[oldIndex + 2];
          rotatedPixels[newIndex + 3] = this.clipboard[oldIndex + 3];
        }
      }
      this.clipboard = rotatedPixels;
    }
  }
  flipClipboardHorizontal() {
    if (this.selectionStart && this.selectionEnd) {
      this.newUndoLevel();
      const width = this.clipboardSize.x;
      const height = this.clipboardSize.y;
      const flippedPixels = new Uint8ClampedArray(this.clipboard.length);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const newIndex = (x * height + (height - 1 - y)) * 4;
          const oldIndex = (y * width + x) * 4;
          flippedPixels[newIndex] = this.clipboard[oldIndex];
          flippedPixels[newIndex + 1] = this.clipboard[oldIndex + 1];
          flippedPixels[newIndex + 2] = this.clipboard[oldIndex + 2];
          flippedPixels[newIndex + 3] = this.clipboard[oldIndex + 3];
        }
      }
      this.clipboard = flippedPixels;
    }
  }
  flipClipboardVertical() {
    if (this.selectionStart && this.selectionEnd) {
      this.newUndoLevel();
      const width = this.clipboardSize.x;
      const height = this.clipboardSize.y;
      const flippedPixels = new Uint8ClampedArray(this.clipboard.length);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const newIndex = ((width - 1 - x) * height + y) * 4;
          const oldIndex = (y * width + x) * 4;
          flippedPixels[newIndex] = this.clipboard[oldIndex];
          flippedPixels[newIndex + 1] = this.clipboard[oldIndex + 1];
          flippedPixels[newIndex + 2] = this.clipboard[oldIndex + 2];
          flippedPixels[newIndex + 3] = this.clipboard[oldIndex + 3];
        }
      }
      this.clipboard = flippedPixels;
    }
  }
  pasteClipboard(position) {
    if (this.clipboard && this.clipboardSize) {
      this.newUndoLevel();
      this.state.plotPixels(position, this.clipboard, this.clipboardSize);
    }
  }
  previewClipboard(position) {
    this.clearPreview();
    if (this.clipboard && this.clipboardSize) {
      for (let y = 0; y < this.clipboardSize.y; y++) {
        for (let x = 0; x < this.clipboardSize.x; x++) {
          const index = (y * this.clipboardSize.x + x) * 4;
          const color = {
            r: this.clipboard[index],
            g: this.clipboard[index + 1],
            b: this.clipboard[index + 2],
            a: this.clipboard[index + 3],
          };
          this.plotPreview(new Vector2(position.x + x, position.y + y), color);
        }
      }
    }
  }
  floodFill(position, targetColor, replacementColor) {
    if (this.colorEqualsColor(targetColor, replacementColor)) return;
    this.newUndoLevel();
    const directions = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ];
    let queue = [position];
    let visited = new Set();
    while (queue.length > 0) {
      const [currentX, currentY] = queue.shift().toArray();
      this.plot(new Vector2(currentX, currentY), replacementColor);
      visited.add(`${currentX}-${currentY}`);
      for (const [dx, dy] of directions) {
        const newX = currentX + dx;
        const newY = currentY + dy;
        if (
          newX >= 0 &&
          newX < this.size.x &&
          newY >= 0 &&
          newY < this.size.y &&
          this.colorEqualsColor(
            this.state.getPixel(new Vector2(newX, newY)),
            targetColor,
          ) &&
          visited.has(`${newX}-${newY}`) === false
        ) {
          visited.add(`${newX}-${newY}`);
          queue.push(new Vector2(newX, newY));
        }
      }
    }
  }
  colorEqualsColor(color1, color2) {
    return (
      color1[0] === color2[0] &&
      color1[1] === color2[1] &&
      color1[2] === color2[2] &&
      color1[3] === color2[3]
    );
  }
  PaintAll(targetColor, replacementColor) {
    if (this.colorEqualsColor(targetColor, replacementColor)) return;
    this.newUndoLevel();
    for (let y = 0; y < this.size.y; y++) {
      for (let x = 0; x < this.size.x; x++) {
        if (
          this.colorEqualsColor(
            this.state.getPixel(new Vector2(x, y)),
            targetColor,
          )
        ) {
          this.plot(new Vector2(x, y), replacementColor);
        }
      }
    }
  }
  undo() {
    const lastAction = this.state.stacks.undo(
      this.state.currentFrameIndex,
      this.state.currentLayerIndex,
    );
    if (lastAction) {
      console.log("lastAction:", lastAction);
      this.newRedoLevel();
      for (const { color, position } of lastAction) {
        this.state.undoPixel(
          position,
          color,
          this.state.currentFrameIndex,
          this.state.currentLayerIndex,
        );
      }
    }
  }
  redo() {
    const nextAction = this.state.stacks.redo(
      this.state.currentFrameIndex,
      this.state.currentLayerIndex,
    );
    if (nextAction) {
      console.log("nextAction:", nextAction);
      this.newUndoLevel();
      for (const { color, position } of nextAction) {
        this.state.plotPixel(
          position,
          color,
          this.state.currentFrameIndex,
          this.state.currentLayerIndex,
        );
      }
    }
  }
  newUndoLevel() {
    this.state.stacks.newUndoLevel(
      this.state.currentFrameIndex,
      this.state.currentLayerIndex,
    );
  }
  newRedoLevel() {
    this.state.stacks.newRedoLevel(
      this.state.currentFrameIndex,
      this.state.currentLayerIndex,
    );
  }
  copy() {
    // Create a new PixelEditer instance that references the same State and Stacks objects
    // This is efficient because we're not copying pixel data, only creating a new wrapper
    return new PixelEditor(
      this.size,
      this.state,
      this.clickPoint,
      this.preview,
      this.selectionStart,
      this.selectionEnd,
      this.clipboard,
      this.clipboardSize,
    );
  }
}
export default PixelEditor;
