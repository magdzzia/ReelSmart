export type Card = { id: string; front: string; back: string; correctOnce?: boolean };
export type Deck = { id: string; name: string; cards: Card[]; createdAt: number };

const KEY = "quizreel.decks.v1";

export function loadDecks(): Deck[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Deck[]) : [];
  } catch {
    return [];
  }
}

export function saveDecks(decks: Deck[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(decks));
}

export function deckMastery(deck: Deck): number {
  if (!deck.cards.length) return 0;
  const known = deck.cards.filter((c) => c.correctOnce).length;
  return Math.round((known / deck.cards.length) * 100);
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
