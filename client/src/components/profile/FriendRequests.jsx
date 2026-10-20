import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Check, X, Hand } from "lucide-react";
import api from "../../services/api";
import { initials, resolveAvatarUrl } from "../../utils/formatters";
import { profilePath } from "../../constants/ROUTES";

function Avatar({ user }) {
  if (user.avatar_url) {
    return (
      <img
        src={resolveAvatarUrl(user.avatar_url)}
        alt={user.username}
        className="w-11 h-11 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
      {initials(user.first_name, user.last_name)}
    </div>
  );
}

export default function FriendRequests({ onAccepted }) {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    api
      .get("/api/friendships/requests")
      .then(({ data }) => setRequests(data.requests))
      .catch(() => {});
  }, []);

  const handleAccept = async (friendshipId) => {
    setBusyId(friendshipId);
    try {
      await api.put(`/api/friendships/${friendshipId}/accept`);
      setRequests((r) => r.filter((req) => req.friendship_id !== friendshipId));
      toast.success("Cerere de prietenie acceptată!");
      onAccepted?.();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Eroare.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (friendshipId) => {
    setBusyId(friendshipId);
    try {
      await api.put(`/api/friendships/${friendshipId}/reject`);
      setRequests((r) => r.filter((req) => req.friendship_id !== friendshipId));
      toast("Cerere respinsă.", { icon: <Hand size={18} /> });
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Eroare.");
    } finally {
      setBusyId(null);
    }
  };

  if (!requests.length) return null;

  return (
    <div className="card p-5">
      <h2 className="font-display font-semibold text-base text-text-primary mb-4">
        Cereri de prietenie ({requests.length})
      </h2>
      <div className="flex flex-col gap-2">
        {requests.map((req) => {
          const user = req.requester;
          const busy = busyId === req.friendship_id;
          return (
            <div
              key={req.friendship_id}
              className="flex items-center gap-3 p-2 rounded-xl"
            >
              <button
                onClick={() => navigate(profilePath(user.user_id))}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                <Avatar user={user} />
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-text-primary truncate">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-text-muted">@{user.username}</p>
                </div>
              </button>
              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  onClick={() => handleAccept(req.friendship_id)}
                  disabled={busy}
                  title="Acceptă"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => handleReject(req.friendship_id)}
                  disabled={busy}
                  title="Respinge"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
