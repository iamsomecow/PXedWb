
import { SpriteMap } from "./utility.js";
const s = new SpriteMap({x:2, y:2}, 2)

const N = new Uint8ClampedArray([54, 28, 12, 13, 78, 19, 23, 43, 108, 213, 123, 54, 89, 15, 115, 155]);
s.add(N);
s.add(N);
s.add(N);
s.add(N);
s.add(N);
console.log(s.generate());
const a = new OffscreenCanvas(100, 100);
a.getContext("2d")
