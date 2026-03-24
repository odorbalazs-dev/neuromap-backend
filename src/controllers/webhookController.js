import { constructStripeEvent } from "../services/stripeService.js";
import {
  getSessionById,
  markSessionPaid,
  markAnalysisProcessing,
  markAnalysisDone,
  markAnalysisFailed
} from "../services/sessionService.js";
import { generateAnalysis } from "../services/analysisService.js";
import { sendReportEmail } from "../services/emailService.js";

export async function stripeWebhookController(req, res) {
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = constructStripeEvent(req.body, signature);
  } catch (error) {
    console.error("stripe signature verification failed:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const checkoutSession = event.data.object;
      const internalSessionId = checkoutSession.metadata?.internalSessionId;

      if (!internalSessionId) {
        throw new Error("Missing internalSessionId in Stripe metadata.");
      }

      const sessionRow = await getSessionById(internalSessionId);
      if (!sessionRow) {
        throw new Error("Session not found.");
      }

      if (sessionRow.payment_status !== "paid") {
        await markSessionPaid(internalSessionId);
      }

      if (sessionRow.analysis_status === "done") {
        return res.status(200).json({ received: true, skipped: true });
      }

      await markAnalysisProcessing(internalSessionId);

      const payload = sessionRow.payload;
      const resultText = await generateAnalysis(payload);

      await sendReportEmail({
        to: sessionRow.email,
        lang: sessionRow.lang,
        name: sessionRow.name,
        reportText: resultText
      });

      await markAnalysisDone(internalSessionId, resultText);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("webhook processing failed:", error);

    try {
      const internalSessionId = event?.data?.object?.metadata?.internalSessionId;
      if (internalSessionId) {
        await markAnalysisFailed(internalSessionId, error.message || "Unknown processing error");
      }
    } catch (dbError) {
      console.error("failed to persist webhook error:", dbError);
    }

    return res.status(500).json({
      received: false,
      error: error.message || "Webhook processing failed."
    });
  }
}