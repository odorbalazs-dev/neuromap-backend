import crypto from "crypto";
import { env } from "../config/env.js";

function sha256(value) {
  return crypto
    .createHash("sha256")
    .update(String(value || "").trim().toLowerCase())
    .digest("hex");
}

export async function sendMetaPurchaseEvent({
  email,
  eventId,
  value = 5,
  currency = "USD"
}) {
  if (!env.META_PIXEL_ID || !env.META_ACCESS_TOKEN) {
    console.warn("[meta] CAPI skipped: missing META_PIXEL_ID or META_ACCESS_TOKEN");
    return null;
  }

  if (!email) {
    console.warn("[meta] CAPI skipped: missing email");
    return null;
  }

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId || `purchase_${Date.now()}`,
        action_source: "website",
        user_data: {
          em: [sha256(email)]
        },
        custom_data: {
          currency,
          value
        }
      }
    ],
    access_token: env.META_ACCESS_TOKEN
  };

  const url = `https://graph.facebook.com/v19.0/${env.META_PIXEL_ID}/events`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("[meta] CAPI failed:", data);
    throw new Error(data?.error?.message || "Meta CAPI failed");
  }

  console.log("[meta] CAPI purchase sent:", data);
  return data;
}