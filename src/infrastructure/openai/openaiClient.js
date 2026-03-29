import OpenAI from "openai";
import { env } from "../config/env.js";

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export const openaiClient = {
  async generate(prompt) {
    const res = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    return res.output_text;
  },
};