import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Users, Calendar, LogOut, ArrowLeft } from "lucide-react";
import { logout } from "../store/authSlice";
import UsersTab from "../components/admin/UsersTab";
import EventsTab from "../components/admin/EventsTab";

export default function AdminPage() {
  const [tab, setTab] = useState("users");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface px-4 py-3 flex items-center justify-between">
        <h1 className="font-display font-bold text-lg text-text-primary">
          Panou de administrare
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
          >
            <ArrowLeft size={16} />
            Înapoi la aplicație
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary"
          >
            <LogOut size={16} />
            Deconectare
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setTab("users")}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${
              tab === "users"
                ? "bg-primary text-white"
                : "bg-surface text-text-muted border border-border"
            }`}
          >
            <Users size={14} />
            Utilizatori
          </button>
          <button
            onClick={() => setTab("events")}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${
              tab === "events"
                ? "bg-primary text-white"
                : "bg-surface text-text-muted border border-border"
            }`}
          >
            <Calendar size={14} />
            Evenimente
          </button>
        </div>

        {tab === "users" ? <UsersTab /> : <EventsTab />}
      </div>
    </div>
  );
}
