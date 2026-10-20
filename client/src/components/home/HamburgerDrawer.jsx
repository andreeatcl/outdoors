import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  UserRound,
  Search,
  MessageCircle,
  Bell,
  Calendar,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  ShieldCheck,
} from "lucide-react";
import { logout } from "../../store/authSlice";
import { initials, resolveAvatarUrl } from "../../utils/formatters";
import { profilePath } from "../../constants/ROUTES";

function Avatar({ user, size = 9 }) {
  const s = `w-${size} h-${size}`;
  if (user?.avatar_url)
    return (
      <img
        src={resolveAvatarUrl(user.avatar_url)}
        alt=""
        className={`${s} rounded-full object-cover`}
      />
    );
  return (
    <div
      className={`${s} rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm`}
    >
      {initials(user?.first_name, user?.last_name)}
    </div>
  );
}

export default function HamburgerDrawer({ open, onClose, onSearchOpen }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuth } = useSelector((s) => ({
    user: s.auth.user,
    isAuth: s.auth.isLoggedIn && !s.auth.isGuest,
  }));
  const unread = useSelector((s) => s.notifications.unread);

  const go = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
    onClose();
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[1500] bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-surface shadow-modal z-[1600] flex flex-col
          transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="px-5 pt-safe pt-6 pb-5 border-b border-border bg-background">
          {isAuth && user ? (
            <div className="flex items-center gap-3">
              <Avatar user={user} size={12} />
              <div>
                <p className="font-semibold text-text-primary">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-sm text-text-muted">@{user.username}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-border flex items-center justify-center text-text-muted">
                <UserRound size={22} />
              </div>
              <div>
                <p className="font-semibold text-text-primary">Vizitator</p>
                <p className="text-xs text-text-muted">
                  Conectează-te pentru mai mult
                </p>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {isAuth ? (
            <>
              <DrawerItem
                icon={UserRound}
                label="Profil"
                onClick={() => go(profilePath(user.user_id))}
              />
              <DrawerItem
                icon={Search}
                label="Caută utilizatori"
                onClick={() => {
                  onSearchOpen();
                  onClose();
                }}
              />
              <DrawerItem
                icon={MessageCircle}
                label="Conversații"
                onClick={() => go("/chat")}
              />
              <DrawerItem
                icon={Bell}
                label="Notificări"
                badge={unread}
                onClick={() => go("/notifications")}
              />
              <DrawerItem
                icon={Calendar}
                label="Evenimentele mele"
                onClick={() => go("/my-events")}
              />
              {user.role === "admin" && (
                <DrawerItem
                  icon={ShieldCheck}
                  label="Panou admin"
                  onClick={() => go("/admin")}
                />
              )}
              <hr className="my-2 border-border mx-4" />
              <DrawerItem
                icon={Settings}
                label="Setări"
                onClick={() => go("/settings")}
              />
              <DrawerItem
                icon={LogOut}
                label="Deconectare"
                onClick={handleLogout}
                danger
              />
            </>
          ) : (
            <>
              <DrawerItem
                icon={LogIn}
                label="Conectare"
                onClick={() => go("/login")}
              />
              <DrawerItem
                icon={UserPlus}
                label="Înregistrare"
                onClick={() => go("/register")}
              />
            </>
          )}
        </nav>
      </div>
    </>
  );
}

function DrawerItem({ icon: Icon, label, badge, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-5 py-3 hover:bg-background transition-colors text-left
        ${danger ? "text-red-500" : "text-text-primary"}`}
    >
      <span className="w-6 flex items-center justify-center">
        <Icon size={18} />
      </span>
      <span className="flex-1 font-medium text-sm">{label}</span>
      {badge > 0 && (
        <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}
