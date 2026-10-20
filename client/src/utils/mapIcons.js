import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import L from "leaflet";

export const userLocationIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:16px;height:16px;
      background:#2563eb;
      border-radius:50%;
      border:2px solid #fff;
      box-shadow:0 0 0 1px rgba(37,99,235,0.3), 0 2px 6px rgba(0,0,0,0.35);
    "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export function createMarkerIcon(color, Icon) {
  const iconSvg = renderToStaticMarkup(
    createElement(Icon, { size: 18, color: "#fff", strokeWidth: 2.25 }),
  );
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:36px;height:36px;
        background:${color};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:2px solid rgba(255,255,255,0.9);
        box-shadow:0 3px 8px rgba(0,0,0,0.3);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);line-height:1;">${iconSvg}</span>
      </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  });
}
