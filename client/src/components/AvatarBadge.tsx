import { AVATARS } from "../../../shared/game";

interface AvatarBadgeProps {
  avatarKey: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  showName?: boolean;
  className?: string;
  isAi?: boolean;
}

const sizeMap = {
  sm: { emoji: "text-xl", name: "text-xs", gap: "gap-1.5" },
  md: { emoji: "text-3xl", name: "text-sm", gap: "gap-2" },
  lg: { emoji: "text-5xl", name: "text-base", gap: "gap-3" },
  xl: { emoji: "text-7xl", name: "text-xl", gap: "gap-4" },
};

export function getAvatarEmoji(key: string): string {
  return AVATARS.find((a) => a.key === key)?.emoji ?? "🎭";
}

export default function AvatarBadge({
  avatarKey,
  name,
  size = "md",
  showName = true,
  className = "",
  isAi = false,
}: AvatarBadgeProps) {
  const s = sizeMap[size];
  const emoji = getAvatarEmoji(avatarKey);

  return (
    <div className={`inline-flex flex-col items-center ${s.gap} ${className}`}>
      <span
        className={`${s.emoji} select-none leading-none`}
        role="img"
        aria-label={name}
      >
        {emoji}
      </span>
      {showName && (
        <span className={`font-bold tracking-widest uppercase ${s.name} text-foreground`}>
          {name}
          {isAi && (
            <span className="ml-1 text-xs font-normal opacity-50">(AI)</span>
          )}
        </span>
      )}
    </div>
  );
}
