import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, UserX } from "lucide-react";
import Modal from "../ui/Modal";
import { initials, resolveAvatarUrl } from "../../utils/formatters";
import { profilePath } from "../../constants/ROUTES";

const PAGE_SIZE = 10;

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

export default function FriendsModal({
  open,
  onClose,
  friends,
  title = "Prieteni",
  isOrganizer = false,
  organizerId,
  onRemove,
}) {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [confirmingId, setConfirmingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    if (!open) {
      setPage(0);
      setConfirmingId(null);
    }
  }, [open]);

  const totalPages = Math.ceil((friends?.length || 0) / PAGE_SIZE);
  const shown = (friends || []).slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  );

  const goToProfile = (userId) => {
    navigate(profilePath(userId));
    onClose();
  };

  const handleRemove = async (userId) => {
    setRemovingId(userId);
    try {
      await onRemove?.(userId);
    } finally {
      setRemovingId(null);
      setConfirmingId(null);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${title} (${friends?.length || 0})`}
      size="md"
    >
      <div className="p-4 flex flex-col gap-1">
        {shown.map((friend) => {
          const canRemove = isOrganizer && friend.user_id !== organizerId;
          const isConfirming = confirmingId === friend.user_id;
          const isRemoving = removingId === friend.user_id;
          return (
            <div
              key={friend.user_id}
              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-background transition-colors"
            >
              <button
                onClick={() => goToProfile(friend.user_id)}
                className="flex-1 min-w-0 flex items-center gap-3 text-left"
              >
                <Avatar user={friend} />
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-text-primary truncate">
                    {friend.first_name} {friend.last_name}
                  </p>
                  <p className="text-xs text-text-muted">@{friend.username}</p>
                </div>
              </button>
              {canRemove &&
                (isConfirming ? (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleRemove(friend.user_id)}
                      disabled={isRemoving}
                      className="text-xs font-semibold text-red-600 hover:underline px-1.5 disabled:opacity-50"
                    >
                      {isRemoving ? "…" : "Confirmă"}
                    </button>
                    <button
                      onClick={() => setConfirmingId(null)}
                      disabled={isRemoving}
                      className="text-xs text-text-muted hover:underline px-1.5"
                    >
                      Anulează
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmingId(friend.user_id)}
                    title="Elimină participant"
                    className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                  >
                    <UserX size={16} />
                  </button>
                ))}
            </div>
          );
        })}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-border">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="text-xs font-semibold text-primary hover:underline px-2 disabled:opacity-30 disabled:hover:no-underline flex items-center gap-1"
            >
              <ArrowLeft size={12} /> Înapoi
            </button>
            <span className="text-xs text-text-muted">
              Pagina {page + 1} din {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="text-xs font-semibold text-primary hover:underline px-2 disabled:opacity-30 disabled:hover:no-underline flex items-center gap-1"
            >
              Înainte <ArrowRight size={12} />
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
