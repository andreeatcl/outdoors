import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { ArrowLeft, Bell, Calendar, MessageCircle } from "lucide-react";
import {
  setNotifications,
  markRead,
  markAllRead,
  clearNotifications,
} from "../store/notificationsSlice";
import { setSelected, clearSelected } from "../store/eventsSlice";
import { setActiveConversation } from "../store/chatSlice";
import { timeFromNow, formatNotificationContent } from "../utils/formatters";
import {
  NOTIFICATION_TYPE_META,
  NOTIFICATION_CATEGORIES,
  categoryForType,
} from "../constants/notificationTypes";
import { profilePath } from "../constants/ROUTES";
import EventDetailsModal from "../components/events/EventDetailsModal";
import NotificationActionModal from "../components/notifications/NotificationActionModal";
import api from "../services/api";

const EVENT_REF_TYPES = new Set([
  "event_join",
  "event_checkin",
  "event_full",
  "event_schedule_changed",
  "event_details_changed",
  "event_cancelled",
  "event_starting_soon",
  "checkin_open",
  "event_started",
]);

function NotificationRow({ notif, onClick }) {
  const meta = NOTIFICATION_TYPE_META[notif.type] ?? {
    icon: Bell,
    label: notif.type,
    bg: "bg-border text-text-muted",
  };

  return (
    <button
      onClick={() => onClick(notif)}
      className={`w-full flex items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-background border-b border-border/60 last:border-0
        ${!notif.is_read ? "bg-primary/5" : ""}`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${meta.bg}`}
      >
        <meta.icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
            {meta.label}
          </span>
          {!notif.is_read && (
            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
          )}
        </div>
        <p className="text-sm text-text-primary mt-0.5 leading-snug">
          {formatNotificationContent(notif.content)}
        </p>
        <p className="text-xs text-text-muted mt-1">
          {timeFromNow(notif.created_at)}
        </p>
      </div>
    </button>
  );
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list, unread } = useSelector((s) => s.notifications);
  const currentUser = useSelector((s) => s.auth.user);
  const [category, setCategory] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [actionOptions, setActionOptions] = useState(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);

  useEffect(() => {
    api
      .get("/api/notifications")
      .then(({ data }) => dispatch(setNotifications(data.notifications)))
      .catch(() => {});
  }, [dispatch]);

  const handleMarkAllRead = async () => {
    dispatch(markAllRead());
    api.put("/api/notifications/read-all").catch(() => {});
  };

  const handleDeleteAll = async () => {
    dispatch(clearNotifications());
    api.delete("/api/notifications").catch(() => {});
  };

  const openEventModal = (eventId) => {
    setActionOptions(null);
    api
      .get(`/api/events/${eventId}`)
      .then(({ data }) => {
        dispatch(setSelected(data.event));
        setEventModalOpen(true);
      })
      .catch(() => toast.error("Evenimentul nu mai există."));
  };

  const openEventChat = (eventId) => {
    setActionOptions(null);
    dispatch(setActiveConversation(`event_${eventId}`));
    navigate("/chat");
  };

  const openDmChat = (userId) => {
    setActionOptions(null);
    api
      .get(`/api/users/${userId}`)
      .then(({ data }) => navigate("/chat", { state: { openDm: data.user } }))
      .catch(() => toast.error("Utilizatorul nu mai există."));
  };

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      dispatch(markRead(notif.notification_id));
      api
        .put(`/api/notifications/${notif.notification_id}/read`)
        .catch(() => {});
    }

    if (notif.type === "friend_request" || notif.type === "friend_accepted") {
      navigate(profilePath(notif.ref_id));
      return;
    }

    if (notif.type === "achievement_milestone") {
      if (currentUser) navigate(profilePath(currentUser.user_id));
      return;
    }

    if (notif.type === "dm_message") {
      openDmChat(notif.ref_id);
      return;
    }

    if (notif.type === "event_message") {
      setActionOptions([
        {
          icon: Calendar,
          label: "Vezi evenimentul",
          onClick: () => openEventModal(notif.ref_id),
        },
        {
          icon: MessageCircle,
          label: "Deschide conversația",
          onClick: () => openEventChat(notif.ref_id),
        },
      ]);
      return;
    }

    if (EVENT_REF_TYPES.has(notif.type)) {
      openEventModal(notif.ref_id);
    }
  };

  const filtered = list.filter((n) => {
    if (unreadOnly && n.is_read) return false;
    if (category !== "all" && categoryForType(n.type) !== category)
      return false;
    return true;
  });

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface shadow-sm flex-shrink-0">
        <button
          onClick={() => navigate("/home")}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-background text-text-muted transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <img src="/favicon.svg" alt="Outdoors" className="w-7 h-7" />
        <span className="font-display font-bold text-text-primary">
          Notificări
        </span>
        {unread > 0 && (
          <span className="bg-primary text-white text-xs rounded-full px-2 py-0.5 font-bold">
            {unread}
          </span>
        )}
        <div className="ml-auto flex items-center gap-3">
          {unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-primary font-medium hover:underline"
            >
              Marchează toate ca citite
            </button>
          )}
          {list.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="text-xs text-red-600 font-medium hover:underline"
            >
              Șterge toate
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-surface overflow-x-auto flex-shrink-0">
        <button
          onClick={() => setCategory("all")}
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors
            ${category === "all" ? "bg-primary text-white" : "bg-background text-text-muted hover:bg-border/60"}`}
        >
          Toate
        </button>
        {Object.entries(NOTIFICATION_CATEGORIES).map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors
              ${category === key ? "bg-primary text-white" : "bg-background text-text-muted hover:bg-border/60"}`}
          >
            {cat.label}
          </button>
        ))}
        <button
          onClick={() => setUnreadOnly((v) => !v)}
          className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0
            ${unreadOnly ? "bg-primary text-white" : "bg-background text-text-muted hover:bg-border/60"}`}
        >
          Necitite
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-text-muted">
            <Bell size={48} />
            <p className="text-sm font-medium">Nicio notificare</p>
          </div>
        ) : (
          <div className="bg-surface mx-4 mt-4 rounded-2xl border border-border/60 overflow-hidden shadow-sm">
            {filtered.map((n) => (
              <NotificationRow
                key={n.notification_id}
                notif={n}
                onClick={handleNotificationClick}
              />
            ))}
          </div>
        )}
      </div>

      <NotificationActionModal
        open={!!actionOptions}
        onClose={() => setActionOptions(null)}
        options={actionOptions ?? []}
      />

      <EventDetailsModal
        open={eventModalOpen}
        onClose={() => {
          setEventModalOpen(false);
          dispatch(clearSelected());
        }}
      />
    </div>
  );
}
