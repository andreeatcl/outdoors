import { useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useSelector } from "react-redux";
import L from "leaflet";
import { userLocationIcon } from "../../utils/mapIcons";

const pickerIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:28px;height:28px;
      background:#16a34a;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:2px solid rgba(255,255,255,0.9);
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
    "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function PickerClickHandler({ onPick }) {
  useMapEvents({
    dblclick(e) {
      L.DomEvent.stopPropagation(e);
      onPick(e.latlng);
    },
  });
  return null;
}

export default function LocationPicker({ lat, lng, onPick, height = 220 }) {
  const userLocation = useSelector((s) => s.events.userLocation);
  const handlePick = useCallback((latlng) => onPick(latlng), [onPick]);

  return (
    <div
      style={{ height }}
      className="rounded-xl overflow-hidden border border-border relative"
    >
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        className="w-full h-full"
        doubleClickZoom={false}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <PickerClickHandler onPick={handlePick} />
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocationIcon}
            interactive={false}
          />
        )}
        <Marker position={[lat, lng]} icon={pickerIcon} />
      </MapContainer>
    </div>
  );
}
