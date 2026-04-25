import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, STREAK_THRESHOLD } from "@/lib/store";
import { deckMastery } from "@/lib/storage";
import { Plus, Sparkles, Trash2, Flame, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { decks, deleteDeck, streak } = useStore();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-md mx-auto px-6 pt-10">
        {/* Header */}
        <header className="flex items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-muted-foreground">
              your decks
            </p>
            <h1 className="text-5xl font-bold tracking-tight leading-none mt-2">
              build it.
            </h1>
          </div>
          <StreakChip streak={streak} />
        </header>

        {/* Deck list */}
        <div className="space-y-3">
          {decks.map((d) => {
            const mastery = deckMastery(d);
            const isConfirming = confirmId === d.id;
            return (
              <div
                key={d.id}
                className="group bg-card rounded-2xl border border-border overflow-hidden"
              >
                <Link
                  to="/study/$deckId"
                  params={{ deckId: d.id }}
                  className="block px-5 pt-4 pb-3"
                >
                  <h3 className="text-lg font-semibold tracking-tight truncate">
                    {d.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {d.cards.length} {d.cards.length === 1 ? "question" : "questions"}
                  </p>
                </Link>

                {/* Subtle mastery bar */}
                <div className="px-5 pb-4">
                  <div className="h-[3px] w-full bg-muted/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand transition-all duration-300"
                      style={{ width: `${mastery}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                      {mastery}% mastered
                    </span>
                    <button
                      onClick={() =>
                        isConfirming ? (deleteDeck(d.id), setConfirmId(null)) : setConfirmId(d.id)
                      }
                      onBlur={() => setConfirmId(null)}
                      className={`text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1 transition ${
                        isConfirming ? "text-brand" : "text-muted-foreground hover:text-foreground"
                      }`}
                      aria-label={isConfirming ? "Confirm delete" : "Delete deck"}
                    >
                      <Trash2 className="w-3 h-3" />
                      {isConfirming ? "tap again" : "delete"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* New deck — dashed outline like mockup */}
          <Link
            to="/new"
            className="block rounded-2xl border-2 border-dashed border-brand/60 text-brand hover:bg-brand/5 transition py-5 text-center font-semibold tracking-tight"
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="w-4 h-4" strokeWidth={2.5} /> new deck
            </span>
          </Link>

          <Link
            to="/import"
            className="block rounded-2xl border border-border bg-card hover:border-brand/40 transition py-4 text-center text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <span className="inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> paste notes · ai builds it
            </span>
          </Link>
        </div>

        {decks.length === 0 && (
          <p className="text-center text-xs text-muted-foreground mt-8">
            multiple-choice · self-made
          </p>
        )}

        <p className="text-center text-[11px] text-muted-foreground/60 mt-10 tracking-wider">
          multiple-choice · self-made
        </p>
      </div>
    </div>
  );
}

function StreakChip({ streak }: { streak: number }) {
  const onFire = streak > STREAK_THRESHOLD;
  if (onFire) {
    return (
      <div
        className="font-bold px-3 h-9 rounded-full text-xs flex items-center gap-1 text-white shadow-lg"
        style={{ background: "linear-gradient(135deg, #ff5722, #ff9800, #ffc107)" }}
      >
        <Flame className="w-3.5 h-3.5 fill-white" /> {streak} 🔥
      </div>
    );
  }
  if (streak === 0) {
    return (
      <div className="text-muted-foreground text-xs font-semibold flex items-center gap-1.5 h-9 px-3 rounded-full border border-border">
        <Zap className="w-3.5 h-3.5" /> 0
      </div>
    );
  }
  return (
    <div className="bg-card border border-border text-foreground font-semibold px-3 h-9 rounded-full text-xs flex items-center gap-1.5">
      <Zap className="w-3.5 h-3.5 text-brand" /> {streak}
    </div>
  );
}
