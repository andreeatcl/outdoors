import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import api from "../../services/api";
import { initials, resolveAvatarUrl } from "../../utils/formatters";
import { profilePath } from "../../constants/ROUTES";

const STARTS_WITH_PAGE = 5;

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

function UserRow({ user, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-background transition-colors text-left"
    >
      <Avatar user={user} />
      <div className="min-w-0">
        <p className="font-semibold text-sm text-text-primary truncate">
          {user.first_name} {user.last_name}
        </p>
        <p className="text-xs text-text-muted">@{user.username}</p>
      </div>
    </button>
  );
}

export default function UserSearchModal({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAllStarts, setShowAllStarts] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setShowAllStarts(false);
    }
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      api
        .get(`/api/users/search?q=${encodeURIComponent(q)}`)
        .then(({ data }) => setResults(data.users))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const goToProfile = (userId) => {
    navigate(profilePath(userId));
    onClose();
  };

  const q = query.trim().toLowerCase();
  const startsWith = results.filter((u) =>
    u.username.toLowerCase().startsWith(q),
  );
  const contains = results.filter(
    (u) => !u.username.toLowerCase().startsWith(q),
  );
  const shownStartsWith = showAllStarts
    ? startsWith
    : startsWith.slice(0, STARTS_WITH_PAGE);

  return (
    <Modal open={open} onClose={onClose} title="Caută utilizatori" size="md">
      <div className="p-4 flex flex-col gap-3">
        <Input
          autoFocus
          placeholder="Caută după username sau nume..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {loading && (
          <p className="text-sm text-text-muted text-center py-4">Se caută…</p>
        )}

        {!loading && q.length >= 2 && results.length === 0 && (
          <p className="text-sm text-text-muted text-center py-4">
            Niciun utilizator găsit.
          </p>
        )}

        {!loading && startsWith.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1 px-2">
              Username începe cu „{q}”
            </p>
            <div className="flex flex-col">
              {shownStartsWith.map((u) => (
                <UserRow
                  key={u.user_id}
                  user={u}
                  onClick={() => goToProfile(u.user_id)}
                />
              ))}
            </div>
            {!showAllStarts && startsWith.length > STARTS_WITH_PAGE && (
              <button
                onClick={() => setShowAllStarts(true)}
                className="text-xs font-semibold text-primary hover:underline px-2 mt-1"
              >
                Arată mai multe ({startsWith.length - STARTS_WITH_PAGE})
              </button>
            )}
          </div>
        )}

        {!loading && contains.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1 px-2">
              Rezultate similare
            </p>
            <div className="flex flex-col">
              {contains.map((u) => (
                <UserRow
                  key={u.user_id}
                  user={u}
                  onClick={() => goToProfile(u.user_id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
