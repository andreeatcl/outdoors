import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ChatList from "../components/chat/ChatList";
import ChatWindow from "../components/chat/ChatWindow";
import EventDetailsModal from "../components/events/EventDetailsModal";
import { setSelected, clearSelected } from "../store/eventsSlice";
import api from "../services/api";

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [showList, setShowList] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const activeConv = useSelector((s) => s.chat.activeConversation);
  const openDmWith = location.state?.openDm ?? null;

  const handleEventClick = async (eventId) => {
    try {
      const { data } = await api.get(`/api/events/${eventId}`);
      dispatch(setSelected(data.event));
      setDetailsOpen(true);
    } catch {}
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface shadow-sm flex-shrink-0">
        <button
          onClick={() => navigate("/home")}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-background text-text-muted transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="Outdoors" className="w-7 h-7" />
          <span className="font-display font-bold text-text-primary">Chat</span>
        </div>

        {activeConv && (
          <button
            className="ml-auto sm:hidden px-3 py-1.5 text-xs bg-background rounded-xl border border-border text-text-muted flex items-center gap-1"
            onClick={() => setShowList(!showList)}
          >
            {showList ? (
              <>
                Chat <ArrowRight size={12} />
              </>
            ) : (
              <>
                <ArrowLeft size={12} /> Liste
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div
          className={`w-full sm:w-80 border-r border-border flex-shrink-0 overflow-hidden
            ${activeConv && !showList ? "hidden sm:flex" : "flex"} flex-col`}
        >
          <ChatList
            onSelect={() => setShowList(false)}
            openDmWith={openDmWith}
          />
        </div>

        <div
          className={`flex-1 overflow-hidden
            ${!activeConv || showList ? "hidden sm:flex" : "flex"} flex-col`}
        >
          <ChatWindow onEventClick={handleEventClick} />
        </div>
      </div>

      <EventDetailsModal
        open={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          dispatch(clearSelected());
        }}
      />
    </div>
  );
}
