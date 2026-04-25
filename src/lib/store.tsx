import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Deck, loadDecks, saveDecks, uid } from "./storage";

type Ctx = {
  decks: Deck[];
  reelBank: number;
  streak: number;
  bumpStreak: () => number;
  resetStreak: () => void;
  addReelSeconds: (n: number) => void;
  setReelBank: (n: number) => void;
  createDeck: (name: string, cards: { front: string; back: string }[]) => string;
  deleteDeck: (id: string) => void;
  getDeck: (id: string) => Deck | undefined;
  markCorrect: (deckId: string, cardId: string) => void;
};

const StoreCtx = createContext<Ctx | null>(null);

const BANK_KEY = "quizreel.bank.v1";
const STREAK_KEY = "quizreel.streak.v1";

export const STREAK_THRESHOLD = 10;
export const STREAK_BONUS = -0.5;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [reelBank, setReelBankState] = useState(0);
  const [streak, setStreakState] = useState(0);

  useEffect(() => {
    setDecks(loadDecks());
    try {
      const raw = localStorage.getItem(BANK_KEY);
      if (raw) setReelBankState(Math.max(0, parseInt(raw, 10) || 0));
      const s = localStorage.getItem(STREAK_KEY);
      if (s) setStreakState(Math.max(0, parseInt(s, 10) || 0));
    } catch {}
  }, []);

  const persistBank = (n: number) => {
    setReelBankState(n);
    try { localStorage.setItem(BANK_KEY, String(n)); } catch {}
  };

  const persist = (next: Deck[]) => {
    setDecks(next);
    saveDecks(next);
  };

  const createDeck = useCallback((name: string, cards: { front: string; back: string }[]) => {
    const id = uid();
    const deck: Deck = {
      id,
      name,
      createdAt: Date.now(),
      cards: cards.map((c) => ({ id: uid(), front: c.front, back: c.back, correctOnce: false })),
    };
    const next = [deck, ...loadDecks()];
    persist(next);
    return id;
  }, []);

  const deleteDeck = useCallback((id: string) => {
    const next = loadDecks().filter((d) => d.id !== id);
    persist(next);
  }, []);

  const getDeck = useCallback((id: string) => decks.find((d) => d.id === id), [decks]);

  const markCorrect = useCallback((deckId: string, cardId: string) => {
    const next = loadDecks().map((d) =>
      d.id === deckId
        ? { ...d, cards: d.cards.map((c) => (c.id === cardId ? { ...c, correctOnce: true } : c)) }
        : d
    );
    persist(next);
  }, []);

  const addReelSeconds = useCallback((n: number) => {
    setReelBankState((b) => {
      const next = Math.max(0, b + n);
      try { localStorage.setItem(BANK_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const setReelBank = useCallback((n: number) => persistBank(Math.max(0, n)), []);

  const bumpStreak = useCallback(() => {
    let nextVal = 0;
    setStreakState((s) => {
      nextVal = s + 1;
      try { localStorage.setItem(STREAK_KEY, String(nextVal)); } catch {}
      return nextVal;
    });
    return nextVal;
  }, []);

  const resetStreak = useCallback(() => {
    setStreakState(0);
    try { localStorage.setItem(STREAK_KEY, "0"); } catch {}
  }, []);

  return (
    <StoreCtx.Provider
      value={{ decks, reelBank, streak, bumpStreak, resetStreak, addReelSeconds, setReelBank, createDeck, deleteDeck, getDeck, markCorrect }}
    >
      {children}
    </StoreCtx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
