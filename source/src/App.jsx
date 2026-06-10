import { useState, useEffect, useRef } from "react";
import "./App.css";
import { PixelEditor } from "./pixel";
import { Vector2, hexToRgba, rgbaToHex } from "./utility";
import {
  exportImage,
  importImage,
  exportMp4,
  exportSpriteMap,
  generateSpriteMap,
} from "./fileManagement";
import { UseColorPalette, Palette, PaletteManager } from "./ColorPalette";
import { Tool, Select, Box } from "./ui";
function App() {
  const [isMobile, SetIsMobile] = useState(
    document.documentElement.clientWidth <
      document.documentElement.clientHeight,
  );
  useEffect(() => {
    const handleResize = () => {
      SetIsMobile(
        document.documentElement.clientWidth <
          document.documentElement.clientHeight,
      );
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const { palette, setPalette, selectedIndex, setSelectedIndex } =
    UseColorPalette();
  Coloris({
    onChange: (color, inputEl) => {
      updateColor(color);
    },
    defaultColor: "#ff0000",
  });
  function updateColor(Color) {
    setColor(hexToRgba(Color));
  }

  // todo - move color palette management to a separate component and file, also add ability to save/load multiple palettes and share palettes via url or file
  function openColorPaletteEditor() {
    document.getElementById("colorPaletteEditor").style.display = "flex";
  }
  const [fps, setFps] = useState(1);
  const [shapeType, setShapeType] = useState("line");
  const [isSaved, setIsSaved] = useState(false);
  const [fileName, setFileName] = useState("");
  const [scale, setScale] = useState(1);
  const [fileFormat, setFileFormat] = useState("png");
  const [isSpriteMap, setIsSpriteMap] = useState(false);
  const [spriteMapWidth, setSpriteMapWidth] = useState(3);

  async function saveFile(format) {
    if (format === "png" || format === "jpeg") {
      if (!isSpriteMap) {
        await exportImage(
          pixels.state.state[pixels.state.currentFrameIndex],
          pixels.size,
          scale,
          fileName,
          format,
        );
      } else {
        await exportSpriteMap(
          pixels.state.state,
          pixels.size,
          scale,
          fileName,
          format,
          spriteMapWidth,
        );
      }
    }
    if (format === "mp4") {
      await exportMp4(fps, sizeX, sizeY, pixels.state.state, scale);
    }
    setIsSaved(true);
  }

  function loadFile(file) {
    if (!isSaved) {
      if (!window.confirm("Unsaved work will be lost. Continue?")) {
        return;
      }
    }
    console.log(file, file.width);
    // Implementation for loading a file
    const canvas = offscreenCanvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = file.width;
    canvas.width = file.height;
    ctx.drawImage(file, 0, 0);
    pixels.setState(
      new Vector2(file.width, file.height),
      ctx.getImageData(0, 0, file.width, file.height).data,
    );
    setPixels(pixels);
    setSizeX(file.width);
    setSizeY(file.height);
  }
  const checkerboardCanvasRef = useRef(null);
  const drawingCanvasRef = useRef(null);
  const offscreenCanvasRef = useRef(null);
  const previewOffscreenCanvasRef = useRef(null);
  const [sizeX, setSizeX] = useState(null);
  const [sizeY, setSizeY] = useState(null);
  const [isGridInitialized, setIsGridInitialized] = useState(false);
  const [tempSizeX, setTempSizeX] = useState(32);
  const [tempSizeY, setTempSizeY] = useState(32);
  const [color, setColor] = useState({ r: 255, g: 0, b: 0, a: 255 });
  const [mode, setMode] = useState("pen");
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [paintedDuringDrag, setPaintedDuringDrag] = useState(new Set());
  const [pixels, setPixels] = useState(new PixelEditor(new Vector2(0, 0)));
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isRightMouseDown, setIsRightMouseDown] = useState(false);
  const [rightClickStartPos, setRightClickStartPos] = useState({ x: 0, y: 0 });
  const [isTwoFingerPan, setIsTwoFingerPan] = useState(false);
  const [twoFingerStartPos, setTwoFingerStartPos] = useState({ x: 0, y: 0 });
  // animation
  useEffect(() => {
    if (!isGridInitialized || mode !== "animation") return;
    const interval = setInterval(() => {
      pixels.state.loopFrame();
      setPixels(pixels.copy());
    }, 1000 / fps);
    return () => clearInterval(interval);
  }, [pixels, isGridInitialized, fps, mode]);
  // Draw checkerboard to background canvas (once)
  useEffect(() => {
    if (!checkerboardCanvasRef.current || !isGridInitialized) return;

    DrawBackground();
  }, [sizeX, sizeY, isGridInitialized]);
  function DrawBackground() {
    const canvas = checkerboardCanvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.clientWidth * canvasZoom;
    canvas.height = canvas.clientHeight * canvasZoom;

    const pixelWidth = canvas.width / sizeX;
    const pixelHeight = canvas.height / sizeY;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw checkerboard pattern
    for (let y = 0; y < sizeY; y++) {
      for (let x = 0; x < sizeX; x++) {
        const isLight = (x + y) % 2 === 0;
        ctx.fillStyle = isLight ? "#e0e0e0" : "#989898";
        ctx.fillRect(x * pixelWidth, y * pixelHeight, pixelWidth, pixelHeight);
      }
    }
  }
  // Draw pixels to offscreen canvas using putImageData
  useEffect(() => {
    if (
      !offscreenCanvasRef.current ||
      !previewOffscreenCanvasRef.current ||
      !isGridInitialized
    )
      return;

    const canvas = offscreenCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const previewCanvas = previewOffscreenCanvasRef.current;
    const previewCtx = previewCanvas.getContext("2d");
    const previewImageData = new ImageData(pixels.preview, sizeX, sizeY);
    const layers = pixels.state.getShownLayers();

    ctx.clearRect(0, 0, sizeX, sizeY);
    for (let layer of layers) {
      const imageData = new ImageData(layer, sizeX, sizeY);
      const tempCanvas = new OffscreenCanvas(sizeX, sizeY);
      const tempCtx = tempCanvas.getContext("2d");
      tempCtx.putImageData(imageData, 0, 0);
      ctx.drawImage(tempCanvas, 0, 0);
    }
    previewCtx.putImageData(previewImageData, 0, 0);
  }, [pixels, sizeX, sizeY, isGridInitialized]);

  // Draw offscreen canvas to display canvas using drawImage (scales automatically)
  useEffect(() => {
    if (
      !drawingCanvasRef.current ||
      !offscreenCanvasRef.current ||
      !previewOffscreenCanvasRef.current ||
      !isGridInitialized
    )
      return;

    const canvas = drawingCanvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.clientWidth * canvasZoom;
    canvas.height = canvas.clientHeight * canvasZoom;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      offscreenCanvasRef.current,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    ctx.drawImage(
      previewOffscreenCanvasRef.current,
      0,
      0,
      canvas.width,
      canvas.height,
    );
  }, [pixels, sizeX, sizeY, isGridInitialized, canvasZoom]);

  // Create offscreen canvases after grid initialization
  useEffect(() => {
    if (!isGridInitialized) return;

    offscreenCanvasRef.current = new OffscreenCanvas(sizeX, sizeY);
    previewOffscreenCanvasRef.current = new OffscreenCanvas(sizeX, sizeY);
  }, [isGridInitialized, sizeX, sizeY]);
  function generatePreview(x, y) {
    pixels.clearPreview();
    switch (mode) {
      case "shape":
        pixels.previewShape(shapeType, new Vector2(x, y), color);
        break;
      case "pen":
        pixels.plotPreview(new Vector2(x, y), color);
        break;
      case "eraser":
        pixels.plotPreview(new Vector2(x, y), { r: 0, g: 0, b: 0, a: 0 });
        break;
      case "select":
        pixels.previewSelect(new Vector2(x, y));
        break;
      case "paste":
        pixels.previewClipboard(new Vector2(x, y));
        break;
      default:
        break;
    }

    setPixels(pixels.copy());
  }
  function handlePixelMouseEnter(x, y, forceDrawing = null) {
    const shouldDraw = forceDrawing !== null ? forceDrawing : isMouseDown;
    if (!shouldDraw) {
      generatePreview(x, y);
      return;
    }
    if (mode !== "pen" && mode !== "eraser") return;
    const pixelKey = `${x}-${y}`;
    if (paintedDuringDrag.has(pixelKey)) return;
    const newColor = mode === "eraser" ? { r: 0, g: 0, b: 0, a: 0 } : color;
    pixels.plot(new Vector2(x, y), newColor);
    setPixels(pixels.copy());

    setPaintedDuringDrag(new Set(paintedDuringDrag).add(pixelKey));
  }

  function handleCanvasMouseMove(e) {
    // Handle right-click panning
    if (isRightMouseDown) {
      const deltaX = e.clientX - rightClickStartPos.x;
      const deltaY = e.clientY - rightClickStartPos.y;
      setCanvasOffset({
        x: canvasOffset.x + deltaX,
        y: canvasOffset.y + deltaY,
      });
      setRightClickStartPos({ x: e.clientX, y: e.clientY });
      return;
    }

    if (!drawingCanvasRef.current) return;
    const canvas = drawingCanvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Convert display coordinates to grid coordinates
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * sizeX);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * sizeY);

    if (x >= 0 && x < sizeX && y >= 0 && y < sizeY) {
      handlePixelMouseEnter(x, y);
    }
  }

  function handleCanvasClick(e) {
    if (e.button !== 0) return; // Only respond to left-click
    if (!drawingCanvasRef.current) return;
    const canvas = drawingCanvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Convert display coordinates to grid coordinates
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * sizeX);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * sizeY);

    if (x >= 0 && x < sizeX && y >= 0 && y < sizeY) {
      onPixelClick(x, y);
    }
  }
  function handleMouseDown(e) {
    if (e.button === 2) {
      // Right-click: start panning
      setIsRightMouseDown(true);
      setRightClickStartPos({ x: e.clientX, y: e.clientY });
      return;
    }
    if (e.button !== 0) return; // Only respond to left-click
    setIsMouseDown(true);
    setPaintedDuringDrag(new Set());
    if (mode === "pen" || mode === "eraser") pixels.newUndoLevel();
    setPixels(pixels);
    handleCanvasMouseMove(e);
  }
  function handleMouseUp(e) {
    // Skip if this is a touch event - handleTouchEnd will handle it
    if (e.nativeEvent.sourceCapabilities.firesTouchEvents) return;
    handleCanvasClick(e);
    setIsMouseDown(false);
    setIsRightMouseDown(false);
    setPaintedDuringDrag(new Set());
  }
  function handleMouseLeave() {
    setIsMouseDown(false);
    setIsRightMouseDown(false);
    setPaintedDuringDrag(new Set());

    if (mode !== "select") pixels.clearPreview();
    pixels.clickPoint = null;

    setPixels(pixels.copy());
  }
  function onPixelClick(x, y) {
    switch (mode) {
      case "pen":
        break;
      case "eraser":
        break;
      case "color picker":
        const pickedColor = pixels.state.getPixel(new Vector2(x, y));
        setColor({
          r: pickedColor[0],
          g: pickedColor[1],
          b: pickedColor[2],
          a: pickedColor[3],
        });
        break;
      case "fill":
        pixels.floodFill(
          new Vector2(x, y),
          pixels.state.getPixel(new Vector2(x, y)),
          color,
        );
        setPixels(pixels.copy());

        break;
      case "paint all":
        pixels.PaintAll(pixels.state.getPixel(new Vector2(x, y)), color);
        setPixels(pixels.copy());
        break;
      case "shape":
        pixels.plotShape(shapeType, new Vector2(x, y), color);
        setPixels(pixels.copy());
        break;
      case "select":
        pixels.select(new Vector2(x, y));
        setPixels(pixels.copy());
        break;
      case "paste":
        pixels.pasteClipboard(new Vector2(x, y));
        setPixels(pixels.copy());
        break;
      default:
        break;
    }
  }

  function initializeGrid() {
    setSizeX(tempSizeX);
    setSizeY(tempSizeY);
    setPixels(new PixelEditor(new Vector2(tempSizeX, tempSizeY)));
    setIsGridInitialized(true);
    window.addEventListener(
      "wheel",
      (event) => {
        if (event.ctrlKey) event.preventDefault();
      },
      { passive: false },
    );
  }
  useEffect(() => {
    const handler = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl) {
        if (e.key === "z") {
          e.preventDefault();
          pixels.undo();
          setPixels(pixels.copy());
        }

        if (e.key === "y" || (e.shiftKey && e.key === "Z")) {
          e.preventDefault();
          pixels.redo();
          setPixels(pixels.copy());
        }

        if (e.key === "c") {
          e.preventDefault();
          pixels.copySelection();
          setPixels(pixels.copy());
        }
        if (e.key === "v") {
          e.preventDefault();
          setMode("paste");
        }
      } else {
        if (e.key === "ArrowRight") {
          pixels.state.incrementFrame(1);
          setPixels(pixels.copy());
        }
        if (e.key === "ArrowLeft") {
          pixels.state.incrementFrame(-1);
          setPixels(pixels.copy());
        }
        if (e.key === "ArrowUp") {
          pixels.state.incrementLayer(1);
          setPixels(pixels.copy());
        }
        if (e.key === "ArrowDown") {
          pixels.state.incrementLayer(-1);
          setPixels(pixels.copy());
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pixels]);

  function handleCanvasWheel(e) {
    // Scroll down = zoom in (positive deltaY), scroll up = zoom out (negative deltaY)
    const zoomSpeed = 0.05;
    const newZoom =
      e.deltaY > 0
        ? canvasZoom + zoomSpeed
        : Math.max(0.1, canvasZoom - zoomSpeed);
    setCanvasZoom(newZoom);
  }
  useEffect(() => {
    if (checkerboardCanvasRef.current) {
      DrawBackground();
    }
  }, [canvasZoom]);

  function handleTouchStart(e) {
    if (e.touches.length === 2) {
      // Two-finger touch for panning
      if (e.cancelable) e.preventDefault();
      setIsTwoFingerPan(true);
      setIsMouseDown(false);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const midX = (touch1.clientX + touch2.clientX) / 2;
      const midY = (touch1.clientY + touch2.clientY) / 2;
      setTwoFingerStartPos({ x: midX, y: midY });
    } else if (e.touches.length === 1) {
      // Single touch for drawing
      if (e.cancelable) e.preventDefault();
      setIsMouseDown(true);
      setPaintedDuringDrag(new Set());
      if (mode === "pen" || mode === "eraser") pixels.newUndoLevel();

      const touch = e.touches[0];
      if (!drawingCanvasRef.current) return;
      const canvas = drawingCanvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(((touch.clientX - rect.left) / rect.width) * sizeX);
      const y = Math.floor(((touch.clientY - rect.top) / rect.height) * sizeY);

      if (x >= 0 && x < sizeX && y >= 0 && y < sizeY) {
        if (mode === "pen" || mode === "eraser") {
          handlePixelMouseEnter(x, y, true);
        }
        else {
          generatePreview(x, y);
        }
      }
    }
  }

  function handleTouchMove(e) {
    if (isTwoFingerPan && e.touches.length === 2) {
      // Two-finger pan
      if (e.cancelable) e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const midX = (touch1.clientX + touch2.clientX) / 2;
      const midY = (touch1.clientY + touch2.clientY) / 2;

      const deltaX = midX - twoFingerStartPos.x;
      const deltaY = midY - twoFingerStartPos.y;

      setCanvasOffset({
        x: canvasOffset.x + deltaX,
        y: canvasOffset.y + deltaY,
      });
      setTwoFingerStartPos({ x: midX, y: midY });
    } else if (isMouseDown && e.touches.length === 1) {
      // Single touch for drawing
      if (e.cancelable) e.preventDefault();

      const touch = e.touches[0];
      if (!drawingCanvasRef.current) return;
      const canvas = drawingCanvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(((touch.clientX - rect.left) / rect.width) * sizeX);
      const y = Math.floor(((touch.clientY - rect.top) / rect.height) * sizeY);

      if (x >= 0 && x < sizeX && y >= 0 && y < sizeY) {
        if (mode === "pen" || mode === "eraser") {
          handlePixelMouseEnter(x, y, true); 
        }
        else {
          generatePreview(x, y);
        }
      }
    }
  }

  function handleTouchEnd(e) {
    // Don't call preventDefault on touchend - it's often not cancelable
    if (e.touches.length < 2) {
      setIsTwoFingerPan(false);
    }
    console.log(e);
    const touch = e.changedTouches[0];
    if (!drawingCanvasRef.current) return;
    const canvas = drawingCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((touch.clientX - rect.left) / rect.width) * sizeX);
    const y = Math.floor(((touch.clientY - rect.top) / rect.height) * sizeY);
    console.log(x, y);
    if (x >= 0 && x < sizeX && y >= 0 && y < sizeY) {
      onPixelClick(x, y);
    }
    setIsMouseDown(false);
    setIsRightMouseDown(false);
    setPaintedDuringDrag(new Set());
  }

  const [temp, setTemp] = useState("...");
  if (!isGridInitialized) {
    return (
      <div className="w-[100vw] h-[100vh] flex flex-col items-center  ">
        <div className="h-[6vh] mt-[1vh] ">
          <div className=" w-[80vw] h-full  flex items-center gap-2 px-4 bg-gray-900 border border-gray-600 rounded-[4px]  z-20">
            <img
              src="./src/assets/icon.png"
              className="size-[5vh] inline-block align-middle  bg-gray-900"
            ></img>
            <b>PXedWb - web pixel art editor</b>
          </div>
        </div>
        <div className="mt-[10vh] w-[60vw] h-[60vh] border border-gray-600 rounded-[4px] flex flex-col items-center justify-center gap-10 bg-gray-900">
          <div className="border border-gray-600 rounded-[4px]">
            <div className="m-6">
              {" "}
              width:{" "}
              <input
                type="number"
                className="border border-gray-600 rounded-[4px]"
                value={tempSizeX}
                onChange={(e) =>
                  setTempSizeX(Math.max(1, parseInt(e.target.value) || 1))
                }
              ></input>
            </div>
            <div className="m-6">
              height:{" "}
              <input
                type="number"
                className="border border-gray-600 rounded-[4px]"
                value={tempSizeY}
                onChange={(e) =>
                  setTempSizeY(Math.max(1, parseInt(e.target.value) || 1))
                }
              ></input>
            </div>
          </div>
          <div>
            <button
              className="border border-gray-600 rounded-[4px] px-6"
              onClick={initializeGrid}
            >
              create new
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <input
        id="file"
        type="file"
        accept="image/*"
        style={{ display: "none" }}
      ></input>
      <div
        className={
          "w-screen h-screen overflow-hidden " +
          (isMobile ? "justify-items-center" : "")
        }
      >
        <PaletteManager
          color={color}
          palette={palette}
          selectedIndex={selectedIndex}
          setSelectedIndex={setSelectedIndex}
          setPalette={setPalette}
        />
        <div className="w-screen h-[7vh] flex place-content-center overflow-hidden">
          <div className="h-[6vh] mt-[1vh] ">
            <div
              className={
                " w-[80vw] h-full  flex items-center gap-2 px-4 bg-gray-900 border border-gray-600 rounded-[4px] z-30 relative"
              }
            >
              <img
                src="./src/assets/icon.png"
                className="size-[5vh] inline-block align-middle  bg-gray-900"
              ></img>
              <b>PXedWb - web pixel art editor</b>
            </div>
          </div>
        </div>
        <div className="w-screen h-[2vh]"></div>
        <div
          className={
            "h-[80vh] flex " +
            (isMobile
              ? "flex-col w-[80vw] justify-items-center"
              : "flex-row w-screen")
          }
        >
          <div
            className={
              " flex ml-[1vw] z-20 " +
              (isMobile
                ? "flex-row w-[80vw] h-[9vh]"
                : "flex-col w-[9vw] h-[80vh]")
            }
          >
            <div
              className={
                "bg-gray-900 border border-gray-600 w-[9vw] h-[9vh] " +
                (isMobile ? "rounded-l-[4px]" : "rounded-t-[4px]")
              }
              onClick={() => openColorPaletteEditor()}
            >
              <b className="mt-3"> Edit </b>
            </div>
            <div
              className={
                "grid overflow-hidden border border-gray-600 " +
                (isMobile
                  ? "w-[70vw] h-[9vh] grid-rows-4 grid-flow-col rounded-r-[4px]"
                  : "w-[9vw] h-[70vh] grid-cols-4 rounded-b-[4px]")
              }
            >
              <Palette
                setColor={setColor}
                palette={palette}
                setSelectedIndex={setSelectedIndex}
              />
            </div>
          </div>
          <div
            className={
              "w-[80vw] z-10 " +
              (isMobile ? "h-[60vh] flex items-center " : "h-[80vh]")
            }
            onWheel={handleCanvasWheel}
          >
            <div className="w-[80vw]">
              <div
                className="rounded-[4px] overflow-hidden border border-gray-600"
                style={{
                  margin: "auto",
                  maxWidth: "80vw",
                  maxHeight: isMobile ? "60vh" : "80vh",
                  position: "relative",
                  aspectRatio: `${sizeX} / ${sizeY}`,
                  transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasZoom})`,
                  transformOrigin: "center",
                  transition: "transform 0.05s ease-out",
                }}
              >
                <canvas
                  ref={checkerboardCanvasRef}
                  style={{
                    zIndex: -2,
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    display: "block",
                    imageRendering: "pixelated",
                  }}
                />
                <canvas
                  ref={drawingCanvasRef}
                  
                  onMouseMove={handleCanvasMouseMove}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{
                    zIndex: -1,
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    display: "block",
                    imageRendering: "pixelated",
                    cursor: mode === "color picker" ? "crosshair" : "default",
                  }}
                />
              </div>
            </div>
          </div>
          <div
            className={
              "text-sm z-20 overflow-visible flex " +
              (isMobile
                ? "w-[80vw] h-[10vh] flex-row"
                : "w-[9vw] h-[80vh] flex-col")
            }
          >
            <Box title="Tools" toggled={true}>
              <Tool
                imgSrc="./src/assets/pen.png"
                onClick={() => setMode("pen")}
                color={mode === "pen" ? "#454545" : undefined}
              ></Tool>
              <Tool
                imgSrc="./src/assets/eraser.png"
                onClick={() => setMode("eraser")}
                color={mode === "eraser" ? "#999999" : undefined}
              ></Tool>
              <Tool
                imgSrc="./src/assets/fill.png"
                onClick={() => setMode("fill")}
                color={mode === "fill" ? "#999999" : undefined}
              ></Tool>
              <Tool
                imgSrc="./src/assets/fill_all.png"
                onClick={() => setMode("paint all")}
                color={mode === "paint all" ? "#999999" : undefined}
              ></Tool>
              <Tool
                imgSrc="./src/assets/shape.png"
                onClick={() => setMode("shape")}
                color={mode === "shape" ? "#999999" : undefined}
              ></Tool>
              <Select onChange={(e) => setShapeType(e)}></Select>
              <div className={isMobile ? "contents" : ""}>
                <Tool
                  imgSrc="./src/assets/select.png"
                  onClick={() => setMode("select")}
                  color={mode === "select" ? "#999999" : undefined}
                ></Tool>
                <Tool
                  imgSrc="./src/assets/copy.png"
                  onClick={() => {
                    pixels.copySelection();
                    setPixels(pixels.copy());
                  }}
                ></Tool>
                <Tool
                  imgSrc="./src/assets/paste.png"
                  onClick={() => setMode("paste")}
                  color={mode === "paste" ? "#999999" : undefined}
                ></Tool>
              </div>
              <div className={isMobile ? "contents" : ""}>
                <Tool
                  imgSrc="./src/assets/flip_horizontal.png"
                  onClick={() => {
                    pixels.flipClipboardHorizontal();
                    setPixels(pixels.copy());
                  }}
                ></Tool>
                <Tool
                  imgSrc="./src/assets/flip_horizontal.png"
                  onClick={() => {
                    pixels.flipClipboardVertical();
                    setPixels(pixels.copy());
                  }}
                ></Tool>
                <Tool
                  imgSrc="./src/assets/flip_horizontal.png"
                  onClick={() => {
                    pixels.rotateClipboardClockwise();
                    setPixels(pixels.copy());
                  }}
                ></Tool>
                <Tool
                  imgSrc="./src/assets/flip_horizontal.png"
                  onClick={() => {
                    pixels.rotateClipboardCounterClockwise();
                    setPixels(pixels.copy());
                  }}
                ></Tool>
              </div>
              {rgbaToHex(color)}
              <div className={isMobile ? "contents" : ""}>
                <Tool
                  imgSrc="./src/assets/color_picker.png"
                  onClick={() => setMode("color picker")}
                  color={mode === "color picker" ? "#999999" : undefined}
                ></Tool>

                <input
                  style={{
                    backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
                    color: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
                    verticalAlign: "top",
                    padding: "",
                    display: "inline-block",
                  }}
                  className="size-[5vh] border border-gray-600 rounded-[4px] mx-0.5 my-0.5 "
                  id="color"
                  type="text"
                  data-coloris={false}
                  onChange={(e) => updateColor(e.target.value)}
                ></input>
              </div>
              <div className={isMobile ? "contents" : ""}>
                <Tool
                  imgSrc="./src/assets/undo.png"
                  onClick={() => {
                    pixels.undo();
                    setPixels(pixels.copy());
                  }}
                ></Tool>
                <Tool
                  imgSrc="./src/assets/redo.png"
                  onClick={() => {
                    pixels.redo();
                    setPixels(pixels.copy());
                  }}
                ></Tool>
              </div>
            </Box>
            <div
              className={isMobile ? "contents" : "flex-col flex max-h-[75vh]"}
            >
              <Box title="Animate" toggled={false}>
                <div className={isMobile ? "contents" : ""}>
                  <b>Current frame:</b> {pixels.state.currentFrameIndex + 1}
                </div>
                <div className={isMobile ? "contents" : ""}>
                  <b>Fps: </b>
                  <input
                    className="border border-gray-600 rounded-[4px] w-[8vh]"
                    type="number"
                    value={fps}
                    onChange={(e) => {
                      setFps(Number(e.target.value));
                      console.log("fps:", Number(e.target.value));
                    }}
                  />
                </div>

                <button
                  className="border border-gray-600 rounded-[4px] size-[5vh] my-2 mx-0.5"
                  onClick={() => {
                    pixels.state.incrementFrame(-1);
                    setPixels(pixels.copy());
                  }}
                >
                  ⏮
                </button>
                <button
                  className="border border-gray-600 rounded-[4px] size-[5vh] my-2 mx-0.5"
                  onClick={() =>
                    setMode(mode === "animation" ? "pen" : "animation")
                  }
                >
                  {mode === "animation" ? " ⏸ " : " ▶ "}
                </button>
                <button
                  className="border border-gray-600 rounded-[4px] size-[5vh] my-2 mx-0.5"
                  onClick={() => {
                    pixels.state.incrementFrame();
                    setPixels(pixels.copy());
                  }}
                >
                  ⏭
                </button>
                <button
                  className="border border-gray-600 rounded-[4px]"
                  onClick={() => {
                    pixels.state.duplicateFrame();
                    setPixels(pixels.copy());
                  }}
                >
                  Duplicate Current Frame
                </button>
              </Box>
              <div
                className={isMobile ? "contents" : "flex-col flex max-h-[70vh]"}
              >
                <Box title="Layers" toggled={false}>
                  current layer: {pixels.state.currentLayerIndex + 1}
                  <button
                    className="border border-gray-600 rounded-[4px]"
                    onClick={() => {
                      pixels.state.incrementLayer();
                      setPixels(pixels.copy());
                    }}
                  >
                    next layer
                  </button>
                  <button
                    className="border border-gray-600 rounded-[4px]"
                    onClick={() => {
                      pixels.state.incrementLayer(-1);
                      setPixels(pixels.copy());
                    }}
                  >
                    previous layer
                  </button>
                </Box>
                <div className={isMobile ? "contents" : ""}>
                  <Box title="File" toggled={false}>
                    Export:
                    <div className={isMobile ? "contents" : ""}>
                      <div className={isMobile ? "contents" : ""}>
                        scale factor:
                        <input
                          className="border border-gray-600 rounded-[4px] w-[8vh]"
                          type="number"
                          value={scale}
                          onChange={(e) => {
                            setScale(Number(e.target.value));
                          }}
                        />
                        <a
                          onClick={() =>
                            alert(
                              "some media viewers use filtering that could make your pixel art blurry",
                            )
                          }
                        >
                          🛈
                        </a>
                      </div>
                      <div className={isMobile ? "contents" : ""}>
                        Sprite map
                      </div>
                      <div className={isMobile ? "contents" : ""}> mode </div>
                      <div className={isMobile ? "contents" : ""}>
                        <input
                          type="checkbox"
                          onChange={() => setIsSpriteMap(!isSpriteMap)}
                        ></input>
                      </div>
                      {!isSpriteMap ? (
                        ""
                      ) : (
                        <>
                          <div className={isMobile ? "contents" : ""}>
                            Sprite map
                          </div>
                          <div className={isMobile ? "contents" : ""}>
                            {" "}
                            width{" "}
                          </div>
                          <div className={isMobile ? "contents" : ""}>
                            <input
                              type="number"
                              className="border border-gray-600 rounded-[4px] w-[8vh]"
                              value={spriteMapWidth}
                              onChange={(e) =>
                                setSpriteMapWidth(
                                  Number.parseInt(e.target.value),
                                )
                              }
                            ></input>
                          </div>
                        </>
                      )}
                      <label htmlFor="file-format">format: </label>
                      <select
                        className="border border-gray-600 rounded-[4px] my-1"
                        id="file-format"
                        onChange={(e) => setFileFormat(e.target.value)}
                      >
                        <option value="png">PNG</option>
                        <option value="jpeg">JPEG</option>
                        <option value="mp4">MP4</option>
                      </select>
                    </div>
                    <button
                      className="border border-gray-600 rounded-[4px]"
                      onClick={() => saveFile(fileFormat)}
                    >
                      Save
                    </button>
                    <div className={isMobile ? "contents" : ""}>import:</div>
                    <button
                      className="border border-gray-600 rounded-[4px] my-1"
                      onClick={() => importImage(loadFile)}
                    >
                      Load
                    </button>
                  </Box>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
