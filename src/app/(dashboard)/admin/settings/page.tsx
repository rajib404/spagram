"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Settings {
  bookingFeePercent: number;
  supportedMassageTypes: string[];
  supportedStates: string[];
  updatedAt: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [feePercent, setFeePercent] = useState(10);
  const [massageTypes, setMassageTypes] = useState("");
  const [states, setStates] = useState("");
  const [newType, setNewType] = useState("");
  const [newState, setNewState] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((data: Settings) => {
        setSettings(data);
        setFeePercent(data.bookingFeePercent);
        setMassageTypes(data.supportedMassageTypes.join(", "));
        setStates(data.supportedStates.join(", "));
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingFeePercent: feePercent,
          supportedMassageTypes: massageTypes.split(",").map((s) => s.trim()).filter(Boolean),
          supportedStates: states.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSettings(data);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  function addType() {
    if (!newType.trim()) return;
    const current = massageTypes.split(",").map((s) => s.trim()).filter(Boolean);
    if (current.includes(newType.trim())) { toast.error("Already exists"); return; }
    current.push(newType.trim());
    setMassageTypes(current.join(", "));
    setNewType("");
  }

  function removeType(type: string) {
    const current = massageTypes.split(",").map((s) => s.trim()).filter(Boolean);
    setMassageTypes(current.filter((t) => t !== type).join(", "));
  }

  function addState() {
    if (!newState.trim()) return;
    const current = states.split(",").map((s) => s.trim()).filter(Boolean);
    if (current.includes(newState.trim())) { toast.error("Already exists"); return; }
    current.push(newState.trim());
    setStates(current.join(", "));
    setNewState("");
  }

  function removeState(state: string) {
    const current = states.split(",").map((s) => s.trim()).filter(Boolean);
    setStates(current.filter((s) => s !== state).join(", "));
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-neutral-200 rounded w-48" />
        <div className="bg-white rounded-xl border border-neutral-200 h-96" />
      </div>
    );
  }

  if (!settings) return <div className="text-center py-16 text-neutral-500">Failed to load settings.</div>;

  const currentTypes = massageTypes.split(",").map((s) => s.trim()).filter(Boolean);
  const currentStates = states.split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Platform Settings</h1>
        <p className="text-neutral-500 mt-1">
          Last updated: {new Date(settings.updatedAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
        {/* Booking fee */}
        <div className="p-6">
          <h2 className="font-semibold text-neutral-900 mb-1">Booking Fee Percentage</h2>
          <p className="text-sm text-neutral-500 mb-4">The percentage charged as a platform fee on each booking.</p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={feePercent}
              onChange={(e) => setFeePercent(parseFloat(e.target.value) || 0)}
              className="input w-24"
            />
            <span className="text-sm text-neutral-500">%</span>
          </div>
        </div>

        {/* Massage types */}
        <div className="p-6">
          <h2 className="font-semibold text-neutral-900 mb-1">Supported Massage Types</h2>
          <p className="text-sm text-neutral-500 mb-4">Massage types available for therapists to offer.</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {currentTypes.map((type) => (
              <span key={type} className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                {type}
                <button onClick={() => removeType(type)} className="ml-0.5 text-primary-400 hover:text-primary-700">&times;</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addType(); } }}
              placeholder="Add massage type..."
              className="input max-w-xs text-sm"
            />
            <button onClick={addType} className="px-3 py-2 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">Add</button>
          </div>
        </div>

        {/* States */}
        <div className="p-6">
          <h2 className="font-semibold text-neutral-900 mb-1">Supported States/Locations</h2>
          <p className="text-sm text-neutral-500 mb-4">States where the platform operates.</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {currentStates.map((state) => (
              <span key={state} className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                {state}
                <button onClick={() => removeState(state)} className="ml-0.5 text-neutral-400 hover:text-neutral-700">&times;</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newState}
              onChange={(e) => setNewState(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addState(); } }}
              placeholder="Add state..."
              className="input max-w-xs text-sm"
            />
            <button onClick={addState} className="px-3 py-2 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">Add</button>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
