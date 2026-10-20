import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Check, Hourglass } from "lucide-react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import LocationPicker from "../map/LocationPicker";
import { addEvent, clearCreateCoords } from "../../store/eventsSlice";
import { EVENT_TYPES } from "../../constants/EVENT_TYPES";
import { reverseGeocode } from "../../utils/geocode";
import api from "../../services/api";

const DURATION_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1h" },
  { value: 90, label: "1h 30min" },
  { value: 120, label: "2h" },
  { value: 180, label: "3h" },
  { value: 240, label: "4h+" },
];

const BUCHAREST = { lat: 44.435512, lng: 26.10248 };

export default function CreateEventModal({ open, onClose }) {
  const dispatch = useDispatch();
  const createCoords = useSelector((s) => s.events.createCoords);
  const userLocation = useSelector((s) => s.events.userLocation);
  const currentUser = useSelector((s) => s.auth.user);

  const [form, setForm] = useState({
    title: "",
    event_type: "fotbal",
    description: "",
    start_date: "",
    start_time: "",
    duration: 90,
    max_participants: 10,
    lat: "",
    lng: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    if (!createCoords) return;
    setForm((f) => ({
      ...f,
      lat: createCoords.lat.toFixed(6),
      lng: createCoords.lng.toFixed(6),
      address: "",
    }));
    setGeocoding(true);
    reverseGeocode(createCoords.lat, createCoords.lng).then((addr) => {
      setForm((f) => ({ ...f, address: addr }));
      setGeocoding(false);
    });
  }, [createCoords]);

  const handlePickLocation = async (latlng) => {
    setForm((f) => ({
      ...f,
      lat: latlng.lat.toFixed(6),
      lng: latlng.lng.toFixed(6),
    }));
    setGeocoding(true);
    const addr = await reverseGeocode(latlng.lat, latlng.lng);
    setForm((f) => ({ ...f, address: addr || f.address }));
    setGeocoding(false);
  };

  useEffect(() => {
    if (!open) {
      setForm({
        title: "",
        event_type: "fotbal",
        description: "",
        start_date: "",
        start_time: "",
        duration: 90,
        max_participants: 10,
        lat: "",
        lng: "",
        address: "",
      });
      setFormError(null);
    }
  }, [open]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!form.title || !form.start_date || !form.start_time || !form.lat) {
      setFormError("Completează toate câmpurile obligatorii.");
      return;
    }
    const startDate = new Date(`${form.start_date}T${form.start_time}`);
    if (startDate.getTime() > Date.now() + 48 * 60 * 60 * 1000) {
      setFormError("Evenimentul trebuie să aibă loc în următoarele 48 de ore.");
      return;
    }
    setLoading(true);

    try {
      const payload = {
        title: form.title,
        event_type: form.event_type,
        description: form.description,
        start_date: startDate.toISOString(),
        duration: form.duration,
        max_participants: Number(form.max_participants),
        lat: Number(form.lat),
        lng: Number(form.lng),
        address: form.address,
      };

      const { data } = await api.post("/api/events", payload);
      dispatch(addEvent(data.event));
      toast.success("Eveniment creat cu succes!");
      dispatch(clearCreateCoords());
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.error ?? "Eroare neașteptată. Încearcă din nou.";
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const maxDateStr = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  return (
    <Modal open={open} onClose={onClose} title="Creează eveniment" size="md">
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
        <Input
          label="Titlu *"
          placeholder="ex. Fotbal în Herăstrău"
          value={form.title}
          onChange={set("title")}
          required
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-text-primary">
            Tip activitate *
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {EVENT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, event_type: t.value }))}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-medium transition-all
                  ${
                    form.event_type === t.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-text-muted hover:border-primary/40"
                  }`}
              >
                <t.icon size={20} />
                <span className="leading-tight text-center">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Descriere (opțional)"
          placeholder="Detalii suplimentare..."
          value={form.description}
          onChange={set("description")}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Data *"
            type="date"
            min={todayStr}
            max={maxDateStr}
            value={form.start_date}
            onChange={set("start_date")}
            required
          />
          <Input
            label="Ora start *"
            type="time"
            value={form.start_time}
            onChange={set("start_time")}
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
                onClick={() => setForm((f) => ({ ...f, duration: d.value }))}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all
                  ${
                    form.duration === d.value
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
          label="Participanți max. *"
          type="number"
          min={2}
          max={100}
          value={form.max_participants}
          onChange={set("max_participants")}
          required
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-text-primary">
            Locație *
          </label>
          <LocationPicker
            lat={
              Number(form.lat) ||
              createCoords?.lat ||
              (userLocation ?? BUCHAREST).lat
            }
            lng={
              Number(form.lng) ||
              createCoords?.lng ||
              (userLocation ?? BUCHAREST).lng
            }
            onPick={handlePickLocation}
          />
        </div>

        <div className="relative">
          <Input
            label="Adresă"
            placeholder="Str. Exemplu, București"
            value={geocoding ? "Se determină adresa…" : form.address}
            onChange={set("address")}
            disabled={geocoding}
          />
          {geocoding && (
            <span className="absolute right-3 top-8 text-text-muted animate-pulse">
              <Hourglass size={14} />
            </span>
          )}
          <p className="text-xs text-text-muted mt-1">
            Adresa se completează automat după selectarea locației pe hartă.
          </p>
        </div>

        {formError && (
          <div className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {formError}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Anulează
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={loading || geocoding}
          >
            {loading ? (
              "Se creează…"
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <Check size={16} /> Creează eveniment
              </span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
