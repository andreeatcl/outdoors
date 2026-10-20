import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Lock, Menu } from "lucide-react";
import MapView from "../components/map/MapView";
import FilterBar from "../components/map/FilterBar";
import CreateEventModal from "../components/events/CreateEventModal";
import EventDetailsModal from "../components/events/EventDetailsModal";
import EventCard from "../components/events/EventCard";
import UserSearchModal from "../components/search/UserSearchModal";
import HamburgerDrawer from "../components/home/HamburgerDrawer";
import TopBar from "../components/home/TopBar";
import Modal from "../components/ui/Modal";
import {
  setEvents,
  setSelected,
  toggleListView,
  clearCreateCoords,
  setUserLocation,
} from "../store/eventsSlice";
import { setNotifications } from "../store/notificationsSlice";
import { haversineKm } from "../utils/distance";
import api from "../services/api";

export default function HomePage() {
  const dispatch = useDispatch();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const showListView = useSelector((s) => s.events.showListView);
  const events = useSelector((s) => s.events.list);
  const selected = useSelector((s) => s.events.selected);
  const filters = useSelector((s) => s.events.filters);
  const userLocation = useSelector((s) => s.events.userLocation);
  const { isAuth } = useSelector((s) => ({
    isAuth: s.auth.isLoggedIn && !s.auth.isGuest,
  }));

  const BUCHAREST = { lat: 44.435512, lng: 26.10248 };
  const ref = userLocation || BUCHAREST;

  useEffect(() => {
    api
      .get("/api/events")
      .then(({ data }) => dispatch(setEvents(data.events)))
      .catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (!isAuth) return;
    api
      .get("/api/notifications")
      .then(({ data }) => dispatch(setNotifications(data.notifications)))
      .catch(() => {});
  }, [dispatch, isAuth]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) =>
        dispatch(setUserLocation({ lat: c.latitude, lng: c.longitude })),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, [dispatch]);

  const handleMarkerClick = (ev) => {
    dispatch(setSelected(ev));
    setDetailsOpen(true);
  };

  const handleMapDoubleClick = () => {
    if (!isAuth) {
      toast("Conectează-te pentru a crea un eveniment.", {
        icon: <Lock size={18} />,
      });
      return;
    }
    setCreateOpen(true);
  };

  const handleCreateClick = () => {
    if (!isAuth) {
      toast("Conectează-te pentru a crea un eveniment.", {
        icon: <Lock size={18} />,
      });
      return;
    }
    dispatch(clearCreateCoords());
    setCreateOpen(true);
  };

  const ongoingEvents = events.filter((e) => e.status === "ongoing");

  const upcomingEvents = events.filter((ev) => {
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

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      <div className="absolute inset-0">
        <MapView
          onEventClick={handleMarkerClick}
          onDoubleClick={handleMapDoubleClick}
        />
      </div>

      <TopBar
        ongoingEvents={ongoingEvents}
        onEventClick={(ev) => {
          dispatch(setSelected(ev));
          setDetailsOpen(true);
        }}
        onSeeMore={() => dispatch(toggleListView())}
        onMenuOpen={() => setDrawerOpen(true)}
      />

      <FilterBar hasBanner />

      <button
        className="map-overlay bottom-6 left-4 flex items-center gap-2 px-5 py-3 bg-surface shadow-float border border-border/80 rounded-2xl text-sm font-bold text-text-primary hover:bg-background transition-colors"
        onClick={() => dispatch(toggleListView())}
      >
        <Menu size={16} />
        <span>Listă evenimente</span>
      </button>

      <button
        onClick={handleCreateClick}
        className="map-overlay bottom-6 right-4 flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-2xl shadow-float text-sm font-bold hover:bg-primary-dark transition-colors active:scale-95"
      >
        <span className="text-xl leading-none">+</span>
        <span>Eveniment nou</span>
      </button>

      <HamburgerDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSearchOpen={() => setSearchOpen(true)}
      />

      <UserSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      <Modal
        open={showListView}
        onClose={() => dispatch(toggleListView())}
        title={`Evenimente (${upcomingEvents.length})`}
        size="lg"
      >
        <div className="p-4 flex flex-col gap-3">
          {upcomingEvents.length === 0 ? (
            <p className="text-center text-text-muted py-8">
              Niciun eveniment activ.
            </p>
          ) : (
            upcomingEvents.map((ev) => (
              <EventCard
                key={ev.event_id}
                event={ev}
                onClick={(e) => {
                  dispatch(setSelected(e));
                  dispatch(toggleListView());
                  setDetailsOpen(true);
                }}
              />
            ))
          )}
        </div>
      </Modal>

      <CreateEventModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          dispatch(clearCreateCoords());
        }}
      />
      <EventDetailsModal
        open={detailsOpen && !!selected}
        onClose={() => setDetailsOpen(false)}
      />
    </div>
  );
}
