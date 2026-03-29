import OpenAI from "openai";
import { env } from "../config/env.js";

const client = new OpenAI({
  apiKey: env.OPENAI_API_KEY
});

function normalizePayload(payload) {
  if (!payload) {
    throw new Error("Missing payload for analysis.");
  }

  if (typeof payload === "string") {
    return payload;
  }

  return JSON.stringify(payload, null, 2);
}

function buildPrompt(payloadText) {
  return `
Az alábbi kérdőív-adatok alapján készíts egy szülőbarát, jól strukturált, magyar nyelvű összefoglalót.

Fontos szabályok:
- Ez nem diagnózis.
- Ne használj ijesztő vagy végleges kijelentéseket.
- Tárgyilagos, empatikus, nyugodt hangvételű legyen.
- Rövid, jól tagolt, könnyen érthető legyen.
- Ne címkézd a gyermeket.
- A megfogalmazás legyen támogató, nem ítélkező.
- A végén legyen néhány gyakorlati, hétköznapi javaslat.
- Jelezd, hogy szükség esetén személyes szakértői vizsgálat javasolt.

Felépítés:
1. Rövid összefoglaló
2. Főbb megfigyelések
3. Lehetséges fókuszterületek
4. Gyakorlati javaslatok otthonra
5. Rövid záró megjegyzés arról, hogy ez nem helyettesít szakértői vizsgálatot

Kérdőív adatok:
${payloadText}
  `.trim();
}

export async function generateAnalysis(payload) {
  const payloadText = normalizePayload(payload);
  const prompt = buildPrompt(payloadText);

  const response = await client.chat.completions.create({
    model: env.OPENAI_MODEL || "gpt-4.1-mini",
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content:
          "Te egy szülőbarát, szakmailag óvatos elemző vagy, aki gyermekfejlődési kérdőívek alapján készít strukturált, nem diagnosztikus összefoglalót."
      },
      {
        role: "user",
        content: prompt
      }
    ]
  });

  const content = response.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenAI returned empty analysis.");
  }

  return content;
}