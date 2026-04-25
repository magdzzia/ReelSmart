import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, STREAK_THRESHOLD } from "@/lib/store";
import { deckMastery } from "@/lib/storage";
import { Plus, Sparkles, Trash2, Film, Flame } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { decks, reelBank, deleteDeck, streak } = useStore();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const canCash = reelBank > 0;

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      <header className="px-6 pt-10 pb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight inline-block">
            ReelSmart
            <span className="block h-1.5 w-16 bg-brand mt-1 rounded-sm" />
          </h1>
          <p className="text-muted-foreground mt-3 text-sm">Study. Earn reels. Repeat.</p>
        </div>
        <div className="flex items-center gap-2">
          <HomeStreakChip streak={streak} />
          <ThemeToggle />
        </div>
      </header>

      {/* Bank */}
      <section className="px-6 mb-8">
        <div className="border-2 border-foreground rounded-2xl p-5 bg-card flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
              Reel Bank
            </p>
            <p className="text-3xl font-black mt-1 flex items-baseline gap-1">
              {reelBank}
              <span className="text-base font-bold text-muted-foreground">sec</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {canCash ? "Ready to watch 🎬" : "Earn seconds by studying"}
            </p>
          </div>
          <Link
            to="/reels"
            disabled={!canCash}
            className={`shrink-0 font-bold px-5 h-12 rounded-xl flex items-center gap-2 transition min-h-[48px] ${
              canCash
                ? "bg-brand text-brand-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground pointer-events-none opacity-60"
            }`}
            aria-disabled={!canCash}
          >
            <Film className="w-5 h-5" /> Cash In
          </Link>
        </div>
      </section>

      <section className="px-6">
        <h2 className="text-lg font-bold mb-4">Your Decks</h2>

        {decks.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {decks.map((d) => {
              const mastery = deckMastery(d);
              const isConfirming = confirmId === d.id;
              return (
                <div
                  key={d.id}
                  className="border-2 border-foreground rounded-xl p-5 bg-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold truncate">{d.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {d.cards.length} {d.cards.length === 1 ? "card" : "cards"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to="/study/$deckId"
                        params={{ deckId: d.id }}
                        className="bg-brand text-brand-foreground font-bold px-5 py-2.5 rounded-lg text-sm hover:opacity-90 transition min-h-[48px] flex items-center"
                      >
                        Study
                      </Link>
                      <button
                        onClick={() =>
                          isConfirming ? (deleteDeck(d.id), setConfirmId(null)) : setConfirmId(d.id)
                        }
                        onBlur={() => setConfirmId(null)}
                        className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition ${
                          isConfirming
                            ? "bg-foreground text-background border-foreground"
                            : "border-foreground hover:bg-foreground hover:text-background"
                        }`}
                        aria-label={isConfirming ? "Confirm delete" : "Delete deck"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isConfirming && (
                    <p className="text-xs text-brand font-bold mt-3">
                      Tap delete again to confirm.
                    </p>
                  )}

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium">Mastery</span>
                      <span className="font-bold">{mastery}%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand transition-all duration-300"
                        style={{ width: `${mastery}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="fixed bottom-6 right-6 flex items-center gap-3">
        <Link
          to="/import"
          className="bg-card border-2 border-foreground text-foreground rounded-full shadow-lg px-5 h-14 flex items-center gap-2 font-bold hover:bg-foreground hover:text-background transition"
          aria-label="Import notes with AI"
        >
          <Sparkles className="w-5 h-5" />
          Paste Notes
        </Link>
        <Link
          to="/new"
          className="bg-brand text-brand-foreground rounded-full shadow-lg px-6 h-14 flex items-center gap-2 font-bold hover:opacity-90 transition"
          aria-label="New Deck"
        >
          <Plus className="w-5 h-5" strokeWidth={3} />
          New Deck
        </Link>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border-2 border-dashed border-foreground/20 rounded-2xl py-16 px-6 text-center">
      <div className="mx-auto w-20 h-20 rounded-2xl border-2 border-foreground flex items-center justify-center mb-5">
        <Sparkles className="w-9 h-9 text-brand" strokeWidth={2.5} />
      </div>
      <p className="font-bold text-lg">No decks yet</p>
      <p className="text-muted-foreground text-sm mt-1 mb-6">
        Build your first deck and start earning reels.
      </p>
      <Link
        to="/new"
        className="inline-flex items-center gap-2 bg-brand text-brand-foreground font-bold px-6 py-3 rounded-lg hover:opacity-90 transition min-h-[48px]"
      >
        <Plus className="w-5 h-5" strokeWidth={3} />
        Create your first deck
      </Link>
    </div>
  );
}

function HomeStreakChip({ streak }: { streak: number }) {
  const onFire = streak > STREAK_THRESHOLD;
  if (onFire) {
    return (
      <div
        className="font-black px-3 h-10 rounded-full text-sm flex items-center gap-1 text-white shadow-lg animate-pulse"
        style={{ background: "linear-gradient(135deg, #ff5722, #ff9800, #ffc107)" }}
        title="On fire! +0.5s bonus per correct"
      >
        <Flame className="w-4 h-4 fill-white" /> {streak} 🔥
      </div>
    );
  }
  return (
    <div className="border-2 border-foreground bg-card font-bold px-3 h-10 rounded-full text-sm flex items-center gap-1">
      <Flame className="w-4 h-4" /> {streak}
    </div>
  );
}
