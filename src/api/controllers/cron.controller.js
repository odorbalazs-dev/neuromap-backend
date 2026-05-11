import {
  getRecoverableCheckoutSessions,
  markRecoveryEmailSent
} from "../../services/session.service.js";

import { sendCheckoutRecoveryEmail } from "../../services/email.service.js";

import { env } from "../../config/env.js";

function isAuthorizedCron(req) {
  const secret = req.headers["x-cron-secret"];

  return Boolean(
    env.CRON_SECRET &&
    secret === env.CRON_SECRET
  );
}

export async function recoverAbandonedCheckouts(req, res) {
  try {
    if (!isAuthorizedCron(req)) {
      return res.status(401).json({
        ok: false,
        error: "Unauthorized"
      });
    }

    const olderThanMinutes = Number(
      req.query.olderThanMinutes || 30
    );

    const limit = Number(
      req.query.limit || 50
    );

    const sessions =
      await getRecoverableCheckoutSessions({
        olderThanMinutes,
        limit
      });

    const results = [];

    for (const session of sessions) {
      try {
        await sendCheckoutRecoveryEmail({
          to: session.email,
          lang: session.lang,
          name: session.name,
          checkoutUrl: session.checkout_url
        });

        await markRecoveryEmailSent(session.id);

        results.push({
          sessionId: session.id,
          email: session.email,
          status: "sent"
        });

      } catch (error) {
        console.error(
          "[cron] recovery email failed:",
          {
            sessionId: session.id,
            email: session.email,
            error: error.message
          }
        );

        results.push({
          sessionId: session.id,
          email: session.email,
          status: "failed",
          error: error.message
        });
      }
    }

    return res.json({
      ok: true,
      checked: sessions.length,
      results
    });

  } catch (error) {
    console.error(
      "[cron] recoverAbandonedCheckouts failed:",
      error
    );

    return res.status(500).json({
      ok: false,
      error: error.message || "Cron failed"
    });
  }
}
