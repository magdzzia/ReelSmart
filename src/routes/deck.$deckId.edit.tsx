import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Plus, Trash2, Check, X, ArrowLeft, Pencil } from "lucide-react";

export const Route = createFileRoute("/deck/$deckId/edit")({
  component: EditDeck,
});

function EditDeck() {
  const { deckId } = Route.useParams();
  const { decks, renameDeck, addCard, updateCard, deleteCard } = useStore();
  const navigate = useNavigate();

  const deck = decks.find((d) => d.id === deckId);

  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ front: "", back: "" });

  // Deck name editing
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(deck?.name ?? "");

  // Confirm delete card
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!deck) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
        Deck not found.
      </div>
    );
  }

  const startEdit = (cardId: string, front: string, back: string) => {
    setEditingCardId(cardId);
    setDraft({ front, back });
    setConfirmDeleteId(null);
  };

  const saveEdit = () => {
    if (!draft.front.trim() || !draft.back.trim()) return;
    updateCard(deckId, editingCardId!, draft);
    setEditingCardId(null);
  };

  const cancelEdit = () => setEditingCardId(null);

  const handleAddCard = () => {
    // Add a blank card then immediately open it for editing
    // We need the new card's id — add it, then find it
    addCard(deckId, { front: "New question", back: "New answer" });
    // The new card will be last in the deck after store updates
    // Use a small timeout to let state settle
    setTimeout(() => {
      const updated = decks.find((d) => d.id === deckId);
      const last = updated?.cards[updated.cards.length - 1];
      if (last) startEdit(last.id, last.front, last.back);
    }, 50);
  };

  const saveName = () => {
    if (nameDraft.trim()) renameDeck(deckId, nameDraft.trim());
    setEditingName(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-md mx-auto px-6 pt-10 pb-24">

        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate({ to: "/" })}
              className="text-muted-foreground hover:text-foreground transition shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {editingName ? (
              <div className="flex items-center gap-2 min-w-0">
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                  className="bg-background border border-brand rounded-lg px-3 py-1.5 text-lg font-bold tracking-tight focus:outline-none w-40"
                />
                <button onClick={saveName} className="text-brand">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setEditingName(false)} className="text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setEditingName(true); setNameDraft(deck.name); }}
                className="flex items-center gap-2 min-w-0 group"
              >
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-muted-foreground text-left">
                    editing
                  </p>
                  <h1 className="text-2xl font-bold tracking-tight leading-none mt-1 truncate max-w-[180px] text-left">
                    {deck.name}
                  </h1>
                </div>
                <Pencil className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition shrink-0" />
              </button>
            )}
          </div>

          <span className="text-xs text-muted-foreground shrink-0">
            {deck.cards.length} {deck.cards.length === 1 ? "card" : "cards"}
          </span>
        </header>

        {/* Card list */}
        <div className="space-y-2">
          {deck.cards.map((card) => (
            <div
              key={card.id}
              className="bg-card rounded-2xl border border-border overflow-hidden"
            >
              {editingCardId === card.id ? (
                // ── Edit mode ──────────────────────────────────────
                <div className="p-4 space-y-2">
                  <input
                    autoFocus
                    value={draft.front}
                    onChange={(e) => setDraft({ ...draft, front: e.target.value })}
                    placeholder="Question / front"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand"
                  />
                  <input
                    value={draft.back}
                    onChange={(e) => setDraft({ ...draft, back: e.target.value })}
                    placeholder="Answer / back"
                    onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand"
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={saveEdit}
                      className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-brand text-black px-3 py-1.5 rounded-lg"
                    >
                      <Check className="w-3 h-3" /> save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-1.5 rounded-lg border border-border"
                    >
                      <X className="w-3 h-3" /> cancel
                    </button>
                    {/* Delete with confirm */}
                    {confirmDeleteId === card.id ? (
                      <button
                        onClick={() => { deleteCard(deckId, card.id); setEditingCardId(null); setConfirmDeleteId(null); }}
                        className="ml-auto flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-brand px-3 py-1.5 rounded-lg border border-brand transition"
                      >
                        <Trash2 className="w-3 h-3" /> confirm
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(card.id)}
                        className="ml-auto flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border transition"
                      >
                        <Trash2 className="w-3 h-3" /> delete
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                // ── View mode ──────────────────────────────────────
                <button
                  onClick={() => startEdit(card.id, card.front, card.back)}
                  className="w-full flex items-center justify-between px-4 py-3 gap-3 text-left hover:bg-muted/30 transition"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{card.front}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{card.back}</p>
                  </div>
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </button>
              )}
            </div>
          ))}

          {/* Add card */}
          <button
            onClick={handleAddCard}
            className="w-full flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider font-bold text-brand border-2 border-dashed border-brand/50 rounded-2xl py-4 hover:bg-brand/5 transition"
          >
            <Plus className="w-3.5 h-3.5" /> add card
          </button>
        </div>

      </div>
    </div>
  );
}