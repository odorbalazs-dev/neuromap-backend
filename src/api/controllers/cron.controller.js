import {
  getRecoverableCheckoutSessions,
  getReportEmailRetryCandidates,
  getSessionById,
  markRecoveryEmailSent
} from "../../services/session.service.js";

import { sendCheckoutRecoveryEmail } from "../../services/email.service.js";
import { deliverReportEmailForSession } from "../../services/report-email-delivery.service.js";

import { env } from "../../config/env.js";
import { secureCompare } from "../../utils/secureCompare.js";

function isAuthorizedCron(req) {
  const headerSecret = req.headers["x-cron-secret"];

  return Boolean(env.CRON_SECRET && secureCompare(headerSecret, env.CRON_SECRET));
}

function normalizeNumber(value, fallback, min, max) {
  const num = Number(value);

  if (!Number.isFinite(num)) {
    return fallback;
  }

  return Math.min(
    Math.max(num, min),
    max
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

    const olderThanMinutes = normalizeNumber(
      req.query.olderThanMinutes,
      30,
      5,
      10080
    );

    const limit = normalizeNumber(
      req.query.limit,
      50,
      1,
      200
    );

    const sessions =
      await getRecoverableCheckoutSessions({
        olderThanMinutes,
        limit
      });

    const results = [];

    for (const session of sessions) {
      try {
        const freshSession =
          await getSessionById(session.id);

        if (!freshSession) {
          results.push({
            sessionId: session.id,
            status: "missing"
          });

          continue;
        }

        if (freshSession.payment_status === "paid") {
          results.push({
            sessionId: session.id,
            status: "already_paid"
          });

          continue;
        }

        const retryUrl =
          `${env.APP_BASE_URL}/${freshSession.lang || "en"}-checkout-cancel?sid=${freshSession.id}`;

        await sendCheckoutRecoveryEmail({
          to: freshSession.email,
          lang: freshSession.lang,
          name: freshSession.name,
          checkoutUrl: retryUrl
        });

        await markRecoveryEmailSent(freshSession.id);

        console.log("[cron] recovery email sent", {
          sessionId: freshSession.id
        });

        results.push({
          sessionId: freshSession.id,
          status: "sent"
        });

      } catch (error) {
        console.error(
          "[cron] recovery email failed:",
          {
            sessionId: session.id,
            error: error.message
          }
        );

        results.push({
          sessionId: session.id,
          status: "failed",
          error: error.message
        });
      }
    }

    return res.json({
      ok: true,
      checked: sessions.length,
      olderThanMinutes,
      limit,
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

export async function retryReportEmails(req, res) {
  try {
    if (!isAuthorizedCron(req)) {
      return res.status(401).json({
        ok: false,
        error: "Unauthorized"
      });
    }

    const limit = normalizeNumber(
      req.query.limit,
      20,
      1,
      100
    );

    const maxAttempts = normalizeNumber(
      req.query.maxAttempts,
      3,
      1,
      10
    );

    const retryAfterMinutes = normalizeNumber(
      req.query.retryAfterMinutes,
      10,
      1,
      1440
    );

    const staleSendingMinutes = normalizeNumber(
      req.query.staleSendingMinutes,
      15,
      5,
      1440
    );

    const sessions =
      await getReportEmailRetryCandidates({
        limit,
        maxAttempts,
        retryAfterMinutes,
        staleSendingMinutes
      });

    const results = [];

    for (const session of sessions) {
      const previousStatus =
        session.report_email_status || "not_sent";

      const attemptsBefore =
        Number(session.report_email_attempts || 0);

      const result =
        await deliverReportEmailForSession(
          session,
          { source: "cron-report-email-retry" }
        );

      results.push({
        ...result,
        previousStatus,
        attemptsBefore
      });
    }

    return res.json({
      ok: true,
      checked: sessions.length,
      sent: results.filter((item) => item.status === "sent").length,
      failed: results.filter((item) => item.status === "failed").length,
      limit,
      maxAttempts,
      retryAfterMinutes,
      staleSendingMinutes,
      results
    });

  } catch (error) {
    console.error(
      "[cron] retryReportEmails failed:",
      error
    );

    return res.status(500).json({
      ok: false,
      error: error.message || "Cron failed"
    });
  }
}
