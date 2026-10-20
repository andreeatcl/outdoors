import { useState } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { MapPin, Check, Hourglass } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import LocationPicker from "../map/LocationPicker";
import { reverseGeocode } from "../../utils/geocode";
import { updateEventInList } from "../../store/eventsSlice";
import { getEventType } from "../../constants/EVENT_TYPES";
import api from "../../services/api";

const DURATION_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1h" },
  { value: 90, label: "1h 30min" },
  { value: 120, label: "2h" },
  { value: 180, label: "3h" },
  { value: 240, label: "4h+" },
];

function pad(n) {
  return String(n).padStart(2, "0");
}
function toDateInput(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function toTimeInput(iso) {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventEditForm({ event, open, onClose, onCancel }) {
  const dispatch = useDispatch();
  const [editForm, setEditForm] = useState(() => ({
    title: event.title,
    description: event.description ?? "",
    event_type: event.event_type,
    start_date: toDateInput(event.start_date),
    start_time: toTimeInput(event.start_date),
    duration: event.duration,
    max_participants: event.max_participants,
    address: event.address,
    lat: event.coordinates?.lat,
    lng: event.coordinates?.lng,
  }));
  const [saving, setSaving] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const setField = (key) => (e) =>
    setEditForm((f) => ({ ...f, [key]: e.target.value }));

  const handlePickLocation = async (latlng) => {
    setEditForm((f) => ({ ...f, lat: latlng.lat, lng: latlng.lng }));
    setGeocoding(true);
    const addr = await reverseGeocode(latlng.lat, latlng.lng);
    setEditForm((f) => ({ ...f, address: addr || f.address }));
    setGeocoding(false);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const startDate = new Date(`${editForm.start_date}T${editForm.start_time}`);
    if (startDate.getTime() > Date.now() + 48 * 60 * 60 * 1000) {
      toast.error("Evenimentul trebuie să aibă loc în următoarele 48 de ore.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: editForm.title,
        description: editForm.description,
        start_date: startDate.toISOString(),
        duration: editForm.duration,
        max_participants: Number(editForm.max_participants),
        address: editForm.address,
        lat: editForm.lat,
        lng: editForm.lng,
      };
      const { data } = await api.put(`/api/events/${event.event_id}`, payload);
      dispatch(updateEventInList(data.event));
      toast.success("Eveniment actualizat.");
      onCancel();
    } catch (err) {
      toast.error(
        err.response?.data?.error ?? "Nu s-a putut actualiza evenimentul.",
      );
    } finally {
      setSaving(false);
    }
  };

  const EditIcon = getEventType(editForm.event_type).icon;

  return (
    <Modal open={open} onClose={onClose} title="Editează eveniment" size="md">
      <form onSubmit={handleSaveEdit} className="p-6 flex flex-col gap-4">
        <Input
          label="Titlu *"
          value={editForm.title}
          onChange={setField("title")}
          required
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-text-primary">
            Tip activitate
          </label>
          <div className="flex items-center gap-2 p-2 rounded-xl border border-border bg-background text-sm text-text-muted">
            <EditIcon size={20} />
            {getEventType(editForm.event_type).label}
            <span className="text-xs ml-auto">(nu poate fi schimbat)</span>
          </div>
        </div>

        <Input
          label="Descriere (opțional)"
          value={editForm.description}
          onChange={setField("description")}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Data *"
            type="date"
            min={toDateInput(new Date().toISOString())}
            max={toDateInput(
              new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            )}
            value={editForm.start_date}
            onChange={setField("start_date")}
            required
          />
          <Input
            label="Ora start *"
            type="time"
            value={editForm.start_time}
            onChange={setField("start_time")}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-text-primary">
            Durată
          </label>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() =>
                  setEditForm((f) => ({ ...f, duration: d.value }))
                }
                className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all
                  ${
                    editForm.duration === d.value
                      ? "bg-primary text-white border-primary"
                      : "bg-background border-border text-text-primary hover:border-primary/40"
                  }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <Input
          label={`Participanți max. * (minim ${Math.max(2, event.participants_count)})`}
          type="number"
          min={Math.max(2, event.participants_count)}
          max={100}
          value={editForm.max_participants}
          onChange={setField("max_participants")}
          required
        />

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowLocationPicker((v) => !v)}
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1.5 self-start"
          >
            <MapPin size={14} />
            {showLocationPicker ? "Ascunde harta" : "Schimbă locația pe hartă"}
          </button>
          {showLocationPicker && (
            <LocationPicker
              lat={editForm.lat}
              lng={editForm.lng}
              onPick={handlePickLocation}
            />
          )}
        </div>

        <div className="relative">
          <Input
            label="Adresă"
            value={geocoding ? "Se determină adresa…" : editForm.address}
            onChange={setField("address")}
            disabled={geocoding}
          />
          {geocoding && (
            <span className="absolute right-3 top-8 text-text-muted animate-pulse">
              <Hourglass size={14} />
            </span>
          )}
          {showLocationPicker && (
            <p className="text-xs text-text-muted mt-1">
              Adresa se completează automat după selectarea locației pe hartă.
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
          >
            Anulează
          </Button>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? (
              "Se salvează…"
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <Check size={16} /> Salvează
              </span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
