import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { ArrowLeft, Settings } from "lucide-react";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileCharts from "../components/profile/ProfileCharts";
import ProfileStats from "../components/profile/ProfileStats";
import FriendRequests from "../components/profile/FriendRequests";
import FriendList from "../components/profile/FriendList";
import FriendsModal from "../components/profile/FriendsModal";
import PastEvents from "../components/profile/PastEvents";
import PastEventsModal from "../components/profile/PastEventsModal";
import CreatedEventsMap from "../components/profile/CreatedEventsMap";
import EventDetailsModal from "../components/events/EventDetailsModal";
import api from "../services/api";
import { setSelected } from "../store/eventsSlice";
import { formatDate } from "../utils/formatters";

const TYPE_COLORS = {
  fotbal: "#F97316",
  jogging: "#3B82F6",
  hiking: "#22C55E",
  baschet: "#A855F7",
  tenis: "#EF4444",
  ciclism: "#EAB308",
  volei: "#06B6D4",
  picnic: "#EC4899",
  skateboarding: "#8B5CF6",
  socializare: "#14B8A6",
  board_games: "#F59E0B",
  altele: "#78716C",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const currentUser = useSelector((s) => s.auth.user);
  const isOwn = currentUser?.user_id === Number(id);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsEventsModal, setStatsEventsModal] = useState(null);
  const [statsFriendsModalOpen, setStatsFriendsModalOpen] = useState(false);
  const [statsDetailsOpen, setStatsDetailsOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/api/users/${id}`)
      .then(({ data }) => setProfile(data))
      .catch(() => toast.error("Nu s-a putut încărca profilul."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-muted">
        Se încarcă profilul…
      </div>
    );
  }

  if (!profile?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-muted">
        Utilizatorul nu a fost găsit.
      </div>
    );
  }

  const {
    user,
    stats,
    activityDistribution,
    activityTimeline,
    friends,
    pastEvents,
    createdEventLocations,
    friendshipStatus,
    friendshipId,
  } = profile;

  const pieData = activityDistribution.map((d) => ({
    name: d.type,
    value: d.count,
    color: TYPE_COLORS[d.type] ?? "#78716C",
  }));

  const topTags = pieData.sort((a, b) => b.value - a.value).slice(0, 3);

  const timelineData = (activityTimeline ?? []).map((w) => ({
    ...w,
    label: `${formatDate(w.weekStart, "d MMM")} - ${formatDate(w.weekEnd, "d MMM")}`,
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-surface/90 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-background text-text-muted"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="font-display font-bold text-text-primary">Profil</span>
        {isOwn && (
          <button
            onClick={() => navigate("/settings")}
            className="ml-auto p-2 rounded-xl hover:bg-background text-text-muted"
          >
            <Settings size={18} />
          </button>
        )}
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 flex flex-col gap-6">
        <ProfileHeader
          user={user}
          isOwn={isOwn}
          topTags={topTags}
          friendshipStatus={friendshipStatus}
          friendshipId={friendshipId}
          setProfile={setProfile}
        />

        {isOwn && (
          <FriendRequests
            onAccepted={() =>
              setProfile((p) => ({
                ...p,
                stats: { ...p.stats, friends_count: p.stats.friends_count + 1 },
              }))
            }
          />
        )}

        <ProfileStats
          stats={stats}
          onTotalClick={() => setStatsEventsModal("all")}
          onCreatedClick={() => setStatsEventsModal("organizer")}
          onFriendsClick={() => setStatsFriendsModalOpen(true)}
        />

        <ProfileCharts pieData={pieData} timelineData={timelineData} />

        <CreatedEventsMap
          events={createdEventLocations}
          onEventClick={(ev) => {
            dispatch(setSelected(ev));
            setStatsDetailsOpen(true);
          }}
        />

        {friends?.length > 0 && (
          <div className="card p-5">
            <FriendList friends={friends} />
          </div>
        )}

        {pastEvents?.length > 0 && <PastEvents events={pastEvents} />}

        <div className="h-6" />
      </div>

      <PastEventsModal
        open={statsEventsModal !== null}
        onClose={() => setStatsEventsModal(null)}
        events={pastEvents}
        initialFilter={statsEventsModal ?? "all"}
        onEventClick={(ev) => {
          dispatch(setSelected(ev));
          setStatsDetailsOpen(true);
          setStatsEventsModal(null);
        }}
      />
      <FriendsModal
        open={statsFriendsModalOpen}
        onClose={() => setStatsFriendsModalOpen(false)}
        friends={friends}
      />
      <EventDetailsModal
        open={statsDetailsOpen}
        onClose={() => setStatsDetailsOpen(false)}
      />
    </div>
  );
}
