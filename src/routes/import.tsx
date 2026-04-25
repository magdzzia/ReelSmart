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
    <div className="min-h-screen bg-background text-foreground pb-40">
      <div className="max-w-md mx-auto px-6 pt-10">
        {/* Header */}
        <header className="flex items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-muted-foreground">
              ai · paste notes
            </p>
            <h1 className="text-5xl font-bold tracking-tight leading-none mt-2">
              import.
            </h1>
          </div>
          <Link
            to="/"
            className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-brand/40 transition"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </header>

        {!cards ? (
          <>
            <div className="bg-card rounded-2xl border border-border px-5 py-4 mb-3">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                your notes
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="paste lecture notes, a chapter summary, vocab list..."
                rows={12}
                className="w-full bg-transparent outline-none text-base placeholder:text-muted-foreground/50 resize-none"
              />
            </div>

            {error && (
              <p className="text-brand font-semibold text-sm mt-3 text-center">
                {error}
              </p>
            )}

            <button
              onClick={generate}
              disabled={loading}
              className="mt-3 w-full rounded-2xl border-2 border-dashed border-brand/60 text-brand hover:bg-brand/5 transition py-5 text-center font-semibold tracking-tight disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> thinking...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> generate flashcards
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-muted-foreground/60 mt-10 tracking-wider">
              ai builds it · review before saving
            </p>
          </>
        ) : (
          <>
            {/* Deck name card */}
            <div className="bg-card rounded-2xl border border-border px-5 py-4 mb-3">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                deck name
              </p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-lg font-semibold tracking-tight bg-transparent outline-none placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                {cards.length} {cards.length === 1 ? "card" : "cards"} · review
              </p>
              <button
                onClick={() => {
                  setCards(null);
                  setName("");
                }}
                className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground hover:text-brand transition"
              >
                start over
              </button>
            </div>

            <div className="space-y-3">
              {cards.map((c, i) => (
                <div
                  key={i}
                  className="bg-card rounded-2xl border border-border overflow-hidden"
                >
                  <div className="px-5 pt-4 pb-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                        card {String(i + 1).padStart(2, "0")}
                      </span>
                      <button
                        onClick={() => removeCard(i)}
                        className="text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1 text-muted-foreground hover:text-brand transition"
                        aria-label="Delete card"
                      >
                        <Trash2 className="w-3 h-3" /> remove
                      </button>
                    </div>
                    <input
                      value={c.front}
                      onChange={(e) => updateCard(i, "front", e.target.value)}
                      placeholder="front — question"
                      className="w-full text-base font-semibold tracking-tight bg-transparent outline-none placeholder:text-muted-foreground/50 mb-2"
                    />
                    <input
                      value={c.back}
                      onChange={(e) => updateCard(i, "back", e.target.value)}
                      placeholder="back — answer"
                      className="w-full text-sm bg-transparent outline-none text-muted-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <div className="px-5 pb-4">
                    <div className="h-[3px] w-full bg-muted/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand transition-all duration-300"
                        style={{
                          width: `${
                            (c.front.trim() ? 50 : 0) + (c.back.trim() ? 50 : 0)
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <p className="text-brand font-semibold text-sm mt-4 text-center">
                {error}
              </p>
            )}

            <p className="text-center text-[11px] text-muted-foreground/60 mt-10 tracking-wider">
              minimum 2 cards · multiple-choice
            </p>

            {/* Sticky submit bar */}
            <div className="fixed left-0 right-0 px-6 pb-4 pt-3 bg-gradient-to-t from-background via-background to-transparent bottom-[calc(6rem+env(safe-area-inset-bottom))]">
              <div className="max-w-md mx-auto">
                <button
                  onClick={submit}
                  className="w-full bg-brand text-brand-foreground font-bold tracking-tight py-4 rounded-2xl text-base hover:opacity-90 transition"
                >
                  submit deck
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
