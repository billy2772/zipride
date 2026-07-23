import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AdminShell } from "@/admin/layouts/AdminShell";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";

export function AdminSettings() {
  const [baseFare, setBaseFare] = useState("40");
  const [perKmRate, setPerKmRate] = useState("12");
  const [commission, setCommission] = useState("20");
  const [cancellationFee, setCancellationFee] = useState("25");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await (supabase as any).from("platform_settings").select("*");
        if (data && data.length > 0) {
          const settingsMap = data.reduce((acc: any, item: any) => {
            acc[item.key] = item.value;
            return acc;
          }, {});

          if (settingsMap.base_fare) setBaseFare(settingsMap.base_fare);
          if (settingsMap.per_km_rate) setPerKmRate(settingsMap.per_km_rate);
          if (settingsMap.commission) setCommission(settingsMap.commission);
          if (settingsMap.cancellation_fee) setCancellationFee(settingsMap.cancellation_fee);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = [
        { key: "base_fare", value: baseFare },
        { key: "per_km_rate", value: perKmRate },
        { key: "commission", value: commission },
        { key: "cancellation_fee", value: cancellationFee },
      ];

      // Try backend API first
      const token =
        sessionStorage.getItem("jwt_token") ||
        localStorage.getItem("jwt_token");

      if (token) {
        try {
          await apiFetch("/api/v1/admin/settings/bulk", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ settings: payload }),
          });
        } catch (e) {
          console.warn("Backend settings API unreachable, falling back to DB:", e);
        }
      }

      // Always also upsert via Supabase proxy to keep DB in sync
      for (const item of payload) {
        const { error } = await (supabase as any)
          .from("platform_settings")
          .upsert(item);
        if (error) {
          console.warn(`Failed to upsert setting ${item.key}:`, error.message);
        }
      }

      alert("Platform settings saved successfully!");
    } catch (err: any) {
      alert("Failed to save settings: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell title="Platform Settings" subtitle="Configure ZipRide">
      <div className="max-w-xl">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="mb-4 font-extrabold">Pricing</h2>
          <div className="mb-3">
            <label className="mb-1.5 block text-sm font-semibold">Base fare (₹)</label>
            <input
              value={baseFare}
              onChange={(e) => setBaseFare(e.target.value)}
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="mb-3">
            <label className="mb-1.5 block text-sm font-semibold">Per km rate (₹)</label>
            <input
              value={perKmRate}
              onChange={(e) => setPerKmRate(e.target.value)}
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="mb-3">
            <label className="mb-1.5 block text-sm font-semibold">Commission (%)</label>
            <input
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="mb-3">
            <label className="mb-1.5 block text-sm font-semibold">Cancellation fee (₹)</label>
            <input
              value={cancellationFee}
              onChange={(e) => setCancellationFee(e.target.value)}
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-6 rounded-2xl gradient-brand px-8 py-3.5 font-bold text-primary-foreground shadow-glow disabled:opacity-50"
      >
        {saving ? "Saving Changes..." : "Save Changes"}
      </button>
    </AdminShell>
  );
}
