"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  bookingNumber: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceType: string;
  otherPartyName: string;
  otherPartyImage: string | null;
  lastMessage: {
    content: string;
    createdAt: string;
    isMe: boolean;
  } | null;
  unreadCount: number;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatServiceType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function UserMessagesPage() {
  const { data, isLoading } = useQuery<{ conversations: Conversation[] }>({
    queryKey: ["user-conversations"],
    queryFn: async () => {
      const res = await fetch("/api/user/messages");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    refetchInterval: 15_000,
  });

  const conversations = data?.conversations ?? [];

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Messages</h1>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-neutral-200 p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-neutral-200 rounded" />
                  <div className="h-3 w-48 bg-neutral-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && conversations.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
            <svg className="h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-neutral-900">No messages yet</h3>
          <p className="mt-1 max-w-sm text-center text-sm text-neutral-500">
            Messages will appear here once you have an accepted booking.
          </p>
        </div>
      )}

      {!isLoading && conversations.length > 0 && (
        <div className="space-y-2">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/user/bookings/${c.id}`}
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border bg-white transition-colors hover:border-primary-200 hover:bg-primary-50/30",
                c.unreadCount > 0 ? "border-primary-200 bg-primary-50/20" : "border-neutral-200"
              )}
            >
              {/* Avatar */}
              {c.otherPartyImage ? (
                <Image
                  src={c.otherPartyImage}
                  alt={c.otherPartyName}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary-700">
                    {c.otherPartyName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className={cn("text-sm truncate", c.unreadCount > 0 ? "font-bold text-neutral-900" : "font-medium text-neutral-900")}>
                    {c.otherPartyName}
                  </h3>
                  {c.lastMessage && (
                    <span className="text-[11px] text-neutral-400 flex-shrink-0 ml-2">
                      {timeAgo(c.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {formatServiceType(c.serviceType)} &middot; {formatDate(c.date)}
                </p>
                {c.lastMessage && (
                  <p className={cn("text-sm truncate mt-0.5", c.unreadCount > 0 ? "font-medium text-neutral-700" : "text-neutral-500")}>
                    {c.lastMessage.isMe && <span className="text-neutral-400">You: </span>}
                    {c.lastMessage.content}
                  </p>
                )}
              </div>

              {/* Unread badge */}
              {c.unreadCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-semibold text-white flex-shrink-0">
                  {c.unreadCount > 99 ? "99+" : c.unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
