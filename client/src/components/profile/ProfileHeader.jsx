import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Pencil, MessageCircle, Hourglass, UserPlus } from "lucide-react";
import Button from "../ui/Button";
import api from "../../services/api";
import { initials, formatDate, resolveAvatarUrl } from "../../utils/formatters";

function Avatar({ user }) {
  if (user?.avatar_url) {
    return (
      <img
        src={resolveAvatarUrl(user.avatar_url)}
        alt=""
        className="w-24 h-24 rounded-3xl object-cover ring-4 ring-white shadow-card"
      />
    );
  }
  return (
    <div className="w-24 h-24 rounded-3xl bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold ring-4 ring-white shadow-card">
      {initials(user?.first_name, user?.last_name)}
    </div>
  );
}

export default function ProfileHeader({
  user,
  isOwn,
  topTags,
  friendshipStatus,
  friendshipId,
  setProfile,
}) {
  const navigate = useNavigate();
  const [friendAction, setFriendAction] = useState(false);
  const id = user.user_id;

  const handleAddFriend = async () => {
    setFriendAction(true);
    try {
      await api.post(`/api/friendships/${id}`);
      setProfile((p) => ({ ...p, friendshipStatus: "pending" }));
      toast.success("Cerere de prietenie trimisă!");
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Eroare.");
    } finally {
      setFriendAction(false);
    }
  };

  const handleAcceptFriend = async () => {
    if (!friendshipId) return;
    setFriendAction(true);
    try {
      await api.put(`/api/friendships/${friendshipId}/accept`);
      setProfile((p) => ({ ...p, friendshipStatus: "accepted" }));
      toast.success("Cerere de prietenie acceptată!");
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Eroare.");
    } finally {
      setFriendAction(false);
    }
  };

  const handleRejectFriend = async () => {
    if (!friendshipId) return;
    setFriendAction(true);
    try {
      await api.put(`/api/friendships/${friendshipId}/reject`);
      setProfile((p) => ({ ...p, friendshipStatus: null, friendshipId: null }));
      toast.success("Cerere respinsă.");
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Eroare.");
    } finally {
      setFriendAction(false);
    }
  };

  const handleUnfriend = async () => {
    if (!friendshipId) return;
    setFriendAction(true);
    try {
      await api.delete(`/api/friendships/${friendshipId}`);
      setProfile((p) => ({ ...p, friendshipStatus: null, friendshipId: null }));
      toast.success("Prieten șters.");
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Eroare.");
    } finally {
      setFriendAction(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-end gap-4 mb-4">
        <Avatar user={user} />
        <div className="flex-1 min-w-0 pb-1">
          <h1 className="font-display font-bold text-2xl text-text-primary leading-tight">
            {user.first_name} {user.last_name}
          </h1>
          <p className="text-text-muted text-sm">@{user.username}</p>
          <p className="text-xs text-text-muted mt-1">
            Membru din {formatDate(user.creation_date, "MMM yyyy")}
          </p>
        </div>
      </div>

      {user.bio && (
        <p className="text-sm text-text-primary leading-relaxed mb-4">
          {user.bio}
        </p>
      )}

      {topTags.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {topTags.map((t) => (
            <span
              key={t.name}
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: t.color + "18", color: t.color }}
            >
              {t.name}
            </span>
          ))}
        </div>
      )}

      {isOwn ? (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => navigate("/settings")}
          >
            <span className="inline-flex items-center gap-1.5">
              <Pencil size={14} /> Editează profilul
            </span>
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          {friendshipStatus === "accepted" ? (
            <Button
              variant="danger"
              size="sm"
              className="flex-1"
              onClick={handleUnfriend}
              disabled={friendAction}
            >
              Șterge prieten
            </Button>
          ) : friendshipStatus === "pending_incoming" ? (
            <>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleAcceptFriend}
                disabled={friendAction}
              >
                Acceptă cererea
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="flex-1"
                onClick={handleRejectFriend}
                disabled={friendAction}
              >
                Respinge cererea
              </Button>
            </>
          ) : friendshipStatus === "pending" ? (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 flex items-center justify-center gap-1.5"
              disabled
            >
              <Hourglass size={14} /> Cerere trimisă
            </Button>
          ) : (
            <Button
              size="sm"
              className="flex-1 flex items-center justify-center gap-1.5"
              onClick={handleAddFriend}
              disabled={friendAction}
            >
              <UserPlus size={14} /> Adaugă prieten
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="flex-1 flex items-center justify-center gap-1.5"
            onClick={() =>
              navigate("/chat", {
                state: {
                  openDm: {
                    user_id: user.user_id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    username: user.username,
                    avatar_url: user.avatar_url ?? null,
                  },
                },
              })
            }
          >
            <MessageCircle size={14} /> Mesaj
          </Button>
        </div>
      )}
    </div>
  );
}
