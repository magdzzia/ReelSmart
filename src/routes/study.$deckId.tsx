import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useStore, STREAK_THRESHOLD, STREAK_BONUS } from "@/lib/store";
import type { Card } from "@/lib/storage";
import { ArrowLeft, RotateCcw, Zap, ArrowRight } from "lucide-react";

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
          <p className="font-bold text-xl">deck not found</p>
          <Link to="/" className="text-brand font-bold underline mt-2 inline-block">go home</Link>
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
        <div className="max-w-sm w-full">
          <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-muted-foreground">
            round complete
          </p>
          <h1 className="text-5xl font-bold tracking-tight mt-2">nice run.</h1>
          <p className="text-muted-foreground mt-2 text-sm">{deck.name}</p>

          <div className="grid grid-cols-3 gap-3 mt-8">
            <Stat label="right" value={correct.toString()} />
            <Stat label="wrong" value={wrong.toString()} />
            <Stat label="earned" value={`${earned}s`} accent />
          </div>

          <div className="mt-8 space-y-3">
            <button
              disabled={reelBank <= 0}
              onClick={() => navigate({ to: "/bank" })}
              className="w-full bg-brand text-brand-foreground rounded-full py-4 font-bold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              cash in <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={restart}
              className="w-full border border-border rounded-full py-4 font-semibold flex items-center justify-center gap-2 hover:bg-card transition text-sm"
            >
              <RotateCcw className="w-4 h-4" /> study again
            </button>
            <Link to="/" className="block text-center text-muted-foreground text-xs pt-2 font-medium">
              back to decks
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const total = order.length;
  const onFire = streak > STREAK_THRESHOLD;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-md mx-auto px-6 pt-6">
        {/* Top status bar — matches mockup: Q 03/10 · DECK · ⚡12s */}
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] font-semibold text-muted-foreground">
          <Link to="/" aria-label="Back" className="flex items-center gap-1.5 hover:text-foreground">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>q {String(idx + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}</span>
            <span>·</span>
            <span className="truncate max-w-[90px]">{deck.name}</span>
          </Link>
          <span className={`inline-flex items-center gap-1 ${onFire ? "text-brand" : ""}`}>
            <Zap className="w-3.5 h-3.5" /> {reelBank}s
          </span>
        </div>

        {/* Progress hairline */}
        <div className="h-[2px] w-full bg-muted/50 rounded-full overflow-hidden mt-3">
          <div
            className="h-full bg-brand transition-all duration-300"
            style={{ width: `${((idx + 1) / total) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="mt-10 mb-8 min-h-[140px] relative">
          <h1 className="text-3xl font-bold tracking-tight leading-[1.15]">
            {card?.front}
          </h1>

          {toastKey > 0 && (phase === "correct" || phase === "wrong") && (
            <div
              key={toastKey}
              className={`absolute right-0 top-0 font-bold text-lg pointer-events-none animate-float-up ${
                phase === "correct" ? "text-brand" : "text-muted-foreground"
              }`}
              style={{ left: "auto", transform: "none" }}
            >
              {phase === "correct" ? `+${lastGain}s` : "−1s"}
            </div>
          )}
        </div>

        {/* Options A/B/C/D */}
        <div className="space-y-2.5">
          {options.map((opt, i) => {
            const isPicked = picked === opt;
            const isCorrect = card && opt === card.back;
            const letter = String.fromCharCode(65 + i);

            let cls = "bg-card border border-border text-foreground hover:border-brand/40";
            if (phase === "correct" && isPicked) {
              cls = "bg-brand text-brand-foreground border-brand";
            } else if (phase === "wrong" && isPicked) {
              cls = "bg-card border-border text-muted-foreground line-through";
            } else if (phase === "wrong" && isCorrect) {
              cls = "bg-brand text-brand-foreground border-brand";
            } else if (phase !== "answer") {
              cls = "bg-card border border-border text-muted-foreground";
            }

            return (
              <button
                key={opt}
                disabled={phase !== "answer"}
                onClick={() => pick(opt)}
                className={`w-full text-left font-semibold pl-4 pr-5 py-4 rounded-xl transition-all duration-150 min-h-[56px] flex items-center gap-3 ${cls}`}
              >
                <span
                  className={`text-[10px] uppercase tracking-wider font-bold w-4 ${
                    (phase === "correct" && isPicked) || (phase === "wrong" && isCorrect)
                      ? "opacity-70"
                      : "text-muted-foreground"
                  }`}
                >
                  {letter}
                </span>
                <span className="flex-1">{opt}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl p-4 ${
        accent ? "bg-brand text-brand-foreground" : "bg-card border border-border"
      }`}
    >
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-[10px] uppercase tracking-wider font-semibold mt-1 opacity-80">
        {label}
      </div>
    </div>
  );
}
