import { useState } from "react";
export function Tool(perms) {
  return (
    <button
      className="size-[5vh] border border-gray-600 rounded-[4px] p-0 m-0.5 overflow-hidden"
      onClick={() => perms.onClick()}
      style={{
        backgroundColor: perms.color
          ? "oklch(27.8% 0.033 256.848)"
          : "oklch(21% 0.034 264.665)",
      }}
    >
      <img className="size-[5vh] p-0 m-0" src={perms.imgSrc}></img>
    </button>
  );
}
export function Select(perms) {
  const [selected, setSelected] = useState("./src/assets/line.png");
  const [toggled, setToggled] = useState(false);
  return (
    <>
      <Tool onClick={() => setToggled(!toggled)} imgSrc={selected}></Tool>

      {toggled === true ? (
        <>
          <Tool
            onClick={() => {
              setSelected("./src/assets/line.png");
              perms.onChange("line");
              setToggled(false);
            }}
            imgSrc="./src/assets/line.png"
          ></Tool>
          <Tool
            onClick={() => {
              setSelected("./src/assets/rectangle.png");
              perms.onChange("rectangle");
              setToggled(false);
            }}
            imgSrc="./src/assets/rectangle.png"
          ></Tool>
          <Tool
            onClick={() => {
              setSelected("./src/assets/triangle.png");
              perms.onChange("triangle");
              setToggled(false);
            }}
            imgSrc="./src/assets/triangle.png"
          ></Tool>
          <Tool
            onClick={() => {
              setSelected("./src/assets/right_triangle.png");
              perms.onChange("right triangle");
              setToggled(false);
            }}
            imgSrc="./src/assets/right_triangle.png"
          ></Tool>
          <Tool
            onClick={() => {
              setSelected("./src/assets/diamond.png");
              perms.onChange("diamond");
              setToggled(false);
            }}
            imgSrc="./src/assets/diamond.png"
          ></Tool>
          <Tool
            onClick={() => {
              setSelected("./src/assets/oval.png");
              perms.onChange("oval");
              setToggled(false);
            }}
            imgSrc="./src/assets/oval.png"
          ></Tool>
        </>
      ) : null}
    </>
  );
}
export function Box({ title, toggled: initialToggled, children }) {
  const [toggled, setToggled] = useState(initialToggled);
  const isMobile =
    document.documentElement.clientWidth <
    document.documentElement.clientHeight;
  if (toggled) {
    return (
      <>
        <div
          className={
            "rounded-t-[4px] border border-gray-600 bg-gray-900 text-center font-bold h-[5vh] w-[9vw] mr-[1vw] " +
            (isMobile ? "grow" : "")
          }
          onClick={() => setToggled(false)}
        >
          {title} ⏶
        </div>
        <div
          className={
            isMobile
              ? "absolute w-[80vw] h-[15vh] overflow-scroll mt-[5vh] rounded-b-[4px] border border-gray-800 bg-[#191919]"
              : "rounded-b-[4px] border border-gray-800 bg-[#191919] text-wrap mr-[1vw] min-w-0 shrink overflow-hidden w-[9vw]"
          }
        >
          {children}
        </div>
      </>
    );
  }
  return (
    <div
      className={
        "rounded-[4px] border border-gray-600 bg-gray-900  text-center font-bold mr-[1vw] h-[5vh] w-[9vw] " +
        (isMobile ? "grow" : "")
      }
      onClick={() => setToggled(true)}
    >
      {title} ⏷
    </div>
  );
}
