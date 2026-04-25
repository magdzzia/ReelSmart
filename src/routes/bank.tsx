import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useStore, STREAK_THRESHOLD } from "@/lib/store";
import { ArrowRight, Flame } from "lucide-react";

export const Route = createFileRoute("/bank")({
  head: () => ({
    meta: [
      { title: "Reel Bank — ReelSmart" },
      { name: "description", content: "Your earned reel time. Cash in to watch." },
    ],
  }),
  component: Bank,
});

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function Bank() {
  const navigate = useNavigate();
  const { reelBank, streak } = useStore();
  const canCash = reelBank > 0;
  const onFire = streak > STREAK_THRESHOLD;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-md mx-auto px-6 pt-10">
        {/* Hero "card" — orange, like mockup 3 */}
        <div className="rounded-3xl bg-orange text-orange-foreground p-8 pt-10 pb-8 relative overflow-hidden">
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.22em] font-bold opacity-80">
              reel bank
            </p>
            <p className="text-7xl font-bold tracking-tighter tabular-nums mt-4 leading-none">
              {fmt(reelBank)}
            </p>

            <p className="text-sm font-medium mt-6 opacity-90">
              streak past 10 → +0.5s bonus per right{" "}
              <span aria-hidden>🔥</span>
            </p>

            <button
              disabled={!canCash}
              onClick={() => navigate({ to: "/reels" })}
              className="mt-8 inline-flex items-center gap-2 bg-foreground text-background font-bold px-6 h-12 rounded-full text-sm hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              cash in <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status row */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
              earn rate
            </p>
            <p className="text-xl font-bold mt-1">
              +2s <span className="text-muted-foreground text-sm font-medium">/ right</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">−1s on wrong</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
              streak
            </p>
            <p className="text-xl font-bold mt-1 flex items-center gap-1.5">
              <Flame className={`w-5 h-5 ${onFire ? "text-orange fill-orange" : "text-muted-foreground"}`} />
              {streak}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {onFire ? "on fire — bonus active" : `${Math.max(0, STREAK_THRESHOLD + 1 - streak)} to fire`}
            </p>
          </div>
        </div>

        {!canCash && (
          <p className="text-center text-xs text-muted-foreground mt-8">
            study a deck to earn reel time.
          </p>
        )}
      </div>
    </div>
  );
}
