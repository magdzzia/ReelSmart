import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  notes: z.string().min(20).max(20000),
});

type Card = { front: string; back: string };

export const generateCardsFromNotes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<{ name: string; cards: Card[]; error: string | null }> => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) {
      return { name: "", cards: [], error: "AI is not configured." };
    }

    // NOTE: User requested "gemma4" — not available on Lovable AI Gateway.
    // Using google/gemini-2.5-flash: fast, reliable, and included in free tier.
    const model = "google/gemini-2.5-flash";

    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "You convert study notes into concise flashcards. Each card has a short clear question (front) and a short factual answer (back). Generate between 4 and 20 high-quality cards. Also propose a short deck name (max 5 words).",
            },
            { role: "user", content: data.notes },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "create_flashcards",
                description: "Return a deck name and an array of flashcards.",
                parameters: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Short deck name (max 5 words)" },
                    cards: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          front: { type: "string" },
                          back: { type: "string" },
                        },
                        required: ["front", "back"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["name", "cards"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "create_flashcards" } },
        }),
      });

      if (response.status === 429) {
        return { name: "", cards: [], error: "Rate limit hit. Please wait a moment and try again." };
      }
      if (response.status === 402) {
        return { name: "", cards: [], error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." };
      }
      if (!response.ok) {
        const txt = await response.text();
        console.error("AI gateway error:", response.status, txt);
        return { name: "", cards: [], error: `AI request failed (${response.status}).` };
      }

      const json = await response.json();
      const call = json?.choices?.[0]?.message?.tool_calls?.[0];
      const args = call?.function?.arguments;
      if (!args) return { name: "", cards: [], error: "AI did not return cards." };

      const parsed = JSON.parse(args);
      const cards: Card[] = Array.isArray(parsed?.cards)
        ? parsed.cards
            .filter((c: any) => typeof c?.front === "string" && typeof c?.back === "string")
            .map((c: any) => ({ front: String(c.front).trim(), back: String(c.back).trim() }))
            .filter((c: Card) => c.front && c.back)
        : [];
      const name = typeof parsed?.name === "string" ? parsed.name.trim() : "Imported Notes";

      if (cards.length < 2) {
        return { name: "", cards: [], error: "Could not generate enough cards. Add more detail." };
      }
      return { name: name || "Imported Notes", cards, error: null };
    } catch (e) {
      console.error("generateCardsFromNotes failed:", e);
      return { name: "", cards: [], error: "Something went wrong. Try again." };
    }
  });
