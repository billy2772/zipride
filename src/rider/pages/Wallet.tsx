import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, ArrowDownToLine, Smartphone, Banknote, Zap, Car, Gift } from "lucide-react";
import { UserShell } from "@/rider/layouts/UserShell";
import { PageHeader } from "@/shared/components/kit/Primitives";
import { Reveal } from "@/shared/components/kit/Reveal";
import { TRANSACTIONS } from "@/shared/constants/zip-data";
import { cn } from "@/shared/utils/cn";
import { useAuth } from "@/auth/hooks/useAuth";
import { supabase } from "@/lib/supabase";



const QUICK = [100, 500, 1000, 2000];

export function WalletPage() {
  const { profile } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [amt, setAmt] = useState(500);
  const [customAmt, setCustomAmt] = useState("");

  const iconFor = (k: string) => (k === "deposit" || k === "add" ? Plus : k === "bonus" ? Gift : Car);

  useEffect(() => {
    async function loadWalletData() {
      if (profile?.id) {
        // Fetch wallet balance
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("id", profile.id)
          .maybeSingle();
        if (wallet) {
          setBalance(Number(wallet.balance || 0));
        }

        // Fetch wallet transactions
        const { data: txs } = await supabase
          .from("wallet_transactions")
          .select("*")
          .eq("wallet_id", profile.id)
          .order("created_at", { ascending: false });

        if (txs && txs.length > 0) {
          setTransactions(txs.map((t: any) => ({
            id: t.id,
            title: t.description || (t.type === "deposit" ? "Money Deposited" : "Ride Payment"),
            date: new Date(t.created_at).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" }),
            amount: Number(t.amount || 0),
            kind: t.type
          })));
        } else {
          setTransactions([]);
        }
      }
    }
    loadWalletData();
  }, [profile]);

  const handleAddMoney = async () => {
    if (!profile?.id) {
      alert("User profile not found. Please log in again.");
      return;
    }
    const finalAmt = customAmt ? parseFloat(customAmt) : amt;
    if (isNaN(finalAmt) || finalAmt <= 0) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }
    try {
      const { error } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: profile.id,
          amount: finalAmt,
          type: "deposit",
          description: "Money added via UPI"
        });
      if (error) throw error;
      alert(`₹${finalAmt.toLocaleString()} successfully added to your wallet!`);
      setCustomAmt("");
      window.location.reload();
    } catch (e: any) {
      alert("Failed to add money: " + e.message);
    }
  };

  const displayedTxs = transactions.length > 0 ? transactions : TRANSACTIONS;

  const METHODS = [
    { label: "UPI", sub: "registered-upi@upi", icon: Smartphone, badge: "Default" },
    { label: "Cash", sub: "Pay on delivery", icon: Banknote },
    { label: "ZipWallet", sub: `₹${balance.toLocaleString()} balance`, icon: Zap },
  ];

  const displayAmt = customAmt ? parseFloat(customAmt) || 0 : amt;

  return (
    <UserShell>
      <PageHeader title="My Wallet" subtitle="Manage your balance & payments" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl gradient-hero p-7 text-white shadow-elevated">
            <div className="pointer-events-none absolute -right-8 top-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <p className="text-sm text-white/80">Current Balance</p>
            <p className="mt-1 text-4xl font-extrabold">₹{balance.toLocaleString()}.00</p>
            <div className="mt-6 flex gap-3">
              <button className="flex items-center gap-2 rounded-2xl bg-white/20 px-5 py-2.5 font-semibold backdrop-blur">
                <Plus className="h-4 w-4" /> Add Money
              </button>
              <button className="flex items-center gap-2 rounded-2xl bg-white/20 px-5 py-2.5 font-semibold backdrop-blur">
                <ArrowDownToLine className="h-4 w-4" /> Withdraw
              </button>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-extrabold">Quick Add Money</h2>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setAmt(q);
                    setCustomAmt("");
                  }}
                  className={cn(
                    "rounded-xl border py-2.5 text-sm font-bold transition-colors",
                    (amt === q && !customAmt) ? "border-primary bg-primary/10 text-primary" : "border-border",
                  )}
                >
                  ₹{q}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={customAmt}
              onChange={(e) => setCustomAmt(e.target.value)}
              placeholder="Enter custom amount"
              className="mt-3 w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
            />
            <button 
              onClick={handleAddMoney}
              className="mt-4 w-full rounded-2xl gradient-brand py-3.5 font-bold text-primary-foreground shadow-glow"
            >
              Add ₹{displayAmt.toLocaleString()} to Wallet
            </button>
          </div>
        </Reveal>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Reveal>
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-extrabold">Payment Methods</h2>
            <div className="mt-4 space-y-3">
              {METHODS.map((m) => (
                <div key={m.label} className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
                    <m.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.sub}</p>
                  </div>
                  {m.badge && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      {m.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <button className="mt-4 w-full rounded-2xl border border-dashed border-border py-3 text-sm font-semibold text-muted-foreground">
              + Add Payment Method
            </button>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold">Recent Transactions</h2>
              <button className="text-sm font-semibold text-primary">View All</button>
            </div>
            <div className="mt-4 divide-y divide-border">
              {displayedTxs.map((t: any) => {
                const Icon = iconFor(t.kind);
                const positive = t.amount > 0;
                return (
                  <div key={t.id} className="flex items-center gap-3 py-3">
                    <div
                      className={cn(
                        "grid h-10 w-10 place-items-center rounded-xl",
                        positive
                          ? "bg-success/15 text-success"
                          : "bg-destructive/10 text-destructive",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{t.date}</p>
                    </div>
                    <p className={cn("font-bold", positive ? "text-success" : "text-destructive")}>
                      {positive ? "+" : "−"}₹{Math.abs(t.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </UserShell>
  );
}
