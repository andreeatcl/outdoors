import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { ArrowLeft, Camera, Trash2, Hand } from "lucide-react";
import { updateUser, logout } from "../store/authSlice";
import api from "../services/api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { initials, resolveAvatarUrl } from "../utils/formatters";

export default function SettingsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector((s) => s.auth.user);

  const [form, setForm] = useState({
    first_name: currentUser?.first_name ?? "",
    last_name: currentUser?.last_name ?? "",
    username: currentUser?.username ?? "",
    bio: currentUser?.bio ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwLoading, setPwLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setPw = (k) => (e) => setPwForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put("/api/users/me", form);
      dispatch(updateUser(data.user));
      toast.success("Profil actualizat!");
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Eroare la salvare.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("Parolele noi nu coincid.");
      return;
    }
    setPwLoading(true);
    try {
      await api.put("/api/users/me/password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success("Parola a fost schimbată!");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Eroare la schimbarea parolei.");
    } finally {
      setPwLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const { data } = await api.post("/api/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      dispatch(updateUser({ avatar_url: data.avatar_url }));
      toast.success("Avatar actualizat!");
    } catch {
      toast.error("Eroare la upload.");
    }
  };

  const handleAvatarRemove = async () => {
    try {
      await api.delete("/api/users/me/avatar");
      dispatch(updateUser({ avatar_url: null }));
      toast.success("Avatar șters.");
    } catch {
      toast.error("Eroare la ștergerea avatarului.");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete("/api/users/me");
      dispatch(logout());
      toast("Cont șters.", { icon: <Hand size={18} /> });
      navigate("/");
    } catch {
      toast.error("Eroare la ștergerea contului.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-surface/90 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-background text-text-muted"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="font-display font-bold text-text-primary">Setări</span>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-6">
        <div className="card p-6 flex flex-col items-center gap-4">
          {currentUser?.avatar_url ? (
            <img
              src={resolveAvatarUrl(currentUser.avatar_url)}
              alt=""
              className="w-24 h-24 rounded-3xl object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold">
              {initials(currentUser?.first_name, currentUser?.last_name)}
            </div>
          )}
          <div className="flex items-center gap-4">
            <label className="text-sm text-primary font-semibold hover:underline cursor-pointer flex items-center gap-1.5">
              <Camera size={16} /> Schimbă avatarul
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </label>
            {currentUser?.avatar_url && (
              <button
                onClick={handleAvatarRemove}
                className="text-sm text-red-500 font-semibold hover:underline flex items-center gap-1.5"
              >
                <Trash2 size={16} /> Șterge avatarul
              </button>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display font-semibold text-base text-text-primary mb-4">
            Informații profil
          </h2>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Prenume"
                value={form.first_name}
                onChange={set("first_name")}
              />
              <Input
                label="Nume"
                value={form.last_name}
                onChange={set("last_name")}
              />
            </div>
            <Input
              label="Username"
              value={form.username}
              onChange={set("username")}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-text-primary">
                Bio
              </label>
              <textarea
                className="input-field resize-none h-24"
                placeholder="Scrie ceva despre tine…"
                value={form.bio}
                onChange={set("bio")}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Se salvează…" : "Salvează modificările"}
            </Button>
          </form>
        </div>

        <div className="card p-6">
          <h2 className="font-display font-semibold text-base text-text-primary mb-4">
            Schimbare parolă
          </h2>
          <div className="flex flex-col gap-4">
            <Input
              label="Parola curentă"
              type="password"
              placeholder="••••••••"
              value={pwForm.currentPassword}
              onChange={setPw("currentPassword")}
            />
            <Input
              label="Parola nouă"
              type="password"
              placeholder="••••••••"
              value={pwForm.newPassword}
              onChange={setPw("newPassword")}
            />
            <Input
              label="Confirmă parola"
              type="password"
              placeholder="••••••••"
              value={pwForm.confirmPassword}
              onChange={setPw("confirmPassword")}
            />
            <Button
              variant="outline"
              onClick={handlePasswordChange}
              disabled={pwLoading}
            >
              {pwLoading ? "Se schimbă…" : "Schimbă parola"}
            </Button>
          </div>
        </div>

        <div className="card p-6 border-red-200">
          <h2 className="font-display font-semibold text-base text-red-500 mb-2">
            Zonă periculoasă
          </h2>
          <p className="text-sm text-text-muted mb-4">
            Ștergerea contului este ireversibilă. Toate datele tale vor fi
            pierdute.
          </p>
          {!showDeleteConfirm ? (
            <Button
              variant="danger"
              className="flex items-center justify-center gap-1.5"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={16} /> Șterge contul
            </Button>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-red-500">Ești sigur?</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Anulează
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={handleDeleteAccount}
                >
                  Da, șterge
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
