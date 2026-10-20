import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Modal from "../ui/Modal";
import ErrorBoundary from "../ui/ErrorBoundary";
import EventEditForm from "./EventEditForm";
import EventDetailsInfo, { EventDetailsHeader } from "./EventDetailsInfo";
import EventDetailsActions from "./EventDetailsActions";
import { clearSelected } from "../../store/eventsSlice";
import { getEventColor } from "../../utils/eventColors";
import { getEventType } from "../../constants/EVENT_TYPES";

export default function EventDetailsModal({ open, onClose }) {
  const eventId = useSelector((s) => s.events.selected?.event_id);
  return (
    <ErrorBoundary key={eventId ?? "none"}>
      <EventDetailsModalContent open={open} onClose={onClose} />
    </ErrorBoundary>
  );
}

function EventDetailsModalContent({ open, onClose }) {
  const dispatch = useDispatch();
  const event = useSelector((s) => s.events.selected);
  const { isAuth } = useSelector((s) => ({
    isAuth: s.auth.isLoggedIn && !s.auth.isGuest,
  }));
  const currentUser = useSelector((s) => s.auth.user);
  const [isEditing, setIsEditing] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 30 * 1000);
    return () => clearInterval(id);
  }, []);

  if (!event) return null;

  const color = getEventColor(event);
  const typeInfo = getEventType(event.event_type);
  const fillPct = Math.round(
    (event.participants_count / event.max_participants) * 100,
  );
  const isOrganizer =
    currentUser && event.organizer?.user_id === currentUser.user_id;
  const isFull = event.participants_count >= event.max_participants;

  const now = new Date(nowTick);
  const eventStart = new Date(event.start_date);
  const eventEnd = new Date(
    eventStart.getTime() + (event.duration ?? 0) * 60 * 1000,
  );
  const checkInOpen = new Date(eventStart.getTime() - 2 * 60 * 60 * 1000);
  const inCheckInWindow = now >= checkInOpen && now <= eventEnd;

  const msUntilStart = eventStart.getTime() - nowTick;
  const showCountdown =
    event.status !== "ongoing" &&
    event.status !== "finished" &&
    msUntilStart > 0;
  let countdownLabel = "";
  if (showCountdown) {
    const totalMinutes = Math.floor(msUntilStart / (60 * 1000));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    if (days > 0) {
      countdownLabel = `în ${days}z ${hours}h`;
    } else if (hours > 0) {
      countdownLabel = `în ${hours}h ${minutes}min`;
    } else {
      countdownLabel = `în ${minutes}min`;
    }
  }

  const handleClose = () => {
    dispatch(clearSelected());
    setIsEditing(false);
    onClose();
  };

  if (isEditing) {
    return (
      <EventEditForm
        event={event}
        open={open}
        onClose={handleClose}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <Modal open={open} onClose={handleClose} size="md">
      <div>
        <EventDetailsHeader
          event={event}
          color={color}
          typeInfo={typeInfo}
          isAuth={isAuth}
          showCountdown={showCountdown}
          countdownLabel={countdownLabel}
          onClose={handleClose}
        />

        <div className="px-6 pb-6 flex flex-col gap-4">
          <EventDetailsInfo
            event={event}
            color={color}
            fillPct={fillPct}
            isAuth={isAuth}
            isOrganizer={isOrganizer}
            onClose={handleClose}
          />
          <EventDetailsActions
            event={event}
            isAuth={isAuth}
            isOrganizer={isOrganizer}
            isFull={isFull}
            inCheckInWindow={inCheckInWindow}
            onEdit={() => setIsEditing(true)}
            onClose={handleClose}
          />
        </div>
      </div>
    </Modal>
  );
}
