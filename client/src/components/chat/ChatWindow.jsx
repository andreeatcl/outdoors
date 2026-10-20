import { useState, useRef, useEffect, useLayoutEffect, Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import { isSameDay } from "date-fns";
import { MessageCircle, ArrowUp } from "lucide-react";
import {
  setMessages,
  prependOlderMessages,
  receiveMessage,
  updateConversationStatus,
} from "../../store/chatSlice";
import { markConversationRead } from "../../store/notificationsSlice";
import MessageBubble from "./MessageBubble";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import api from "../../services/api";
import { getSocket, joinRoom, leaveRoom } from "../../services/socket";
import { formatDate } from "../../utils/formatters";

export default function ChatWindow({ onEventClick }) {
  const dispatch = useDispatch();
  const { conversations, messages, hasMoreOlder, activeConversation } =
    useSelector((s) => s.chat);
  const currentUser = useSelector((s) => s.auth.user);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);
  const isPrependRef = useRef(false);
  const prevScrollHeightRef = useRef(null);

  const conv = conversations.find((c) => c.id === activeConversation);
  const msgs = messages[activeConversation] ?? [];
  const isGroup = conv?.type === "event";
  const isFinished = isGroup && conv?.event?.status === "finished";
  const isFormerParticipant = isGroup && conv?.isFormerParticipant;
  const isChatLeft = isGroup && conv?.isChatLeft;
  const isFormerFriend = !isGroup && conv?.isFormerFriend;

  useEffect(() => {
    if (!activeConversation || !conv) return;
    if (messages[activeConversation]) return;

    setLoading(true);
    const url =
      conv.type === "dm"
        ? `/api/messages/dm/${conv.with?.user_id}`
        : `/api/messages/event/${conv.event?.event_id}`;

    api
      .get(url)
      .then(({ data }) =>
        dispatch(
          setMessages({
            convId: activeConversation,
            messages: data.messages,
            hasMore: data.hasMore,
          }),
        ),
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeConversation, conv, dispatch]);

  const handleLoadOlder = async () => {
    if (!msgs.length || loadingOlder) return;
    setLoadingOlder(true);
    const oldest = msgs[0];
    const el = scrollRef.current;
    isPrependRef.current = true;
    prevScrollHeightRef.current = el?.scrollHeight ?? 0;

    const url =
      conv.type === "dm"
        ? `/api/messages/dm/${conv.with?.user_id}`
        : `/api/messages/event/${conv.event?.event_id}`;

    try {
      const { data } = await api.get(url, {
        params: { before: oldest.created_at },
      });
      dispatch(
        prependOlderMessages({
          convId: activeConversation,
          messages: data.messages,
          hasMore: data.hasMore,
        }),
      );
    } catch {
      isPrependRef.current = false;
    } finally {
      setLoadingOlder(false);
    }
  };

  useEffect(() => {
    if (!activeConversation) return;
    joinRoom(activeConversation);
    return () => leaveRoom(activeConversation);
  }, [activeConversation]);

  // mark message notifs as read when chat is opened
  useEffect(() => {
    if (!activeConversation || !conv) return;
    const params =
      conv.type === "dm"
        ? { type: "dm_message", refId: conv.with?.user_id, refType: "dm" }
        : {
            type: "event_message",
            refId: conv.event?.event_id,
            refType: "event_chat",
          };
    if (params.refId == null) return;

    dispatch(markConversationRead(params));
    api.put("/api/notifications/read-conversation", params).catch(() => {});
  }, [activeConversation, conv, dispatch]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onReceive = ({ roomId, message, statusUpdate }) => {
      dispatch(receiveMessage({ convId: roomId, message }));
      if (statusUpdate)
        dispatch(
          updateConversationStatus({ convId: roomId, updates: statusUpdate }),
        );
    };
    const onError = ({ error: msg }) => {
      setError(msg);
      setTimeout(() => setError(null), 4000);
    };

    socket.on("receive_message", onReceive);
    socket.on("message_error", onError);
    return () => {
      socket.off("receive_message", onReceive);
      socket.off("message_error", onError);
    };
  }, [dispatch]);

  useLayoutEffect(() => {
    if (isPrependRef.current) {
      const el = scrollRef.current;
      if (el && prevScrollHeightRef.current != null) {
        el.scrollTop = el.scrollHeight - prevScrollHeightRef.current;
      }
      isPrependRef.current = false;
      prevScrollHeightRef.current = null;
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-text-muted">
        <MessageCircle size={48} />
        <p className="text-sm">Selectează o conversație</p>
      </div>
    );
  }

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        conv={conv}
        activeConversation={activeConversation}
        isGroup={isGroup}
        isFinished={isFinished}
        isFormerParticipant={isFormerParticipant}
        isChatLeft={isChatLeft}
        onEventClick={onEventClick}
        onError={showError}
      />

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3"
      >
        {loading ? (
          <p className="text-center text-text-muted text-sm py-8">
            Se încarcă mesajele…
          </p>
        ) : msgs.length === 0 ? (
          <p className="text-center text-text-muted text-sm py-8">
            Niciun mesaj încă. Fii primul care scrie!
          </p>
        ) : (
          <>
            {hasMoreOlder?.[activeConversation] && (
              <button
                onClick={handleLoadOlder}
                disabled={loadingOlder}
                className="mx-auto px-3 py-1.5 rounded-full text-xs font-semibold text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {loadingOlder ? (
                  "Se încarcă…"
                ) : (
                  <>
                    <ArrowUp size={12} /> Mesaje mai vechi
                  </>
                )}
              </button>
            )}
            {msgs.map((msg, idx) => {
              const prevMsg = msgs[idx - 1];
              const showDateSeparator =
                !prevMsg ||
                !isSameDay(
                  new Date(prevMsg.created_at),
                  new Date(msg.created_at),
                );
              return (
                <Fragment key={msg.message_id}>
                  {showDateSeparator && (
                    <div className="flex justify-center my-1">
                      <span className="text-[11px] text-text-muted bg-border/40 px-3 py-1 rounded-full">
                        {formatDate(msg.created_at, "d MMMM yyyy")}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={msg}
                    isMine={msg.sender_id === currentUser?.user_id}
                    sender={
                      isGroup && msg.sender_id !== currentUser?.user_id
                        ? msg.sender
                        : null
                    }
                  />
                </Fragment>
              );
            })}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mx-4 mb-1 px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs text-center">
          {error}
        </div>
      )}

      <ChatInput
        conv={conv}
        activeConversation={activeConversation}
        isFormerParticipant={isFormerParticipant}
        isChatLeft={isChatLeft}
        isFormerFriend={isFormerFriend}
      />
    </div>
  );
}
