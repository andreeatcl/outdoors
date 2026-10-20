import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { getEventType } from "../../constants/EVENT_TYPES";
import { createMarkerIcon } from "../../utils/mapIcons";
import { getEventColor } from "../../utils/eventColors";

const BUCHAREST = [44.435512, 26.10248];

export default function CreatedEventsMap({ events, onEventClick }) {
  const pins = (events ?? []).filter((e) => e.coordinates);

  if (pins.length === 0) return null;

  const center = pins.length
    ? [pins[0].coordinates.lat, pins[0].coordinates.lng]
    : BUCHAREST;

  return (
    <div className="card p-5">
      <h2 className="font-display font-semibold text-base text-text-primary mb-4">
        Harta evenimentelor organizate
      </h2>
      <div className="rounded-xl overflow-hidden border border-border h-[240px]">
        <MapContainer
          center={center}
          zoom={11}
          className="w-full h-full"
          doubleClickZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {pins.map((ev) => {
            const typeInfo = getEventType(ev.event_type);
            const icon = createMarkerIcon(getEventColor(ev), typeInfo.icon);
            return (
              <Marker
                key={ev.event_id}
                position={[ev.coordinates.lat, ev.coordinates.lng]}
                icon={icon}
                eventHandlers={{
                  click: () => onEventClick?.(ev),
                }}
              />
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
