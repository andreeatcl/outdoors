import { Calendar, Target, CircleCheck, Users } from "lucide-react";

export default function ProfileStats({
  stats,
  onTotalClick,
  onCreatedClick,
  onFriendsClick,
}) {
  const items = [
    {
      label: "Evenimente totale",
      value: stats.participations,
      icon: Target,
      onClick: onTotalClick,
    },
    {
      label: "Evenimente create",
      value: stats.events_created,
      icon: Calendar,
      onClick: onCreatedClick,
    },
    { label: "Check-in", value: `${stats.checkin_rate}%`, icon: CircleCheck },
    {
      label: "Prieteni",
      value: stats.friends_count,
      icon: Users,
      onClick: onFriendsClick,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {items.map((item) => {
        const Tag = item.onClick ? "button" : "div";
        return (
          <Tag
            key={item.label}
            onClick={item.onClick}
            className={`bg-surface rounded-2xl border border-border/60 p-3 min-h-[104px] flex flex-col items-center justify-center text-center gap-1 ${
              item.onClick
                ? "hover:border-primary/40 hover:bg-primary/5 transition-colors"
                : ""
            }`}
          >
            <item.icon size={20} className="text-text-primary" />
            <div className="text-xl font-display font-bold text-text-primary leading-tight">
              {item.value}
            </div>
            <div className="text-xs text-text-muted leading-tight">
              {item.label}
            </div>
          </Tag>
        );
      })}
    </div>
  );
}
