import OpenAI from "openai";
import { env } from "../config/env.js";

const openai = new OpenAI({
  apiKey: env.openaiApiKey
});

export async function generateAnalysis(payload) {
  const prompt = `
Szülői kérdőív alapján készíts rövid, strukturált értékelést.

Típus: ${payload.type}
Pontszám: ${payload.score}

Adj:
- rövid összefoglalót
- 3 megfigyelési pontot
- 3 javaslatot

Fontos:
- ez nem diagnózis
- legyen szülőbarát, nyugodt hangvételű
- rövid, érthető, strukturált legyen
`;

  const response = await openai.chat.completions.create({
    model: env.openaiModel,
    messages: [
      { role: "system", content: "Gyermek fejlődési mintázatokkal kapcsolatos, szülőbarát összefoglalót készítő szakértő vagy." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7
  });

  return response.choices?.[0]?.message?.content?.trim() || "";
}