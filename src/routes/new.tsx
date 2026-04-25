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
    <div className="min-h-screen bg-background pb-40">
      <header className="px-6 pt-8 pb-4 flex items-center gap-3">
        <Link
          to="/"
          className="w-10 h-10 rounded-lg border-2 border-foreground flex items-center justify-center hover:bg-foreground hover:text-background transition"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-black">New Deck</h1>
      </header>

      <div className="px-6">
        <label className="block text-xs font-bold uppercase tracking-wider mb-2">
          Deck name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Biology Chapter 3"
          className="w-full text-xl font-bold border-2 border-foreground rounded-xl px-4 py-4 bg-card outline-none focus:ring-4 focus:ring-brand/30 placeholder:text-muted-foreground/60"
        />

        <div className="mt-8 space-y-4">
          {slots.map((s, i) => (
            <div key={s.id} className="border-2 border-foreground rounded-xl p-4 bg-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Card {i + 1}
                </span>
                <button
                  onClick={() => remove(s.id)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-foreground hover:text-background transition"
                  aria-label="Delete card"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <input
                value={s.front}
                onChange={(e) => update(s.id, "front", e.target.value)}
                placeholder="Front (question / term)"
                className="w-full font-semibold border-b-2 border-foreground/20 focus:border-brand pb-2 mb-3 outline-none bg-transparent placeholder:text-muted-foreground"
              />
              <input
                value={s.back}
                onChange={(e) => update(s.id, "back", e.target.value)}
                placeholder="Back (answer / definition)"
                className="w-full border-b-2 border-foreground/20 focus:border-brand pb-2 outline-none bg-transparent placeholder:text-muted-foreground"
              />
            </div>
          ))}
        </div>

        <button
          onClick={add}
          className="mt-4 w-full border-2 border-foreground rounded-xl py-4 font-bold flex items-center justify-center gap-2 hover:bg-foreground hover:text-background transition min-h-[48px]"
        >
          <Plus className="w-5 h-5" strokeWidth={3} /> Add Card
        </button>

        {error && (
          <p className="text-brand font-semibold text-sm mt-4 text-center">{error}</p>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t-2 border-foreground">
        <button
          onClick={save}
          className={`w-full bg-brand text-brand-foreground font-bold py-4 rounded-xl text-lg hover:opacity-90 transition min-h-[48px] ${shake ? "animate-shake" : ""}`}
        >
          Save Deck
        </button>
      </div>
    </div>
  );
}
