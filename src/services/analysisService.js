import OpenAI from "openai";
import { env } from "../config/env.js";

const openai = new OpenAI({
  apiKey: env.openaiApiKey
});

export async function runAnalysis(payload) {
  const prompt = `
Szülői kérdőív alapján készíts rövid, strukturált értékelést.

Típus: ${payload.type}
Pontszám: ${payload.score}

Adj:
- rövid összefoglalót
- 3 megfigyelési pontot
- 3 javaslatot

Fontos: nem diagnózis.
`;

  const response = await openai.chat.completions.create({
    model: env.openaiModel,
    messages: [
      { role: "system", content: "Gyermek fejlődési szakértő vagy." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7
  });

  return response.choices[0].message.content;
}