"use client";

interface OnlineStatusProps {
  lastActiveAt: string | null;
  size?: "sm" | "md";
}

function getActivityText(lastActiveAt: string): { online: boolean; text: string } | null {
  const diff = Date.now() - new Date(lastActiveAt).getTime();
  const minutes = Math.floor(diff / 60_000);

  if (minutes < 5) return { online: true, text: "Online" };
  if (minutes < 60) return { online: false, text: `Active ${minutes}m ago` };

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { online: false, text: `Active ${hours}h ago` };

  const days = Math.floor(hours / 24);
  if (days <= 7) return { online: false, text: `Active ${days}d ago` };

  return null;
}

export function OnlineStatus({ lastActiveAt, size = "sm" }: OnlineStatusProps) {
  if (!lastActiveAt) return null;

  const activity = getActivityText(lastActiveAt);
  if (!activity) return null;

  const dotSize = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";
  const textSize = size === "sm" ? "text-[11px]" : "text-xs";

  return (
    <span className={`inline-flex items-center gap-1 ${textSize}`}>
      <span
        className={`${dotSize} rounded-full ${
          activity.online ? "bg-green-500" : "bg-neutral-300"
        }`}
      />
      <span className={activity.online ? "text-green-600 font-medium" : "text-neutral-400"}>
        {activity.text}
      </span>
    </span>
  );
}
