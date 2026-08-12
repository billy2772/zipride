import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Users, Car, TrendingUp, Route as RouteIcon, Wifi, WifiOff,
  Clock, CheckCircle, XCircle, Wallet, AlertCircle, Star, CreditCard
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { AdminShell } from "@/admin/layouts/AdminShell";
import { StatCard, Pill } from "@/shared/components/kit/Primitives";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/shared/context/LanguageContext";

import { apiFetch } from "@/lib/api";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

interface DashStats {
  totalUsers: number;
  totalDrivers: number;
  driversOnline: number;
  driversOffline: number;
  pendingDriverApprovals: number;
  totalRides: number;
  todayRides: number;
  completedToday: number;
  cancelledToday: number;
  activeRides: number;
  pendingPayments: number;
  totalRevenue: number;
  todayRevenue: number;
  platformWalletBalance: number;
  averageDriverRating: number;
  activeRiders: number;
  topDrivers: any[];
  topRiders: any[];
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashStats>({
    totalUsers: 0, totalDrivers: 0, driversOnline: 0, driversOffline: 0,
    pendingDriverApprovals: 0, totalRides: 0, todayRides: 0, completedToday: 0,
    cancelledToday: 0, activeRides: 0, pendingPayments: 0, totalRevenue: 0,
    todayRevenue: 0, platformWalletBalance: 0, averageDriverRating: 0,
    activeRiders: 0, topDrivers: [], topRiders: [],
  });
  const [recentRides, setRecentRides] = useState<any[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [rideSplit, setRideSplit] = useState<any[]>([]);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const res = await apiFetch("/api/admin/dashboard/stats");
        const json = await res.json();
        const d = json?.data || {};

        if (json?.success && d) {
          setStats({
            totalUsers: Number(d.totalRiders || 0),
            totalDrivers: Number(d.totalDrivers || 0),
            driversOnline: Number(d.driversOnline || 0),
            driversOffline: Number(d.driversOffline || 0),
            pendingDriverApprovals: Number(d.pendingDriverApprovals || 0),
            totalRides: Number(d.totalRides || 0),
            todayRides: Number(d.todayRides || 0),
            completedToday: Number(d.completedToday || 0),
            cancelledToday: Number(d.cancelledToday || 0),
            activeRides: Number(d.activeRides || 0),
            pendingPayments: Number(d.pendingPayments || 0),
            totalRevenue: Number(d.totalRevenue || 0),
            todayRevenue: Number(d.todayRevenue || 0),
            platformWalletBalance: Number(d.platformWalletBalance || 0),
            averageDriverRating: Number(d.averageDriverRating || 5.0),
            activeRiders: Number(d.activeRiders || 0),
            topDrivers: d.topDrivers || [],
            topRiders: d.topRiders || [],
          });
        }

        // Revenue trend (last 6 months)
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const currentMonthIdx = new Date().getMonth();
        const trendMap: Record<string, number> = {};
        for (let i = Math.max(0, currentMonthIdx - 5); i <= currentMonthIdx; i++) {
          trendMap[months[i]] = 0;
        }
        const completedRidesList = Array.isArray(d.completedRides) ? d.completedRides : [];
        completedRidesList.forEach((r: any) => {
          const dt = new Date(r.created_at || r.booking_time);
          const m = months[dt.getMonth()];
          if (trendMap[m] !== undefined) trendMap[m] += Number(r.fare || r.final_fare || 0) / 1000;
        });
        setRevenueTrend(Object.keys(trendMap).map(m => ({ month: m, revenue: parseFloat(trendMap[m].toFixed(2)) })));

        // Ride type split
        const { data: dbVehicles } = await supabase.from("vehicles").select("vehicle_type");
        const vehicleMap: Record<string, number> = { "Taxi": 0, "Sedan": 0, "SUV": 0, "Auto": 0 };
        dbVehicles?.forEach((v: any) => { const t = v.vehicle_type || "Taxi"; if (vehicleMap[t] !== undefined) vehicleMap[t]++; });
        const splitData = Object.keys(vehicleMap).map(k => ({ name: k, value: vehicleMap[k] })).filter(x => x.value > 0);
        setRideSplit(splitData.length > 0 ? splitData : [{ name: "Taxi", value: 1 }]);

        // Recent rides
        const { data: rides } = await supabase
          .from("rides")
          .select("id, pickup_address, dropoff_address, fare, status, created_at")
          .order("created_at", { ascending: false })
          .limit(5);

        if (rides && rides.length > 0) {
          setRecentRides(rides.map((r: any) => ({
            id: String(r.id).substring(0, 8).toUpperCase(),
            route: `${(r.pickup_address || "?").split(",")[0]} → ${(r.dropoff_address || "?").split(",")[0]}`,
            time: new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            fare: r.fare || 0,
            status: r.status === "completed" ? "Completed" : r.status === "cancelled" ? "Cancelled" : "Ongoing",
          })));
        } else {
          setRecentRides([]);
        }
      } catch (err) {
        console.error("Error loading admin dashboard stats:", err);
      }
    }
    loadAdminData();
    const interval = setInterval(loadAdminData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const { t } = useLanguage();

  const statRows = [
    { value: `₹${Number(stats.todayRevenue).toLocaleString()}`, label: t("stat_todays_revenue") || "Today's Revenue", icon: <TrendingUp /> },
    { value: stats.todayRides.toString(), label: t("stat_todays_rides") || "Today's Rides", icon: <RouteIcon /> },
    { value: stats.driversOnline.toString(), label: t("stat_drivers_online") || "Drivers Online", icon: <Wifi /> },
    { value: stats.driversOffline.toString(), label: t("stat_drivers_offline") || "Drivers Offline", icon: <WifiOff /> },
    { value: stats.activeRiders.toString(), label: t("stat_active_riders") || "Active Riders (30d)", icon: <Users /> },
    { value: stats.completedToday.toString(), label: t("stat_completed_today") || "Completed Today", icon: <CheckCircle /> },
    { value: stats.cancelledToday.toString(), label: t("stat_cancelled_today") || "Cancelled Today", icon: <XCircle /> },
    { value: `₹${Number(stats.platformWalletBalance).toLocaleString()}`, label: t("stat_wallet_balance") || "Wallet Balance", icon: <Wallet /> },
    { value: stats.pendingDriverApprovals.toString(), label: t("stat_pending_verifications") || "Pending Verifications", icon: <AlertCircle /> },
    { value: stats.pendingPayments.toString(), label: t("stat_pending_payments") || "Pending Payments", icon: <CreditCard /> },
    { value: Number(stats.averageDriverRating).toFixed(1), label: t("stat_avg_rating") || "Avg Driver Rating", icon: <Star /> },
    { value: `₹${Number(stats.totalRevenue).toLocaleString()}`, label: t("stat_total_revenue") || "Total Revenue", icon: <TrendingUp /> },
  ];

  return (
    <AdminShell title={t("nav_admin_dashboard") || "Dashboard"} subtitle={t("dashboard_subtitle") || "Live platform overview"}>
      {/* 12-stat grid */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {statRows.map((s) => (
          <StatCard key={s.label} value={s.value} label={s.label} icon={s.icon} />
        ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="mb-4 font-extrabold">{t("revenue_trend") || "Revenue trend (₹ thousands)"}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="mb-4 font-extrabold">{t("rides_by_vehicle") || "Rides by vehicle"}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={rideSplit} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                  {rideSplit.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend /><Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Drivers & Riders */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="mb-4 font-extrabold">{t("top_drivers") || "Top Drivers"}</h2>
          {stats.topDrivers.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("no_data") || "No data yet."}</p>
          ) : (
            <div className="space-y-3">
              {stats.topDrivers.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                    <Car className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">{d.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" /> {Number(d.rating || 5).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="mb-4 font-extrabold">{t("top_riders") || "Top Riders"}</h2>
          {stats.topRiders.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("no_data") || "No data yet."}</p>
          ) : (
            <div className="space-y-3">
              {stats.topRiders.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">{r.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Rides */}
      <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h2 className="mb-4 font-extrabold">Recent rides</h2>
        <div className="divide-y divide-border">
          {recentRides.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No rides yet.</p>
          ) : recentRides.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <div>
                <p className="font-bold">{r.id} · {r.route}</p>
                <p className="text-xs text-muted-foreground">{r.time}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold">₹{r.fare}</span>
                <Pill tone={r.status === "Completed" ? "success" : r.status === "Ongoing" ? "brand" : "destructive"}>
                  {r.status}
                </Pill>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
