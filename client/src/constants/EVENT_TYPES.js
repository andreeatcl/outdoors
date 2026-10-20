import {
  Volleyball,
  Footprints,
  Bike,
  Mountain,
  Handshake,
  Sandwich,
  Dices,
  Sparkles,
} from "lucide-react";
import {
  IconBallFootball,
  IconBallBasketball,
  IconBallTennis,
  IconSkateboard,
} from "@tabler/icons-react";

export const EVENT_TYPES = [
  { value: "fotbal", label: "Fotbal", icon: IconBallFootball },
  { value: "baschet", label: "Baschet", icon: IconBallBasketball },
  { value: "tenis", label: "Tenis", icon: IconBallTennis },
  { value: "volei", label: "Volei", icon: Volleyball },
  { value: "jogging", label: "Jogging", icon: Footprints },
  { value: "ciclism", label: "Ciclism", icon: Bike },
  { value: "hiking", label: "Hiking", icon: Mountain },
  { value: "skateboarding", label: "Skateboarding", icon: IconSkateboard },
  { value: "socializare", label: "Socializare", icon: Handshake },
  { value: "picnic", label: "Picnic", icon: Sandwich },
  { value: "board_games", label: "Jocuri de masă", icon: Dices },
  { value: "altele", label: "Altele", icon: Sparkles },
];

export const getEventType = (value) =>
  EVENT_TYPES.find((t) => t.value === value) ?? {
    value,
    label: value,
    icon: Sparkles,
  };
