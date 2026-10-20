import {
  UserRound,
  UserCheck,
  MessageCircle,
  UserPlus,
  MapPin,
  PartyPopper,
  AlertTriangle,
  Pencil,
  Ban,
  Hourglass,
  CircleDot,
  Flag,
  Trophy,
} from "lucide-react";

export const NOTIFICATION_TYPE_META = {
  friend_request: {
    icon: UserRound,
    label: "Cerere de prietenie",
    bg: "bg-blue-100 text-blue-600",
  },
  friend_accepted: {
    icon: UserCheck,
    label: "Cerere acceptată",
    bg: "bg-purple-100 text-purple-600",
  },
  dm_message: {
    icon: MessageCircle,
    label: "Mesaj privat",
    bg: "bg-primary/10 text-primary",
  },
  event_message: {
    icon: MessageCircle,
    label: "Mesaj în grup",
    bg: "bg-primary/10 text-primary",
  },
  event_join: {
    icon: UserPlus,
    label: "Participare nouă",
    bg: "bg-green-100 text-green-600",
  },
  event_checkin: {
    icon: MapPin,
    label: "Check-in",
    bg: "bg-green-100 text-green-600",
  },
  event_full: {
    icon: PartyPopper,
    label: "Eveniment complet",
    bg: "bg-green-100 text-green-600",
  },
  event_schedule_changed: {
    icon: AlertTriangle,
    label: "Program schimbat",
    bg: "bg-red-100 text-red-600",
  },
  event_details_changed: {
    icon: Pencil,
    label: "Detalii actualizate",
    bg: "bg-blue-100 text-blue-600",
  },
  event_cancelled: {
    icon: Ban,
    label: "Eveniment anulat",
    bg: "bg-red-100 text-red-600",
  },
  event_removed: {
    icon: Ban,
    label: "Eliminat din eveniment",
    bg: "bg-red-100 text-red-600",
  },
  event_starting_soon: {
    icon: Hourglass,
    label: "Începe curând",
    bg: "bg-yellow-100 text-yellow-700",
  },
  checkin_open: {
    icon: CircleDot,
    label: "Check-in deschis",
    bg: "bg-green-100 text-green-600",
  },
  event_started: {
    icon: Flag,
    label: "A început",
    bg: "bg-green-100 text-green-600",
  },
  achievement_milestone: {
    icon: Trophy,
    label: "Realizare",
    bg: "bg-yellow-100 text-yellow-700",
  },
};

export const NOTIFICATION_CATEGORIES = {
  messages: { label: "Mesaje", types: ["dm_message", "event_message"] },
  friendships: {
    label: "Prietenii",
    types: ["friend_request", "friend_accepted"],
  },
  achievements: { label: "Realizări", types: ["achievement_milestone"] },
  participations: {
    label: "Participări",
    types: [
      "event_join",
      "event_checkin",
      "event_schedule_changed",
      "event_details_changed",
      "event_cancelled",
      "event_removed",
      "event_full",
      "event_starting_soon",
      "checkin_open",
      "event_started",
    ],
  },
};

export function categoryForType(type) {
  return Object.keys(NOTIFICATION_CATEGORIES).find((key) =>
    NOTIFICATION_CATEGORIES[key].types.includes(type),
  );
}
