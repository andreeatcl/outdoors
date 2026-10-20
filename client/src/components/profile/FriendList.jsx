import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { initials, resolveAvatarUrl } from "../../utils/formatters";
import { profilePath } from "../../constants/ROUTES";
import FriendsModal from "./FriendsModal";

const PREVIEW_COUNT = 4;

function Avatar({ user }) {
  if (user.avatar_url) {
    return (
      <img
        src={resolveAvatarUrl(user.avatar_url)}
        alt={user.username}
        className="w-12 h-12 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
      {initials(user.first_name, user.last_name)}
    </div>
  );
}

export default function FriendList({ friends }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const preview = friends?.slice(0, PREVIEW_COUNT) ?? [];

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-base text-text-primary">
          Prieteni ({friends?.length ?? 0})
        </h2>
        {friends?.length > PREVIEW_COUNT && (
          <button
            onClick={() => setShowModal(true)}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Vezi lista ({friends.length})
          </button>
        )}
      </div>

      {!friends?.length ? (
        <p className="text-sm text-text-muted text-center py-6">
          Niciun prieten adăugat încă.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {preview.map((friend) => (
            <button
              key={friend.user_id}
              onClick={() => navigate(profilePath(friend.user_id))}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-background transition-colors text-left"
            >
              <Avatar user={friend} />
              <div className="min-w-0">
                <p className="font-semibold text-sm text-text-primary">
                  {friend.first_name} {friend.last_name}
                </p>
                <p className="text-xs text-text-muted">@{friend.username}</p>
                {friend.bio && (
                  <p className="text-xs text-text-muted mt-0.5 truncate">
                    {friend.bio}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <FriendsModal
        open={showModal}
        onClose={() => setShowModal(false)}
        friends={friends}
      />
    </>
  );
}
