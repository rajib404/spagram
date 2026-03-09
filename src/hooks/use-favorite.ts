"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";

export function useFavorite(therapistProfileId: string, initialFavorited: boolean) {
  const { isAuthenticated } = useCurrentUser();
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      const prev = favorited;
      setFavorited(!prev);
      setLoading(true);

      try {
        const res = await fetch("/api/favorites", {
          method: prev ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ therapistProfileId }),
        });

        if (!res.ok) {
          setFavorited(prev);
          toast.error(prev ? "Failed to remove favorite" : "Failed to add favorite");
        }
      } catch {
        setFavorited(prev);
        toast.error("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [favorited, isAuthenticated, router, therapistProfileId]
  );

  return { favorited, loading, toggle };
}
