import { openai } from "../config/openai.js";
import { env } from "../config/env.js";
import { buildAnalysisPrompt } from "../utils/promptBuilder.js";
import { calculateFinalScore } from "../utils/scoring.js";

export async function generateAnalysis(payload) {
  const normalizedPayload = {
    ...payload,
    score:
      typeof payload.score === "number"
        ? payload.score
        : calculateFinalScore(payload.answers || [])
  };

  const prompt = buildAnalysisPrompt(normalizedPayload);

  const response = await openai.chat.completions.create({
    model: env.openaiModel,
    messages: [
      {
        role: "system",
        content:
          "You produce careful, parent-friendly developmental screening summaries."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.4
  });

  return response.choices?.[0]?.message?.content?.trim() || "";
}