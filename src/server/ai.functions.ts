import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  notes: z.string().min(20).max(20000),
});

type Card = { front: string; back: string };

export const generateCardsFromNotes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<{ name: string; cards: Card[]; error: string | null }> => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return { name: "", cards: [], error: "AI is not configured." };
    }

    const prompt = `You convert study notes into concise flashcards.

Return ONLY a valid JSON object in this exact format, no markdown, no backticks, nothing else:
{
  "name": "Short deck name (max 5 words)",
  "cards": [
    { "front": "Question here", "back": "Answer here" }
  ]
}

Generate between 4 and 20 high quality cards from these notes:

${data.notes}`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 4096,
            },
          }),
        }
      );

      if (response.status === 429) {
        return { name: "", cards: [], error: "Rate limit hit. Please wait a moment and try again." };
      }
      if (!response.ok) {
        const txt = await response.text();
        console.error("Gemini error:", response.status, txt);
        return { name: "", cards: [], error: `AI request failed (${response.status}).` };
      }

      const json = await response.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        return { name: "", cards: [], error: "AI did not return cards." };
      }

      // Strip markdown fences if Gemini adds them anyway
      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();

      const parsed = JSON.parse(cleaned);

      const cards: Card[] = Array.isArray(parsed?.cards)
        ? parsed.cards
            .filter((c: any) => typeof c?.front === "string" && typeof c?.back === "string")
            .map((c: any) => ({ front: String(c.front).trim(), back: String(c.back).trim() }))
            .filter((c: Card) => c.front && c.back)
        : [];

      const name = typeof parsed?.name === "string" ? parsed.name.trim() : "Imported Notes";

      if (cards.length < 2) {
        return { name: "", cards: [], error: "Could not generate enough cards. Add more detail to your notes." };
      }

      return { name: name || "Imported Notes", cards, error: null };
    } catch (e) {
      console.error("generateCardsFromNotes failed:", e);
      return { name: "", cards: [], error: "Something went wrong. Try again." };
    }
  });