import { useState } from "react";
import { useDispatch } from "react-redux";
import EventCard from "../events/EventCard";
import EventDetailsModal from "../events/EventDetailsModal";
import PastEventsModal from "./PastEventsModal";
import { setSelected } from "../../store/eventsSlice";

const PREVIEW_COUNT = 3;

export default function PastEvents({ events }) {
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const preview = events?.slice(0, PREVIEW_COUNT) ?? [];

  const openDetails = (ev) => {
    dispatch(setSelected(ev));
    setDetailsOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-base text-text-primary">
          Evenimente trecute
        </h2>
        {events?.length > PREVIEW_COUNT && (
          <button
            onClick={() => setShowModal(true)}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Vezi lista ({events.length})
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {preview.map((ev) => (
          <EventCard key={ev.event_id} event={ev} onClick={openDetails} />
        ))}
      </div>

      <PastEventsModal
        open={showModal}
        onClose={() => setShowModal(false)}
        events={events}
        onEventClick={(ev) => {
          openDetails(ev);
          setShowModal(false);
        }}
      />

      <EventDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
    </div>
  );
}
