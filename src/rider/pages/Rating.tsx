import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { Star } from "lucide-react";
import { Logo } from "@/shared/components/brand/Logo";
import { Avatar } from "@/shared/components/kit/Primitives";
import { DRIVER } from "@/shared/constants/zip-data";
import { cn } from "@/shared/utils/cn";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/hooks/useAuth";

const TAGS = ["Clean car", "Safe driving", "On time", "Friendly", "Great music", "Smooth ride"];
const TIPS = [10, 20, 30, 50];

export function Rating() {
  const [rating, setRating] = useState(4);
  const [hover, setHover] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [tip, setTip] = useState<number | null>(null);
  const navigate = useNavigate();

  const [comment, setComment] = useState("");
  const { profile } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const [driverName, setDriverName] = useState(localStorage.getItem("active_driver_name") || DRIVER.name);
  const [driverAvatar, setDriverAvatar] = useState(localStorage.getItem("active_driver_avatar") || "");
  const [driverRating, setDriverRating] = useState(localStorage.getItem("active_driver_rating") || "4.8");
  const driverInitial = driverName ? driverName[0] : "D";

  const toggle = (t: string) =>
    setTags((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]));

  const handleSubmitRating = async () => {
    if (submitting) return;
    setSubmitting(true);

    const rideId = localStorage.getItem("active_ride_id");
    const driverId = localStorage.getItem("active_driver_id");
    
    if (!rideId || !driverId || !profile?.id) {
      localStorage.removeItem("active_ride_id");
      localStorage.removeItem("active_driver_id");
      localStorage.removeItem("active_driver_name");
      localStorage.removeItem("active_driver_avatar");
      localStorage.removeItem("active_driver_rating");
      navigate({ to: "/history", replace: true });
      return;
    }

    try {
      const fullComment = [comment, ...tags].filter(Boolean).join(" - ");
      
      const { error } = await supabase.from("ratings").insert({
        ride_id: rideId,
        rater_id: profile.id,
        ratee_id: driverId,
        rating: rating,
        comment: fullComment
      });

      if (error) throw error;

      // Clean up localStorage keys
      localStorage.removeItem("active_ride_id");
      localStorage.removeItem("active_driver_id");
      localStorage.removeItem("active_driver_name");
      localStorage.removeItem("active_driver_avatar");
      localStorage.removeItem("active_driver_rating");

      alert("Thank you for your feedback!");
      navigate({ to: "/history", replace: true });
    } catch (err: any) {
      alert("Failed to submit rating: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    localStorage.removeItem("active_ride_id");
    localStorage.removeItem("active_driver_id");
    localStorage.removeItem("active_driver_name");
    localStorage.removeItem("active_driver_avatar");
    localStorage.removeItem("active_driver_rating");
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-16 items-center justify-center border-b border-border glass">
        <Logo to="/dashboard" />
      </div>
      <div className="mx-auto max-w-lg px-4 py-10">
        <div className="rounded-3xl border border-border bg-card p-7 text-center shadow-elevated">
          <Avatar label={driverInitial} src={driverAvatar} className="mx-auto h-20 w-20 text-2xl" />
          <h1 className="mt-4 text-2xl font-extrabold">How was your ride?</h1>
          <p className="text-muted-foreground">with {driverName}</p>
          <p className="mt-1 flex items-center justify-center gap-1 text-sm font-bold text-warning bg-warning/5 border border-dashed border-warning/20 rounded-full px-3 py-1.5 w-fit mx-auto">
            ★ Driver's Current Rating: {driverRating}
          </p>

          <div className="mt-6 flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <motion.button
                key={n}
                whileTap={{ scale: 0.8 }}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(n)}
              >
                <Star
                  className={cn(
                    "h-10 w-10 transition-colors",
                    n <= (hover || rating)
                      ? "fill-warning text-warning"
                      : "fill-secondary text-border",
                  )}
                />
              </motion.button>
            ))}
          </div>
          <p className="mt-2 text-sm font-semibold text-primary">
            {["", "Poor", "Fair", "Good", "Great", "Excellent"][hover || rating]}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {TAGS.map((t) => (
              <button
                key={t}
                onClick={() => toggle(t)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  tags.includes(t)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment (optional)"
            rows={2}
            className="mt-5 w-full resize-none rounded-2xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />

          <p className="mb-2 mt-5 text-left text-xs font-bold uppercase text-muted-foreground">
            Add a tip
          </p>
          <div className="grid grid-cols-4 gap-2">
            {TIPS.map((t) => (
              <button
                key={t}
                onClick={() => setTip(tip === t ? null : t)}
                className={cn(
                  "rounded-xl border py-2.5 text-sm font-bold transition-colors",
                  tip === t ? "border-primary bg-primary/10 text-primary" : "border-border",
                )}
              >
                ₹{t}
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmitRating}
            disabled={submitting}
            className="mt-6 w-full rounded-2xl gradient-brand py-4 font-bold text-primary-foreground shadow-glow cursor-pointer disabled:opacity-50"
          >
            {submitting ? "Submitting..." : `Submit ${tip ? `· Tip ₹${tip}` : "Rating"}`}
          </button>
          <button 
            onClick={handleSkip} 
            className="mt-3 block w-full text-sm font-semibold text-muted-foreground cursor-pointer text-center"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
