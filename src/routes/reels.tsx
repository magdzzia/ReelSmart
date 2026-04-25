import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import type { Card } from "@/lib/storage";
import { ArrowLeft, Sparkles } from "lucide-react";

export const Route = createFileRoute("/reels")({
  component: Reels,
});

const SHORT_IDS = ["J28Kqt5Yoks", "GOwYdvWKGz4", "-nmRlTogqrQ", "fxfge0tBWXs", "uPSZPRQLqto"];

// Seconds awarded for correctly answering the rescue flashcard
const RESCUE_REWARD = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// --- YouTube IFrame API loader (singleton) ---
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytReadyPromise: Promise<any> | null = null;
function loadYT(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytReadyPromise) return ytReadyPromise;
  ytReadyPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return ytReadyPromise;
}

function Reels() {
  const navigate = useNavigate();
  const { reelBank, setReelBank, addReelSeconds, decks, markCorrect } = useStore();
  const [seconds, setSeconds] = useState(reelBank);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showRescue, setShowRescue] = useState(false);
  const [rescueUsed, setRescueUsed] = useState(false);
  const videosRef = useRef<string[]>(shuffle(SHORT_IDS));
  const scrollerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const playerElId = "yt-reel-player";

  // Pool of cards for rescue prompt (any deck)
  const cardPool = useMemo<Array<{ card: Card; deckId: string }>>(() => {
    const out: Array<{ card: Card; deckId: string }> = [];
    decks.forEach((d) => d.cards.forEach((c) => out.push({ card: c, deckId: d.id })));
    return out;
  }, [decks]);

  // Sync local seconds → store on unmount/back
  const syncBack = useCallback(() => {
    setReelBank(seconds);
  }, [seconds, setReelBank]);

  // Track which slide is in view
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            const i = Number((e.target as HTMLElement).dataset.idx);
            if (!Number.isNaN(i)) setActiveIdx(i);
          }
        });
      },
      { root, threshold: [0.6] },
    );
    root.querySelectorAll("[data-idx]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Build/replace YT player when active video changes
  useEffect(() => {
    let cancelled = false;
    const videoId = videosRef.current[activeIdx];
    if (!videoId) return;

    setShowRescue(false);

    loadYT().then((YT) => {
      if (cancelled) return;
      // Destroy previous
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
      const host = document.getElementById(playerElId);
      if (!host) return;
      // Reset host (YT replaces the element)
      host.innerHTML = "";
      const inner = document.createElement("div");
      inner.id = `${playerElId}-inner`;
      host.appendChild(inner);

      playerRef.current = new YT.Player(inner.id, {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: (e: any) => {
            try { e.target.playVideo(); } catch {}
          },
        },
      });
    });

    return () => {
      cancelled = true;
    };
  }, [activeIdx]);

  // Countdown only while playing AND seconds > 0
  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => {
      const p = playerRef.current;
      let isPlaying = false;
      try {
        // 1 = playing
        isPlaying = p && p.getPlayerState && p.getPlayerState() === 1;
      } catch {}
      if (!isPlaying) return;
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [seconds]);

  // When seconds hit 0 mid-video → pause + show rescue (first time only) or empty overlay
  useEffect(() => {
    if (seconds > 0) return;
    const p = playerRef.current;
    if (!p) return;
    try {
      const state = p.getPlayerState?.();
      // If video is currently playing or paused (i.e. not ended), trigger overlay
      if (state === 1 || state === 2 || state === 3) {
        try { p.pauseVideo(); } catch {}
        setShowRescue(true);
      }
    } catch {}
  }, [seconds]);

  const goBack = () => {
    setReelBank(seconds);
    navigate({ to: "/" });
  };

  const onRescueSolved = (deckId: string, cardId: string) => {
    markCorrect(deckId, cardId);
    addReelSeconds(RESCUE_REWARD);
    setSeconds((s) => s + RESCUE_REWARD);
    setRescueUsed(true);
    setShowRescue(false);
    try { playerRef.current?.playVideo(); } catch {}
  };

  const onRescueSkip = () => {
    setShowRescue(false);
    syncBack();
    navigate({ to: "/" });
  };

  return (
    <div className="fixed inset-0 bg-foreground text-background flex flex-col">
      <header className="flex items-center justify-between px-4 pt-4 pb-3 z-10">
        <button
          onClick={goBack}
          className="flex items-center gap-1 text-background font-bold text-sm px-3 py-2 rounded-lg hover:bg-white/10 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="font-black text-lg">
          ReelSmart
          <span className="inline-block w-2 h-2 rounded-full bg-brand ml-1 align-middle" />
        </div>
        <div
          className={`font-bold px-3 py-1.5 rounded-full text-sm tabular-nums ${
            seconds > 0 ? "bg-brand text-brand-foreground" : "bg-white/15 text-background"
          }`}
        >
          🎬 {seconds}s
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden">
        <div ref={scrollerRef} className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar">
          {videosRef.current.map((id, i) => (
            <div
              key={`${id}-${i}`}
              data-idx={i}
              className="h-full w-full snap-start flex items-center justify-center px-4"
            >
              <div className="w-full max-w-sm aspect-[9/16] bg-black rounded-2xl overflow-hidden border border-white/10 relative">
                {i === activeIdx ? (
                  <div id={playerElId} className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full" />
                ) : Math.abs(i - activeIdx) <= 1 ? (
                  // Lightweight preview thumbnail for neighbors
                  <img
                    src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
                    alt=""
                    className="w-full h-full object-cover opacity-70"
                  />
                ) : null}

                {/* Rescue / empty overlay — only on the active video */}
                {i === activeIdx && showRescue && (
                  rescueUsed ? (
                    <EmptyOverlay onBack={onRescueSkip} />
                  ) : (
                    <RescueOverlay
                      pool={cardPool}
                      onSolved={onRescueSolved}
                      onSkip={onRescueSkip}
                    />
                  )
                )}
              </div>
            </div>
          ))}
          <div className="h-2" />
        </div>

        {seconds > 0 && !showRescue && (
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-background/50 font-medium pointer-events-none">
            Swipe up for next ↑
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------- Rescue Overlay ----------------

function RescueOverlay({
  pool,
  onSolved,
  onSkip,
}: {
  pool: Array<{ card: Card; deckId: string }>;
  onSolved: (deckId: string, cardId: string) => void;
  onSkip: () => void;
}) {
  const pick = useMemo(() => {
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [pool]);

  const options = useMemo(() => {
    if (!pick) return [] as string[];
    const correct = pick.card.back;
    const distractorPool = Array.from(
      new Set(
        pool
          .filter((p) => p.card.id !== pick.card.id)
          .map((p) => p.card.back)
          .filter((b) => b && b !== correct),
      ),
    );
    const distractors = shuffle(distractorPool).slice(0, 3);
    return shuffle([correct, ...distractors]);
  }, [pick, pool]);

  const [picked, setPicked] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  if (!pick) {
    return <EmptyOverlay onBack={onSkip} />;
  }

  const handlePick = (opt: string) => {
    if (locked) return;
    setPicked(opt);
    setLocked(true);
    if (opt === pick.card.back) {
      // Brief delay so user sees the green confirmation
      setTimeout(() => onSolved(pick.deckId, pick.card.id), 600);
    }
  };

  const isCorrect = picked === pick.card.back;
  const showResult = locked;

  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex flex-col items-center justify-center text-center px-5 py-6 text-white">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-white/70 mb-3">
        <Sparkles className="w-3 h-3 text-brand" />
        Out of reel time
      </div>
      <p className="text-lg font-black mb-1 leading-tight text-white">Answer to keep watching</p>
      <p className="text-xs text-white/70 mb-4">
        One shot · +{RESCUE_REWARD}s if you nail it
      </p>

      <div className="w-full max-w-[300px] bg-black/60 border-2 border-white/20 text-white rounded-2xl p-4 shadow-xl mb-3">
        <p className="text-[10px] uppercase tracking-wider font-bold text-white/60 mb-1.5">
          Question
        </p>
        <p className="font-bold text-sm leading-snug text-white">{pick.card.front}</p>
      </div>

      <div className="w-full max-w-[300px] flex flex-col gap-2">
        {options.map((opt, i) => {
          const isThisCorrect = opt === pick.card.back;
          const isPicked = picked === opt;
          let cls =
            "w-full text-left font-bold text-sm py-3 px-4 rounded-xl min-h-[48px] border-2 transition";
          if (!showResult) {
            cls += " bg-black/50 text-white border-white/20 hover:bg-black/70 hover:border-white/40";
          } else if (isThisCorrect) {
            cls += " bg-brand text-brand-foreground border-brand";
          } else if (isPicked) {
            cls += " bg-red-500/30 text-white border-red-500/70";
          } else {
            cls += " bg-black/40 text-white/50 border-white/10";
          }
          return (
            <button key={i} onClick={() => handlePick(opt)} disabled={locked} className={cls}>
              <span className="inline-block w-5 opacity-50 mr-1">
                {String.fromCharCode(65 + i)}.
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {showResult && !isCorrect && (
        <div className="mt-4 w-full max-w-[300px] flex flex-col gap-2">
          <p className="text-sm font-bold text-white/90">
            Not quite. No more rescues this session.
          </p>
          <button
            onClick={onSkip}
            className="w-full bg-brand text-brand-foreground font-bold py-3 rounded-xl min-h-[48px]"
          >
            Back to studying
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyOverlay({ onBack }: { onBack: () => void }) {
  return (
    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-center px-6 text-white">
      <p className="text-2xl font-black text-white">Reel Bank empty</p>
      <p className="text-sm text-white/80 mt-2 max-w-[240px]">
        Answer more questions in your decks to earn more reel seconds.
      </p>
      <button
        onClick={onBack}
        className="mt-6 bg-brand text-brand-foreground font-bold px-6 py-3 rounded-xl min-h-[48px]"
      >
        Back to studying
      </button>
    </div>
  );
}
