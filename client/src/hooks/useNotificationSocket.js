import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { createElement } from "react";
import { Bell } from "lucide-react";
import { addNotification } from "../store/notificationsSlice";
import { connectSocket, disconnectSocket } from "../services/socket";
import { formatNotificationContent } from "../utils/formatters";
import { NOTIFICATION_TYPE_META } from "../constants/notificationTypes";

const URGENT_TYPES = new Set(["event_schedule_changed", "event_cancelled"]);
const MESSAGE_TYPES = new Set(["dm_message", "event_message"]);

// notification socket for the entire app. connect on login and disconnect on logout
// listen for new notifications in the meantime
export default function useNotificationSocket({ isLoggedIn, token }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const pathnameRef = useRef(location.pathname);

  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (!isLoggedIn || !token) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket(token);

    const onNotification = (data) => {
      if (!data?.notification) return;
      dispatch(addNotification(data.notification));

      if (MESSAGE_TYPES.has(data.type) && pathnameRef.current === "/chat") {
        return;
      }

      const meta = NOTIFICATION_TYPE_META[data.type];
      const message = formatNotificationContent(data.notification.content);
      const isUrgent = URGENT_TYPES.has(data.type);
      const isCelebratory = data.type === "achievement_milestone";

      toast(message, {
        icon: createElement(meta?.icon ?? Bell, { size: 18 }),
        duration: isUrgent ? 6000 : 4000,
        style: isUrgent
          ? { border: "1px solid #FCA5A5", background: "#FEF2F2" }
          : isCelebratory
            ? { border: "1px solid #FDE68A", background: "#FFFBEB" }
            : undefined,
      });
    };

    socket.on("new_notification", onNotification);
    return () => socket.off("new_notification", onNotification);
  }, [isLoggedIn, token, dispatch]);
}
