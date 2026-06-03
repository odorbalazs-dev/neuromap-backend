import {
  getRecoverableCheckoutSessions,
  getSessionById,
  markRecoveryEmailSent
} from "../../services/session.service.js";

import { sendCheckoutRecoveryEmail } from "../../services/email.service.js";
import { retryReportEmailsBatch } from "../../services/report-email-retry.service.js";
import {
  runBankQualityAlertCheck,
  runProductionHealthAlertCheck
} from "../../services/admin-alert.service.js";
import { runPostPaymentRecoveryV2 } from "../../services/post-payment-recovery.service.js";

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

    const result =
      await retryReportEmailsBatch(
        {
          limit,
          maxAttempts,
          retryAfterMinutes,
          staleSendingMinutes
        },
        { source: "cron-report-email-retry" }
      );

    return res.json(result);

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

export async function runPostPaymentRecovery(req, res) {
  try {
    if (!isAuthorizedCron(req)) {
      return res.status(401).json({
        ok: false,
        error: "Unauthorized"
      });
    }

    const result =
      await runPostPaymentRecoveryV2({
        ...(req.query || {}),
        ...(req.body || {})
      });

    return res.json(result);

  } catch (error) {
    console.error(
      "[cron] runPostPaymentRecovery failed:",
      error
    );

    return res.status(500).json({
      ok: false,
      error: error.message || "Cron failed"
    });
  }
}

export async function sendProductionHealthAlert(req, res) {
  try {
    if (!isAuthorizedCron(req)) {
      return res.status(401).json({
        ok: false,
        error: "Unauthorized"
      });
    }

    const cooldownMinutes = normalizeNumber(
      req.query.cooldownMinutes,
      30,
      1,
      1440
    );

    const force =
      String(req.query.force || "false").toLowerCase() === "true";

    const result =
      await runProductionHealthAlertCheck({
        cooldownMinutes,
        force
      });

    return res.status(result.ok === false ? 500 : 200).json(result);

  } catch (error) {
    console.error(
      "[cron] sendProductionHealthAlert failed:",
      error
    );

    return res.status(500).json({
      ok: false,
      error: error.message || "Cron failed"
    });
  }
}

export async function sendBankQualityAlert(req, res) {
  try {
    if (!isAuthorizedCron(req)) {
      return res.status(401).json({
        ok: false,
        error: "Unauthorized"
      });
    }

    const cooldownMinutes = normalizeNumber(
      req.query.cooldownMinutes,
      30,
      1,
      1440
    );

    const force =
      String(req.query.force || "false").toLowerCase() === "true";

    const strict =
      String(req.query.strict || "false").toLowerCase() === "true";

    const minLevel = String(req.query.minLevel || "warning").toLowerCase();

    const result =
      await runBankQualityAlertCheck({
        cooldownMinutes,
        force,
        strict,
        minLevel
      });

    return res.status(result.ok === false ? 500 : 200).json(result);

  } catch (error) {
    console.error(
      "[cron] sendBankQualityAlert failed:",
      error
    );

    return res.status(500).json({
      ok: false,
      error: error.message || "Cron failed"
    });
  }
}
