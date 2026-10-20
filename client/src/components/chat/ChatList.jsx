import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MessageCircle, Users } from "lucide-react";
import {
  setConversations,
  setActiveConversation,
  clearMessages,
} from "../../store/chatSlice";
import { truncate, timeFromNow } from "../../utils/formatters";
import { joinRoom, leaveRoom } from "../../services/socket";
import api from "../../services/api";

function Avatar({ name, size = 10 }) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0`}
    >
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

const PAGE_SIZE = 10;

export default function ChatList({ onSelect, openDmWith }) {
  const dispatch = useDispatch();
  const currentUser = useSelector((s) => s.auth.user);
  const { conversations: rawConversations, activeConversation } = useSelector(
    (s) => s.chat,
  );
  const [filter, setFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    dispatch(clearMessages());
    const previousUnread = new Map(
      rawConversations.map((c) => [c.id, c.unread ?? 0]),
    );
    api
      .get("/api/messages/conversations")
      .then(({ data }) => {
        const convs = data.conversations.map((c) => {
          if (c.type === "dm") {
            const id = `dm_${Math.min(currentUser.user_id, c.userId)}_${Math.max(currentUser.user_id, c.userId)}`;
            return {
              id,
              type: "dm",
              isFormerFriend: c.isFormerFriend ?? false,
              with: c.user,
              last_message: {
                content: c.lastMessage ?? "",
                created_at: c.lastMessageAt,
                sender_id: c.lastSenderId,
              },
              unread: previousUnread.get(id) ?? 0,
            };
          }
          const id = `event_${c.eventId}`;
          return {
            id,
            type: "event",
            isFormerParticipant: c.isFormerParticipant ?? false,
            isChatLeft: c.isChatLeft ?? false,
            event: {
              event_id: c.eventId,
              title: `Eveniment #${c.eventId}`,
              ...c.event,
            },
            last_message: {
              content: c.lastMessage ?? "",
              created_at: c.lastMessageAt,
              sender_id: c.lastSender?.user_id,
              sender_name: c.lastSender?.first_name,
            },
            unread: previousUnread.get(id) ?? 0,
          };
        });

        if (openDmWith && currentUser) {
          const dmId = `dm_${Math.min(currentUser.user_id, openDmWith.user_id)}_${Math.max(currentUser.user_id, openDmWith.user_id)}`;
          if (!convs.find((c) => c.id === dmId)) {
            convs.unshift({
              id: dmId,
              type: "dm",
              with: openDmWith,
              last_message: { content: "", created_at: null },
              unread: 0,
            });
          }
          dispatch(setConversations(convs));
          dispatch(setActiveConversation(dmId));
          onSelect?.();
        } else {
          dispatch(setConversations(convs));
        }
      })
      .catch(() => {});
  }, [dispatch]);

  const convWeight = (c) => {
    if (c.type !== "event") return 1;
    return c.event?.status === "finished" ? 2 : 0;
  };

  const sortedConversations = [...rawConversations].sort((a, b) => {
    const wa = convWeight(a);
    const wb = convWeight(b);
    if (wa !== wb) return wa - wb;
    const ta = a.last_message?.created_at
      ? new Date(a.last_message.created_at).getTime()
      : 0;
    const tb = b.last_message?.created_at
      ? new Date(b.last_message.created_at).getTime()
      : 0;
    return tb - ta;
  });

  const filteredConversations = sortedConversations.filter((c) => {
    if (filter === "dm") return c.type === "dm";
    if (filter === "event") return c.type === "event";
    return true;
  });

  const conversations = filteredConversations.slice(0, visibleCount);
  const hasMore = filteredConversations.length > visibleCount;

  // join the socket rooms of all convos in the shown list
  // to update unread badges & previews
  const visibleIdsKey = conversations.map((c) => c.id).join(",");
  useEffect(() => {
    const ids = visibleIdsKey ? visibleIdsKey.split(",") : [];
    ids.forEach((id) => joinRoom(id));
    return () => ids.forEach((id) => leaveRoom(id));
  }, [visibleIdsKey]);

  const handleFilterChange = (next) => {
    setFilter(next);
    setVisibleCount(PAGE_SIZE);
  };

  const handleSelect = (convId) => {
    dispatch(setActiveConversation(convId));
    onSelect?.();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4 border-b border-border">
        <h2 className="font-display font-bold text-lg text-text-primary mb-3">
          Mesaje
        </h2>
        <div className="flex items-center gap-2">
          {[
            { key: "all", label: "Toate" },
            { key: "dm", label: "Prieteni" },
            { key: "event", label: "Grupuri" },
          ].map((pill) => (
            <button
              key={pill.key}
              onClick={() => handleFilterChange(pill.key)}
              className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                filter === pill.key
                  ? "bg-primary text-white"
                  : "bg-background text-text-muted hover:bg-border/40"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-text-muted px-4">
            <MessageCircle size={40} />
            <p className="text-sm">Nicio conversație încă.</p>
          </div>
        ) : (
          conversations.map((conv, index) => {
            const isActive = activeConversation === conv.id;
            const name =
              conv.type === "dm"
                ? `${conv.with?.first_name ?? ""} ${conv.with?.last_name ?? ""}`
                : (conv.event?.title ?? "");
            const group = convWeight(conv);
            const prevGroup =
              index > 0 ? convWeight(conversations[index - 1]) : null;
            const showSectionLabel =
              (filter === "all" || filter === "event") && group !== prevGroup;
            const lastSenderId = conv.last_message?.sender_id;
            const lastSenderName =
              lastSenderId == null
                ? null
                : lastSenderId === currentUser?.user_id
                  ? "Tu"
                  : conv.type === "dm"
                    ? conv.with?.first_name
                    : conv.last_message?.sender_name;
            return (
              <div key={conv.id}>
                {showSectionLabel && (
                  <p
                    className={`px-4 pb-1 text-[11px] font-semibold text-text-muted uppercase tracking-wide ${index === 0 ? "pt-3" : "pt-4"}`}
                  >
                    {group === 0
                      ? "Evenimente în curs"
                      : group === 1
                        ? "Mesaje private"
                        : "Evenimente finalizate"}
                  </p>
                )}
                <button
                  onClick={() => handleSelect(conv.id)}
                  className={`w-full px-4 py-3.5 flex items-center gap-3 hover:bg-background transition-colors text-left border-b border-border/40
                  ${isActive ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                >
                  <div className="relative">
                    {conv.type === "event" ? (
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <Users size={18} />
                      </div>
                    ) : (
                      <Avatar name={conv.with?.first_name} size={10} />
                    )}
                    {conv.unread > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {conv.unread > 9 ? "9+" : conv.unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1">
                      <p
                        className={`text-sm font-semibold truncate ${isActive ? "text-primary" : "text-text-primary"}`}
                      >
                        {name}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {conv.type === "event" &&
                          conv.event?.status === "finished" && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-border/60 text-text-muted font-medium">
                              finalizat
                            </span>
                          )}
                        {conv.last_message?.created_at && (
                          <span className="text-[11px] text-text-muted">
                            {timeFromNow(conv.last_message.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    <p
                      className={`text-xs truncate mt-0.5 ${conv.unread > 0 ? "text-text-primary font-medium" : "text-text-muted"}`}
                    >
                      {lastSenderName && `${lastSenderName}: `}
                      {truncate(conv.last_message?.content ?? "", 40)}
                    </p>
                    <p className="text-[11px] text-text-muted mt-0.5 flex items-center gap-1">
                      {conv.type === "event" ? (
                        <>
                          <Users size={10} /> Grup eveniment
                        </>
                      ) : (
                        `@${conv.with?.username ?? ""}`
                      )}
                    </p>
                  </div>
                </button>
              </div>
            );
          })
        )}
        {hasMore && (
          <div className="px-4 py-3 flex justify-center">
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Arată mai multe conversații
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
