import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  MapPin,
  MessageCircle,
  Pencil,
  Trash2,
  Check,
  CircleCheck,
  PartyPopper,
  Hand,
} from "lucide-react";
import Button from "../ui/Button";
import {
  joinEvent,
  leaveEvent,
  checkInEvent,
  removeEventFromList,
} from "../../store/eventsSlice";
import { setActiveConversation } from "../../store/chatSlice";
import api from "../../services/api";

export default function EventDetailsActions({
  event,
  isAuth,
  isOrganizer,
  isFull,
  inCheckInWindow,
  onEdit,
  onClose,
}) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector((s) => s.auth.user);
  const [checkingIn, setCheckingIn] = useState(false);
  const [joining, setJoining] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const openGroupChat = () => {
    dispatch(setActiveConversation(`event_${event.event_id}`));
    navigate("/chat");
    onClose();
  };

  const handleCheckIn = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalizarea nu este disponibilă în acest browser.");
      return;
    }
    setCheckingIn(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: c }) => {
        try {
          await api.post(`/api/events/${event.event_id}/checkin`, {
            lat: c.latitude,
            lng: c.longitude,
          });
          dispatch(checkInEvent(event.event_id));
          toast.success("Check-in realizat cu succes! Ne vedem acolo.", {
            icon: <PartyPopper size={18} />,
          });
        } catch (err) {
          toast.error(
            err.response?.data?.error ?? "Check-in eșuat. Încearcă din nou.",
          );
        } finally {
          setCheckingIn(false);
        }
      },
      () => {
        toast.error(
          "Nu am putut accesa locația ta. Permite accesul în browser.",
        );
        setCheckingIn(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      await api.post(`/api/events/${event.event_id}/join`);
      dispatch(
        joinEvent({
          eventId: event.event_id,
          user: {
            user_id: currentUser.user_id,
            username: currentUser.username,
            first_name: currentUser.first_name,
            last_name: currentUser.last_name,
            avatar_url: currentUser.avatar_url,
          },
        }),
      );
      toast.success(`Te-ai înscris la "${event.title}"!`, {
        icon: <PartyPopper size={18} />,
      });
      onClose();
    } catch (err) {
      toast.error(
        err.response?.data?.error ?? "Nu s-a putut realiza înscrierea.",
      );
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    try {
      await api.delete(`/api/events/${event.event_id}/leave`);
      dispatch(
        leaveEvent({ eventId: event.event_id, userId: currentUser.user_id }),
      );
      toast("Ai renunțat la eveniment.", { icon: <Hand size={18} /> });
      onClose();
    } catch (err) {
      toast.error(
        err.response?.data?.error ?? "Nu s-a putut realiza retragerea.",
      );
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/events/${event.event_id}`);
      dispatch(removeEventFromList(event.event_id));
      toast.success("Eveniment șters.");
      onClose();
    } catch (err) {
      toast.error(
        err.response?.data?.error ?? "Nu s-a putut șterge evenimentul.",
      );
      setDeleting(false);
    }
  };

  if (!isAuth) {
    return (
      <div className="bg-primary-light/30 rounded-xl p-3 text-sm text-text-muted text-center">
        <button
          onClick={() => navigate("/login")}
          className="text-primary font-semibold hover:underline"
        >
          Conectează-te
        </button>{" "}
        pentru a participa la eveniment.
      </div>
    );
  }

  if (isOrganizer) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-1.5"
          onClick={openGroupChat}
        >
          <MessageCircle size={16} /> Chat grup
        </Button>
        <div className="flex gap-2">
          {event.status === "upcoming" && (
            <Button
              variant="outline"
              className="flex-1 flex items-center justify-center gap-1.5"
              onClick={onEdit}
            >
              <Pencil size={16} /> Editează
            </Button>
          )}
          {confirmDelete ? (
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Se șterge…" : "Sigur? Confirmă ștergerea"}
            </Button>
          ) : (
            <Button
              variant="danger"
              className="flex-1 flex items-center justify-center gap-1.5"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={16} /> Șterge
            </Button>
          )}
        </div>
        {confirmDelete && (
          <button
            onClick={() => setConfirmDelete(false)}
            className="text-xs text-text-muted hover:underline text-center"
          >
            Anulează ștergerea
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {event.is_joined ? (
        <>
          {inCheckInWindow && (
            <Button
              className="w-full flex items-center justify-center gap-1.5"
              onClick={handleCheckIn}
              disabled={checkingIn || event.is_checked_in}
            >
              {event.is_checked_in ? (
                <>
                  <CircleCheck size={16} /> Check-in efectuat
                </>
              ) : checkingIn ? (
                "Se verifică locația…"
              ) : (
                <>
                  <MapPin size={16} /> Check-in
                </>
              )}
            </Button>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 flex items-center justify-center gap-1.5"
              onClick={openGroupChat}
            >
              <MessageCircle size={16} /> Chat grup
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleLeave}>
              Renunță
            </Button>
          </div>
        </>
      ) : event.status === "finished" ? null : (
        <Button
          className="w-full flex items-center justify-center gap-1.5"
          onClick={handleJoin}
          disabled={isFull || joining}
        >
          {isFull ? (
            "Eveniment complet"
          ) : joining ? (
            "Se înscrie…"
          ) : (
            <>
              <Check size={16} /> Participă — {event.participants_count}/
              {event.max_participants}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
