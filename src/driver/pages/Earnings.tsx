import { formatDateIN } from "@/shared/utils/format";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TrendingUp, Car, Clock, Wallet, Loader2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from "recharts";
import { DriverShell } from "@/driver/layouts/DriverShell";
import { StatCard, PageHeader } from "@/shared/components/kit/Primitives";
import { useAuth } from "@/auth/hooks/useAuth";
import { supabase } from "@/lib/supabase";



export function Earnings() {
  const { profile } = useAuth();
  const [completedRides, setCompletedRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEarnings() {
      if (!profile?.id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("rides")
          .select("*")
          .eq("driver_id", profile.id)
          .eq("status", "completed")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setCompletedRides(data || []);
      } catch (err) {
        console.error("Failed to load driver earnings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEarnings();
  }, [profile]);

  

  // 1. Calculations
  const totalEarnings = completedRides.reduce((sum, r) => sum + Number(r.fare || 0), 0);
  const totalTrips = completedRides.length;

  const now = new Date();
  
  // This Month Earnings
  const thisMonthRides = completedRides.filter((r) => {
    const d = new Date(r.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthEarnings = thisMonthRides.reduce((sum, r) => sum + Number(r.fare || 0), 0);

  // This Week Earnings (rides within last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thisWeekRides = completedRides.filter((r) => new Date(r.created_at) >= oneWeekAgo);
  const thisWeekEarnings = thisWeekRides.reduce((sum, r) => sum + Number(r.fare || 0), 0);

  // Trips this week
  const tripsThisWeek = thisWeekRides.length;

  // 2. Chart data (group last 7 days)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d;
  }).reverse();

  const chartData = last7Days.map((date) => {
    const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" });
    const dayRides = completedRides.filter((r) => {
      const rd = new Date(r.created_at);
      return rd.toDateString() === date.toDateString();
    });
    const amt = dayRides.reduce((sum, r) => sum + Number(r.fare || 0), 0);
    return { day: dayLabel, amt };
  });

  return (
    <DriverShell>
      <PageHeader title="Earnings" subtitle="Your income at a glance" />

      {loading ? (
        <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Loading earnings metrics...</span>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard value={`₹${thisWeekEarnings.toLocaleString()}`} label="This week" icon={<TrendingUp />} />
            <StatCard value={`₹${thisMonthEarnings.toLocaleString()}`} label="This month" icon={<Wallet />} />
            <StatCard value={tripsThisWeek.toString()} label="Trips this week" icon={<Car />} />
            <StatCard value={`₹${totalEarnings.toLocaleString()}`} label="Total Earnings" icon={<Wallet />} />
          </div>

          <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-soft">
            <h2 className="mb-4 font-extrabold">Weekly earnings</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--secondary)" }}
                    contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }}
                  />
                  <Bar dataKey="amt" radius={[8, 8, 0, 0]} fill="var(--primary)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-soft">
            <h2 className="mb-4 font-extrabold">Recent Completed Trips</h2>
            {completedRides.length === 0 ? (
              <p className="text-center py-6 text-sm text-muted-foreground">No completed trips yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {completedRides.slice(0, 10).map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-success/15 text-success">
                        <Car className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate max-w-[200px] sm:max-w-md font-sans">
                          {r.pickup_address} → {r.dropoff_address}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDateIN(r.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-bold text-success">+₹{Number(r.fare).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground uppercase">{r.payment_method}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </DriverShell>
  );
}
