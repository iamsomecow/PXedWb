import { useEffect, useState } from "react";
import defaultPalette from "./defaultPalette.json";
// Custom hook for managing color palette
export function UseColorPalette() {
  const [palette, setPalette] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    const paletteData = localStorage.getItem("colorPalette");
    if (paletteData) {
      setPalette(JSON.parse(paletteData));
    } else {
      setPalette(defaultPalette);
    }
  }, []);

  // Save to localStorage whenever palette changes
  useEffect(() => {
    if (palette.length > 0) {
      localStorage.setItem("colorPalette", JSON.stringify(palette));
    }
  }, [palette]);

  return {
    palette,
    setPalette,
    selectedIndex,
    setSelectedIndex,
  };
}

// instance typeOf ColorPalette
export function Palette({ setColor, palette, setSelectedIndex }) {
  return palette.map((color, index) => (
    <Color
      key={index}
      color={color}
      index={index}
      setColor={setColor}
      setSelectedIndex={setSelectedIndex}
    />
  ));
}

function Color({ color, index, setColor, setSelectedIndex }) {
  return (
    <div
      className=""
      style={{
        backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
      }}
      onClick={() => {
        setColor(color);
        setSelectedIndex(index);
      }}
    ></div>
  );
}

export function PaletteManager({
  color,
  palette,
  selectedIndex,
  setSelectedIndex,
  setPalette,
}) {
  return (
    <div
      id="colorPaletteEditor"
      className="w-[60vw] h-[60vh] z-[20] top-[20vh] left-[20vw] bg-gray-900 hidden border border-gray-600 rounded-[4px] absolute flex flex-col justify-center items-center"
    >
      <b>Color Palette Editor</b>
      <p className="mt-5">selected color</p>
      <div
        className="w-[10vw] h-[10vh] border border-gray-600 rounded-[4px] mt-2"
        style={{
          backgroundColor:
            selectedIndex !== null
              ? `rgba(${palette[selectedIndex].r}, ${palette[selectedIndex].g}, ${palette[selectedIndex].b}, ${palette[selectedIndex].a})`
              : "transparent",
        }}
      ></div>

      <button
        className="border border-gray-600 rounded-[4px]  mt-2 px-2"
        onClick={() => setPalette([...palette, color])}
      >
      Add Current Color
      </button>
      
      <button
        className="border border-gray-600 rounded-[4px] mt-2 px-2"
        onClick={() => {
          if (selectedIndex !== null) {
            setPalette(palette.filter((_, i) => i !== selectedIndex));
            setSelectedIndex(null);
          }
        }}
      >
        Remove Selected Color
      </button>
      <button
        className="border border-gray-600 rounded-[4px] mt-2 px-2"
        onClick={() => {
          if (selectedIndex !== null) {
            const updated = [...palette];
            updated[selectedIndex] = color;
            setPalette(updated);
          }
        }}
      >
        Update Selected Color
      </button>
      <button
        className="border border-gray-600 rounded-[4px] mt-2 px-2"
        onClick={() => setPalette([])}
      >
        Clear Palette
      </button>
      <button
        className="border border-gray-600 rounded-[4px] mt-2 px-2"
        onClick={() =>
          (document.getElementById("colorPaletteEditor").style.display = "none")
        }
      >
        Close Editor
      </button>
    </div>
  );
}
