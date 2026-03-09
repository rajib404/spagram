"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export function useHeartbeat(intervalMs = 60_000) {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;

    function ping() {
      fetch("/api/heartbeat", { method: "POST" }).catch(() => {});
    }

    ping();
    const id = setInterval(ping, intervalMs);
    return () => clearInterval(id);
  }, [session?.user, intervalMs]);
}
