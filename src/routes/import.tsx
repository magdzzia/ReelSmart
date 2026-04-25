import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { generateCardsFromNotes } from "@/server/ai.functions";
import { ArrowLeft, Sparkles, Loader2, Trash2 } from "lucide-react";

export const Route = createFileRoute("/import")({
  head: () => ({
    meta: [
      { title: "Import Notes — ReelSmart" },
      { name: "description", content: "Paste notes and let AI build your flashcards." },
    ],
  }),
  component: ImportNotes,
});

type Card = { front: string; back: string };

function ImportNotes() {
  const navigate = useNavigate();
  const { createDeck } = useStore();
  const [notes, setNotes] = useState("");
  const [name, setName] = useState("");
  const [cards, setCards] = useState<Card[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (notes.trim().length < 20) {
      setError("Add at least 20 characters of notes.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await generateCardsFromNotes({ data: { notes: notes.trim() } });
      if (res.error) {
        setError(res.error);
      } else {
        setName(res.name);
        setCards(res.cards);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to generate cards.");
    } finally {
      setLoading(false);
    }
  };

  const updateCard = (i: number, key: "front" | "back", val: string) => {
    setCards((c) => (c ? c.map((x, idx) => (idx === i ? { ...x, [key]: val } : x)) : c));
  };
  const removeCard = (i: number) =>
    setCards((c) => (c ? c.filter((_, idx) => idx !== i) : c));

  const submit = () => {
    if (!cards) return;
    const valid = cards.filter((c) => c.front.trim() && c.back.trim());
    if (valid.length < 2 || !name.trim()) {
      setError("Need a name and at least 2 cards.");
      return;
    }
    const id = createDeck(name.trim(), valid);
    navigate({ to: "/study/$deckId", params: { deckId: id } });
  };

  return (
    <div className="min-h-screen bg-background pb-40">
      <header className="px-6 pt-8 pb-4 flex items-center gap-3">
        <Link
          to="/"
          className="w-10 h-10 rounded-lg border-2 border-foreground flex items-center justify-center hover:bg-foreground hover:text-background transition"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-brand" /> Import Notes
        </h1>
      </header>

      {!cards ? (
        <div className="px-6">
          <p className="text-sm text-muted-foreground mb-3">
            Paste your notes — AI will turn them into flashcards you can review and edit.
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste lecture notes, a chapter summary, vocab list..."
            rows={12}
            className="w-full border-2 border-foreground rounded-xl px-4 py-3 bg-card outline-none focus:ring-4 focus:ring-brand/30 placeholder:text-muted-foreground/60 resize-none"
          />
          {error && <p className="text-brand font-semibold text-sm mt-3">{error}</p>}
          <button
            onClick={generate}
            disabled={loading}
            className="mt-4 w-full bg-brand text-brand-foreground font-bold py-4 rounded-xl text-lg hover:opacity-90 transition min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Thinking...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" /> Generate Flashcards
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="px-6">
          <label className="block text-xs font-bold uppercase tracking-wider mb-2">
            Deck name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-xl font-bold border-2 border-foreground rounded-xl px-4 py-4 bg-card outline-none focus:ring-4 focus:ring-brand/30"
          />

          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Review {cards.length} {cards.length === 1 ? "card" : "cards"} before submitting.
            </p>
            <button
              onClick={() => {
                setCards(null);
                setName("");
              }}
              className="text-xs font-bold underline text-muted-foreground"
            >
              Start over
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {cards.map((c, i) => (
              <div key={i} className="border-2 border-foreground rounded-xl p-4 bg-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Card {i + 1}
                  </span>
                  <button
                    onClick={() => removeCard(i)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-foreground hover:text-background transition"
                    aria-label="Delete card"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  value={c.front}
                  onChange={(e) => updateCard(i, "front", e.target.value)}
                  placeholder="Front"
                  className="w-full font-semibold border-b-2 border-foreground/20 focus:border-brand pb-2 mb-3 outline-none bg-transparent"
                />
                <input
                  value={c.back}
                  onChange={(e) => updateCard(i, "back", e.target.value)}
                  placeholder="Back"
                  className="w-full border-b-2 border-foreground/20 focus:border-brand pb-2 outline-none bg-transparent"
                />
              </div>
            ))}
          </div>

          {error && <p className="text-brand font-semibold text-sm mt-4 text-center">{error}</p>}

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t-2 border-foreground">
            <button
              onClick={submit}
              className="w-full bg-brand text-brand-foreground font-bold py-4 rounded-xl text-lg hover:opacity-90 transition min-h-[48px]"
            >
              Submit Deck
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
