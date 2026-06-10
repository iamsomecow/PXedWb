import { CombineUintClampedArray, ScaleUintClampedArray, SpriteMap, Vector2 } from './utility';

function _exportImage(imageData, filename, format) {

  const link = document.createElement("a");
  link.href = URL.createObjectURL(imageData);
  if (filename) {
    link.download = `${filename}.${format}`; 
  } else {
    link.download = `pixel-art-${Date.now()}.${format}`;
  }
  link.click();
  URL.revokeObjectURL(link.href);
}
export async function exportImage(imageData, imageSize, scale, filename, format) {
  let out = CombineUintClampedArray(imageData, imageSize);
  if (scale !== 1) out = ScaleUintClampedArray(out, scale, imageSize);
  imageSize.scale(scale)
  await _exportImage(await imgToBlob(out, imageSize, format), filename, format);
}
export async function exportSpriteMap(imageData, imageSize, scale, filename, format, width) {
  await _exportImage(await imgToBlob(...generateSpriteMap(imageSize, imageData, width, scale), format), filename, format);
}
export function generateSpriteMap(spriteSize, sprites, width, scale) {
  const map = new SpriteMap(spriteSize, width)
  for(let i = 0; i < sprites.length; i++) {
    map.add(CombineUintClampedArray(sprites[i], spriteSize));
  }
  
  if (scale === 1) {
    return [map.generate(), map.outSize];
  } else {
    const temp = ScaleUintClampedArray(map.generate(), scale, map.outSize);
    map.outSize.scale(scale)
    return [temp, map.outSize];
  }
}
/**
 * coverts a Uint8ClampedArray
 * @param {Uint8ClampedArray} img 
 * @param {Vector2} size 
 * @param {string} format 
 * @returns {Blob}
 */
async function imgToBlob(img, size, format) {
  const imageData = new ImageData(img, size.x, size.y);
  const canvas = new OffscreenCanvas(size.x, size.y);
  canvas.getContext("2d").putImageData(imageData, 0, 0);
  return await canvas.convertToBlob({type: `image/${format}`})
}
export function importImage(callback) {
  const file = document.getElementById("file");
  file.addEventListener("change", async () => {
    const selected = file.files[0];
    if (!selected) return;
    console.log(selected);
    const img = await window.createImageBitmap(selected);
    console.log(img);
    callback(img);
  });
  file.click();
}
import {Output, Mp4OutputFormat, VideoSampleSource, VideoSample, BufferTarget } from 'mediabunny';

export async function exportMp4(fps, sizeX, sizeY, frames, scale) {
  //define output
  const output = new Output({
    format: new Mp4OutputFormat(),
    target: new BufferTarget()
  })
  //create video track
  const VideoSource = new VideoSampleSource({
    codec: "avc",
    bitrate: 5000000,
  });
  output.addVideoTrack(VideoSource);
  
  //allow the output to start accepting data
  await output.start();

  //create samples
  console.log(scale);
  for (let i = 0; i < frames.length; i++) {
    
    const temp = CombineUintClampedArray(frames[i], { x: sizeX, y: sizeY });
    const scaledTemp = scale === 1 ? temp : ScaleUintClampedArray(temp, scale, {x: sizeX})
    const imageData = new ImageData(scaledTemp, sizeX * scale, sizeY * scale);
    const frame = await createImageBitmap(imageData);
    const sample = new VideoSample(frame, { 
      timestamp: (i / fps), 
      duration: fps,
    });
    
    await VideoSource.add(sample);
    
    sample.close();
  }

  
  
  // Finalize the MP4 and get the blob
  await output.finalize();
  
  //download generated mp4
  const buffer = output.target.buffer;
  console.log(buffer);
  const blob = new Blob([output.target.buffer], { type: 'video/mp4' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'animation.mp4';
  a.click();
  URL.revokeObjectURL(url);
}
