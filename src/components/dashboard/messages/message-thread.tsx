"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { MessageItem } from "@/types";

interface MessageThreadProps {
  bookingId: string;
}

export function MessageThread({ bookingId }: MessageThreadProps) {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const prevLengthRef = useRef(0);

  // Fetch messages
  const { data, isLoading } = useQuery<{ messages: MessageItem[] }>({
    queryKey: ["messages", bookingId],
    queryFn: async () => {
      const res = await fetch(`/api/messages?bookingId=${bookingId}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    refetchInterval: 10_000,
  });

  const messages = data?.messages ?? [];

  // Mark messages as read on mount
  useEffect(() => {
    fetch("/api/messages/read", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    }).catch(() => {});
  }, [bookingId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: prevLengthRef.current === 0 ? "instant" : "smooth",
      });
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  // Send message
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, content }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }
      return res.json();
    },
    onSuccess: (data) => {
      // Optimistically add the message
      queryClient.setQueryData<{ messages: MessageItem[] }>(
        ["messages", bookingId],
        (old) => ({
          messages: [...(old?.messages ?? []), data.message],
        })
      );
      setInput("");
    },
  });

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] border border-neutral-200 rounded-xl bg-white overflow-hidden">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-sm text-neutral-400">
            No messages yet. Start the conversation!
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn("flex gap-2", msg.isMe ? "flex-row-reverse" : "flex-row")}
          >
            {/* Avatar */}
            {!msg.isMe && (
              <div className="flex-shrink-0 mt-1">
                {msg.senderImage ? (
                  <Image
                    src={msg.senderImage}
                    alt={msg.senderName}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600">
                    {msg.senderName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            )}

            {/* Bubble */}
            <div
              className={cn(
                "max-w-[70%] rounded-2xl px-3.5 py-2",
                msg.isMe
                  ? "bg-primary-600 text-white"
                  : "bg-neutral-100 text-neutral-900"
              )}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
              <p
                className={cn(
                  "mt-1 text-[10px]",
                  msg.isMe ? "text-primary-200" : "text-neutral-400"
                )}
              >
                {formatTime(msg.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-neutral-200 p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          maxLength={2000}
          className="input flex-1 text-sm"
        />
        <button
          type="submit"
          disabled={!input.trim() || sendMutation.isPending}
          className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
