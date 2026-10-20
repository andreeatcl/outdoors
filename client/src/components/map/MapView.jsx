import { useCallback, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import { useDispatch, useSelector } from "react-redux";
import L from "leaflet";
import { Users, Clock, ArrowRight, CircleDot } from "lucide-react";
import { setSelected, setCreateCoords } from "../../store/eventsSlice";
import { getEventColor, lightenColor } from "../../utils/eventColors";
import { getEventType } from "../../constants/EVENT_TYPES";
import { timeFromNow, formatDuration } from "../../utils/formatters";
import { haversineKm } from "../../utils/distance";
import { userLocationIcon, createMarkerIcon } from "../../utils/mapIcons";

const BUCHAREST = [44.435512, 26.10248];

function MapInteractionHandler({ onDoubleClick }) {
  const mapRef = useRef(null);
  const map = useMapEvents({
    dblclick(e) {
      L.DomEvent.stopPropagation(e);
      onDoubleClick(e.latlng);
    },
    load() {
      mapRef.current = map;
    },
  });

  if (map && !map._disabledDblClick) {
    map.doubleClickZoom.disable();
    map._disabledDblClick = true;
  }

  return null;
}

export default function MapView({ onEventClick, onDoubleClick }) {
  const dispatch = useDispatch();
  const { list: events, filters, userLocation } = useSelector((s) => s.events);
  const BUCHAREST = { lat: 44.435512, lng: 26.10248 };
  const ref = userLocation || BUCHAREST;

  const visibleEvents = events.filter((ev) => {
    if (ev.status === "finished") return false;
    if (!filters.types.includes(ev.event_type)) return false;
    if (filters.timeRange) {
      const now = Date.now();
      const start = new Date(ev.start_date).getTime();
      const hours = (start - now) / (1000 * 60 * 60);
      if (ev.status !== "ongoing" && hours > Number(filters.timeRange))
        return false;
    }
    if (filters.distanceKm) {
      const dist = haversineKm(
        ref.lat,
        ref.lng,
        ev.coordinates.lat,
        ev.coordinates.lng,
      );
      if (dist > filters.distanceKm) return false;
    }
    return true;
  });

  const handleMarkerClick = useCallback(
    (ev) => {
      dispatch(setSelected(ev));
      onEventClick?.(ev);
    },
    [dispatch, onEventClick],
  );

  const handleDoubleClick = useCallback(
    (latlng) => {
      dispatch(setCreateCoords({ lat: latlng.lat, lng: latlng.lng }));
      onDoubleClick?.(latlng);
    },
    [dispatch, onDoubleClick],
  );

  return (
    <MapContainer
      center={BUCHAREST}
      zoom={13}
      className="w-full h-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapInteractionHandler onDoubleClick={handleDoubleClick} />

      {userLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={userLocationIcon}
          interactive={false}
        />
      )}

      {visibleEvents.map((ev) => {
        const color = getEventColor(ev);
        const typeInfo = getEventType(ev.event_type);
        const icon = createMarkerIcon(color, typeInfo.icon);

        return (
          <Marker
            key={ev.event_id}
            position={[ev.coordinates.lat, ev.coordinates.lng]}
            icon={icon}
            eventHandlers={{ click: () => handleMarkerClick(ev) }}
          >
            <Popup closeButton={false} className="event-popup">
              <div className="p-3 min-w-[200px]">
                <div className="flex items-start gap-2 mb-2">
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: lightenColor(color), color }}
                  >
                    <typeInfo.icon size={16} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary text-sm leading-tight truncate">
                      {ev.title}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                      {ev.status === "ongoing" ? (
                        <>
                          <CircleDot size={12} className="text-purple-500" />
                          În desfășurare
                        </>
                      ) : (
                        timeFromNow(ev.start_date)
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-text-muted mb-3">
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {ev.participants_count}/
                    {ev.max_participants}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {formatDuration(ev.duration)}
                  </span>
                </div>
                <button
                  onClick={() => handleMarkerClick(ev)}
                  className="w-full py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-1"
                >
                  Vezi detalii <ArrowRight size={12} />
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
