"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function TestEmailPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send");
      }

      toast.success(`Test email sent to ${email}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send test email");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Test Email</h1>
        <p className="text-neutral-500 mt-1">Send a test email to verify deliverability.</p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-6 max-w-lg">
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
              Recipient Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input w-full"
            />
          </div>

          <button
            type="submit"
            disabled={sending || !email.trim()}
            className="px-6 py-2.5 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {sending ? "Sending..." : "Send Test Email"}
          </button>
        </form>
      </div>
    </div>
  );
}
