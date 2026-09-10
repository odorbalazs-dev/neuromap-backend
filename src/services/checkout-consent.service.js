import { db } from "../db/db.js";
import { claimConsentReceipt, assertCheckoutConsentActive, ConsentError } from "./consent.service.js";
import { createSession } from "./session.service.js";
import { assertSessionProcessingAllowedRecord } from "./data-governance.service.js";

export async function createConsentedSession(input, receipt, confirmations) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const claimed = await claimConsentReceipt(receipt, confirmations, { executor: client });
    const session = await createSession({ ...input, consent: claimed.snapshot, consentEventId: claimed.id }, { executor: client });
    await client.query("COMMIT");
    return { session, claimed };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function withCheckoutConsent(sessionId, action) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const reference = await client.query("SELECT consent_event_id FROM sessions WHERE id = $1", [sessionId]);
    // Use the same lock order as withdrawal: consent first, then the session.
    const consent = await client.query("SELECT * FROM consent_events WHERE id = $1 FOR UPDATE", [reference.rows[0]?.consent_event_id || null]);
    const result = await client.query("SELECT * FROM sessions WHERE id = $1 FOR UPDATE", [sessionId]);
    const session = result.rows[0];
    assertCheckoutConsentActive(consent.rows[0]);
    assertSessionProcessingAllowedRecord(session);
    if (session.consent_event_id !== consent.rows[0].id || session.payment_status !== "pending" ||
        session.analysis_status === "done") {
      throw new ConsentError("This session cannot start a new payment.", { status: 409, code: "CHECKOUT_SESSION_UNAVAILABLE" });
    }
    const value = await action(session, client);
    await client.query("COMMIT");
    return value;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
