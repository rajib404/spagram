const requests = new Map<string, number[]>();

// Clean up expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    requests.forEach((timestamps, key) => {
      const filtered = timestamps.filter((t: number) => now - t < 15 * 60 * 1000);
      if (filtered.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, filtered);
      }
    });
  }, CLEANUP_INTERVAL);
  // Allow process to exit without waiting for cleanup
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

/**
 * Sliding window rate limiter.
 * Returns `true` if the request is allowed, `false` if rate limited.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  startCleanup();

  const now = Date.now();
  const timestamps = requests.get(key) || [];
  const windowStart = now - windowMs;

  // Remove timestamps outside the window
  const recent = timestamps.filter((t) => t > windowStart);

  if (recent.length >= limit) {
    return false;
  }

  recent.push(now);
  requests.set(key, recent);
  return true;
}
