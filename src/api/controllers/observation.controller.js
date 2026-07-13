import path from "path";
import {
  buildObservationTrend,
  getObservationProgramByToken,
  listObservationEntries,
  saveObservationEntry
} from "../../services/observation-program.service.js";
import { getPlusContent } from "../../services/plus-content.service.js";

function publicProgram(program, entries) {
  return {
    status: program.status,
    lang: program.lang || "en",
    focusDomain: program.focus_domain || null,
    startsAt: program.starts_at,
    endsAt: program.ends_at,
    entries,
    trend: buildObservationTrend(entries),
    content: getPlusContent(program.lang || "en")
  };
}

async function resolveProgram(req, res) {
  const program = await getObservationProgramByToken(req.params.token);

  if (!program || program.payment_status !== "paid") {
    res.status(404).json({ ok: false, error: "Observation program not found." });
    return null;
  }

  return program;
}

export function showObservationDiary(_req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
  );
  return res.sendFile(path.join(process.cwd(), "public", "observation-diary.html"));
}

export async function getObservationDiary(req, res) {
  try {
    const program = await resolveProgram(req, res);
    if (!program) return;

    const entries = await listObservationEntries(program.id);

    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(200).json({
      ok: true,
      program: publicProgram(program, entries)
    });
  } catch (error) {
    console.error("[observation] status failed", { message: error?.message });
    return res.status(500).json({ ok: false, error: "Failed to load observation diary." });
  }
}

export async function upsertObservationEntry(req, res) {
  try {
    const program = await resolveProgram(req, res);
    if (!program) return;

    const entry = await saveObservationEntry(program, req.body || {});
    const entries = await listObservationEntries(program.id);

    res.setHeader("Cache-Control", "no-store, max-age=0");
    return res.status(200).json({
      ok: true,
      entry,
      trend: buildObservationTrend(entries)
    });
  } catch (error) {
    const message = error?.message || "Failed to save observation.";
    const clientError = /Invalid|must|outside|not active/i.test(message);
    return res.status(clientError ? 400 : 500).json({ ok: false, error: message });
  }
}
