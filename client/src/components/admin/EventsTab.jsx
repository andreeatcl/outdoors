import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import api from "../../services/api";
import { setSelected } from "../../store/eventsSlice";
import EventDetailsModal from "../events/EventDetailsModal";
import { formatDate } from "../../utils/formatters";
import {
  PAGE_SIZE,
  ConfirmDialog,
  SearchInput,
  Pagination,
} from "./AdminShared";

export default function EventsTab() {
  const dispatch = useDispatch();
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const load = useCallback((pageNum, query) => {
    api
      .get("/api/admin/events", {
        params: { page: pageNum, limit: PAGE_SIZE, q: query || undefined },
      })
      .then(({ data }) => {
        setEvents(data.events);
        setTotal(data.total);
      })
      .catch(() => toast.error("Eroare la încărcarea evenimentelor."));
  }, []);

  useEffect(() => {
    load(page, q);
  }, [load, page, q]);

  const handleDelete = (event) => {
    api
      .delete(`/api/admin/events/${event.event_id}`)
      .then(() => {
        toast.success("Eveniment șters.");
        setPendingDelete(null);
        load(page, q);
      })
      .catch((err) => {
        toast.error(err.response?.data?.error ?? "Eroare la ștergere.");
        setPendingDelete(null);
      });
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <SearchInput
        value={q}
        onChange={(value) => {
          setQ(value);
          setPage(1);
        }}
        placeholder="Caută după titlu..."
      />

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background text-text-muted text-left">
              <th className="px-3 py-2 font-medium">Titlu</th>
              <th className="px-3 py-2 font-medium">Organizator</th>
              <th className="px-3 py-2 font-medium">Data</th>
              <th className="px-3 py-2 font-medium">Participanți</th>
              <th className="px-3 py-2 font-medium text-right">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-6 text-center text-text-muted"
                >
                  Niciun eveniment găsit.
                </td>
              </tr>
            ) : (
              events.map((e) => (
                <tr
                  key={e.event_id}
                  onClick={() => {
                    dispatch(setSelected(e));
                    setDetailsOpen(true);
                  }}
                  className="border-t border-border/60 cursor-pointer hover:bg-background"
                >
                  <td className="px-3 py-2 text-text-primary">{e.title}</td>
                  <td className="px-3 py-2 text-text-muted">
                    {e.organizer
                      ? `${e.organizer.first_name} ${e.organizer.last_name}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-text-muted">
                    {formatDate(e.start_date, "d MMM yyyy, HH:mm")}
                  </td>
                  <td className="px-3 py-2 text-text-muted">
                    {e.participants_count}/{e.max_participants}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setPendingDelete(e);
                      }}
                      className="text-text-muted hover:text-red-600 p-1"
                      title="Șterge eveniment"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        summary={`${total} evenimente`}
        onPageChange={setPage}
      />

      {pendingDelete && (
        <ConfirmDialog
          message={`Sigur ștergi evenimentul "${pendingDelete.title}"? Acțiunea este ireversibilă.`}
          onConfirm={() => handleDelete(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      <EventDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
    </div>
  );
}
