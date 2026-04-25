import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Trash2, Plus, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/new")({
  head: () => ({
    meta: [
      { title: "New Deck — ReelSmart" },
      { name: "description", content: "Create a new flashcard deck." },
    ],
  }),
  component: NewDeck,
});

type Slot = { id: string; front: string; back: string };
const newSlot = (): Slot => ({ id: Math.random().toString(36).slice(2), front: "", back: "" });

function NewDeck() {
  const navigate = useNavigate();
  const { createDeck } = useStore();
  const [name, setName] = useState("");
  const [slots, setSlots] = useState<Slot[]>([newSlot(), newSlot()]);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const update = (id: string, key: "front" | "back", val: string) =>
    setSlots((s) => s.map((x) => (x.id === id ? { ...x, [key]: val } : x)));
  const remove = (id: string) => setSlots((s) => s.filter((x) => x.id !== id));
  const add = () => setSlots((s) => [...s, newSlot()]);

  const save = () => {
    const valid = slots.filter((s) => s.front.trim() && s.back.trim());
    if (valid.length < 2 || !name.trim()) {
      setError(
        !name.trim()
          ? "Give your deck a name."
          : "Add at least 2 cards to save your deck."
      );
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    const id = createDeck(name.trim(), valid);
    navigate({ to: "/study/$deckId", params: { deckId: id } });
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-40">
      <div className="max-w-md mx-auto px-6 pt-10">
        {/* Header — match home page typography */}
        <header className="flex items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-muted-foreground">
              create
            </p>
            <h1 className="text-5xl font-bold tracking-tight leading-none mt-2">
              new deck.
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

        {/* Deck name card */}
        <div className="bg-card rounded-2xl border border-border px-5 py-4 mb-3">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
            deck name
          </p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. biology chapter 3"
            className="w-full text-lg font-semibold tracking-tight bg-transparent outline-none placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Cards */}
        <div className="space-y-3">
          {slots.map((s, i) => (
            <div
              key={s.id}
              className="bg-card rounded-2xl border border-border overflow-hidden"
            >
              <div className="px-5 pt-4 pb-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                    card {String(i + 1).padStart(2, "0")}
                  </span>
                  <button
                    onClick={() => remove(s.id)}
                    className="text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1 text-muted-foreground hover:text-brand transition"
                    aria-label="Delete card"
                  >
                    <Trash2 className="w-3 h-3" /> remove
                  </button>
                </div>
                <input
                  value={s.front}
                  onChange={(e) => update(s.id, "front", e.target.value)}
                  placeholder="front — question"
                  className="w-full text-base font-semibold tracking-tight bg-transparent outline-none placeholder:text-muted-foreground/50 mb-2"
                />
                <input
                  value={s.back}
                  onChange={(e) => update(s.id, "back", e.target.value)}
                  placeholder="back — answer"
                  className="w-full text-sm bg-transparent outline-none text-muted-foreground placeholder:text-muted-foreground/50"
                />
              </div>
              {/* hairline accent matching home deck cards */}
              <div className="px-5 pb-4">
                <div className="h-[3px] w-full bg-muted/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand transition-all duration-300"
                    style={{
                      width: `${
                        (s.front.trim() ? 50 : 0) + (s.back.trim() ? 50 : 0)
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Add card — dashed lime outline like "+ new deck" */}
          <button
            onClick={add}
            className="block w-full rounded-2xl border-2 border-dashed border-brand/60 text-brand hover:bg-brand/5 transition py-5 text-center font-semibold tracking-tight"
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="w-4 h-4" strokeWidth={2.5} /> add card
            </span>
          </button>
        </div>

        {error && (
          <p className="text-brand font-semibold text-sm mt-4 text-center">
            {error}
          </p>
        )}

        <p className="text-center text-[11px] text-muted-foreground/60 mt-10 tracking-wider">
          minimum 2 cards · multiple-choice
        </p>
      </div>

      {/* Sticky save bar — sits above footer nav */}
      <div className="fixed left-0 right-0 px-6 pb-4 pt-3 bg-gradient-to-t from-background via-background to-transparent bottom-[calc(6rem+env(safe-area-inset-bottom))]">
        <div className="max-w-md mx-auto">
          <button
            onClick={save}
            className={`w-full bg-brand text-brand-foreground font-bold tracking-tight py-4 rounded-2xl text-base hover:opacity-90 transition ${
              shake ? "animate-shake" : ""
            }`}
          >
            save deck
          </button>
        </div>
      </div>
    </div>
  );
}
