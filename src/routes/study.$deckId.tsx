import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useStore, STREAK_THRESHOLD, STREAK_BONUS } from "@/lib/store";
import type { Card } from "@/lib/storage";
import { ArrowLeft, Film, RotateCcw, Star, Flame } from "lucide-react";

export const Route = createFileRoute("/study/$deckId")({
  component: Study,
});

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildOptions(card: Card, all: Card[]): string[] {
  const correct = card.back;
  const pool = Array.from(
    new Set(
      all
        .filter((c) => c.id !== card.id)
        .map((c) => c.back)
        .filter((b) => b && b !== correct)
    )
  );
  const distractors = shuffle(pool).slice(0, 3);
  return shuffle([correct, ...distractors]);
}

type Phase = "answer" | "correct" | "wrong" | "done";

function Study() {
  const { deckId } = Route.useParams();
  const navigate = useNavigate();
  const { getDeck, decks, addReelSeconds, reelBank, markCorrect, streak, bumpStreak, resetStreak } = useStore();
  const deck = useMemo(() => getDeck(deckId), [getDeck, deckId, decks]);

  const [order, setOrder] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("answer");
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [earned, setEarned] = useState(0);
  const [toastKey, setToastKey] = useState(0);
  const [lastGain, setLastGain] = useState(2);

  // initialize
  useEffect(() => {
    if (deck) {
      const o = shuffle(deck.cards);
      setOrder(o);
      setIdx(0);
      setCorrect(0);
      setWrong(0);
      setEarned(0);
      setPhase(o.length ? "answer" : "done");
      if (o.length) setOptions(buildOptions(o[0], deck.cards));
    }
  }, [deck?.id]);

  if (!deck) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <p className="font-bold text-xl">Deck not found</p>
          <Link to="/" className="text-brand font-bold underline mt-2 inline-block">Go home</Link>
        </div>
      </div>
    );
  }

  const card = order[idx];

  const pick = (opt: string) => {
    if (phase !== "answer" || !card) return;
    setPicked(opt);
    if (opt === card.back) {
      const newStreak = bumpStreak();
      const bonus = newStreak > STREAK_THRESHOLD ? STREAK_BONUS : 0;
      const gain = 2 + bonus;
      setPhase("correct");
      setCorrect((c) => c + 1);
      setEarned((e) => e + gain);
      addReelSeconds(gain);
      markCorrect(deck.id, card.id);
      setLastGain(gain);
      setToastKey((k) => k + 1);
      setTimeout(advance, 600);
    } else {
      resetStreak();
      setPhase("wrong");
      setWrong((w) => w + 1);
      setEarned((e) => e - 1);
      addReelSeconds(-1);
      setToastKey((k) => k + 1);
      setTimeout(advance, 1000);
    }
  };

  const advance = () => {
    setPicked(null);
    if (idx + 1 >= order.length) {
      setPhase("done");
    } else {
      const next = idx + 1;
      setIdx(next);
      setOptions(buildOptions(order[next], deck.cards));
      setPhase("answer");
    }
  };

  const restart = () => {
    const o = shuffle(deck.cards);
    setOrder(o);
    setIdx(0);
    setCorrect(0);
    setWrong(0);
    setEarned(0);
    setOptions(buildOptions(o[0], deck.cards));
    setPhase("answer");
  };

  if (phase === "done") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 rounded-full bg-brand flex items-center justify-center mb-6">
          <Star className="w-12 h-12 text-white" fill="white" strokeWidth={2} />
        </div>
        <h1 className="text-3xl font-black">Round Complete</h1>
        <p className="text-muted-foreground mt-2">{deck.name}</p>

        <div className="grid grid-cols-3 gap-3 mt-8 w-full max-w-sm">
          <Stat label="Correct" value={correct.toString()} />
          <Stat label="Wrong" value={wrong.toString()} />
          <Stat label="Earned" value={`${earned}s`} accent />
        </div>

        <div className="mt-8 w-full max-w-sm space-y-3">
          <button
            onClick={restart}
            className="w-full border-2 border-foreground rounded-xl py-4 font-bold flex items-center justify-center gap-2 hover:bg-foreground hover:text-background transition min-h-[48px]"
          >
            <RotateCcw className="w-5 h-5" /> Study Again
          </button>
          <button
            disabled={reelBank <= 0}
            onClick={() => navigate({ to: "/reels" })}
            className="w-full bg-brand text-brand-foreground rounded-xl py-4 font-bold flex items-center justify-center gap-2 hover:opacity-90 transition min-h-[48px] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Film className="w-5 h-5" /> {reelBank > 0 ? "Watch Reels 🎬" : "No reel seconds yet"}
          </button>
          <Link
            to="/"
            className="block text-center text-muted-foreground text-sm pt-2 font-medium"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 relative">
      <header className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="w-10 h-10 rounded-lg border-2 border-foreground flex items-center justify-center"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <StreakChip streak={streak} />
            <div className="bg-brand text-brand-foreground font-bold px-4 py-2 rounded-full text-sm">
              🎬 {reelBank}s
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-bold truncate">{deck.name}</h1>
            <span className="text-xs text-muted-foreground font-semibold">
              Card {idx + 1} of {order.length}
            </span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground transition-all duration-300"
              style={{ width: `${((idx + 1) / order.length) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <main className="px-6 mt-4">
        <div className="border-2 border-foreground rounded-2xl p-8 min-h-[200px] flex items-center justify-center text-center">
          <p className="text-2xl font-bold leading-tight">{card?.front}</p>
        </div>

        <div className="mt-6 space-y-3 relative">
          {toastKey > 0 && (phase === "correct" || phase === "wrong") && (
            <div
              key={toastKey}
              className={`absolute left-1/2 -top-4 -translate-x-1/2 font-black text-xl pointer-events-none animate-float-up ${
                phase === "correct" ? "text-brand" : "text-muted-foreground"
              }`}
            >
              {phase === "correct" ? `+${lastGain}s` : "−1s"}
            </div>
          )}
          {options.map((opt) => {
            const isPicked = picked === opt;
            const isCorrect = card && opt === card.back;
            let cls = "border-2 border-foreground bg-background text-foreground";
            if (phase === "correct" && isPicked) cls = "animate-flash-orange";
            else if (phase === "wrong" && isPicked)
              cls = "bg-foreground text-background border-foreground";
            else if (phase === "wrong" && isCorrect)
              cls = "border-brand bg-brand text-brand-foreground";

            return (
              <button
                key={opt}
                disabled={phase !== "answer"}
                onClick={() => pick(opt)}
                className={`w-full text-left font-semibold px-5 py-4 rounded-xl transition-all duration-200 min-h-[48px] ${cls}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </main>

      {reelBank > 0 && (
        <button
          onClick={() => navigate({ to: "/reels" })}
          className="fixed bottom-6 right-6 bg-brand text-brand-foreground rounded-full shadow-lg px-5 h-14 flex items-center gap-2 font-bold hover:opacity-90 transition"
        >
          <Film className="w-5 h-5" /> Watch Reels
        </button>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`border-2 border-foreground rounded-xl p-4 ${accent ? "bg-brand text-brand-foreground border-brand" : ""}`}>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-[10px] uppercase tracking-wider font-bold mt-1 opacity-80">{label}</div>
    </div>
  );
}

function StreakChip({ streak }: { streak: number }) {
  const onFire = streak > STREAK_THRESHOLD;
  if (streak === 0) {
    return (
      <div className="border-2 border-foreground/30 text-muted-foreground font-bold px-3 py-2 rounded-full text-sm flex items-center gap-1">
        <Flame className="w-4 h-4" /> 0
      </div>
    );
  }
  if (onFire) {
    return (
      <div
        className="font-black px-3 py-2 rounded-full text-sm flex items-center gap-1 text-white shadow-lg animate-pulse"
        style={{
          background: "linear-gradient(135deg, #ff5722, #ff9800, #ffc107)",
        }}
        title={`+${STREAK_BONUS}s bonus per correct answer`}
      >
        <Flame className="w-4 h-4 fill-white" /> {streak} 🔥
      </div>
    );
  }
  return (
    <div className="border-2 border-foreground bg-card font-bold px-3 py-2 rounded-full text-sm flex items-center gap-1">
      <Flame className="w-4 h-4" /> {streak}
    </div>
  );
}
