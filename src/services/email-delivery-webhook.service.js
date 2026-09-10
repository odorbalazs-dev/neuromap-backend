import { Webhook } from 'svix';
import { env } from '../config/env.js';
import { db } from '../db/db.js';

export async function reconcileEmailDelivery() {
  // Negative delivery events are sticky for this provider message, including reordered callbacks.
  return db.query(`UPDATE sessions s SET report_email_delivery_status=e.delivery,
    report_email_delivery_at=e.occurred_at FROM (
      SELECT DISTINCT ON (provider_id) provider_id,
        CASE type WHEN 'email.delivered' THEN 'delivered' WHEN 'email.bounced' THEN 'bounced'
          WHEN 'email.complained' THEN 'complained' ELSE 'failed' END AS delivery, occurred_at
      FROM email_delivery_events ORDER BY provider_id,
        CASE type WHEN 'email.complained' THEN 3 WHEN 'email.bounced' THEN 2 WHEN 'email.failed' THEN 2 ELSE 1 END DESC,
        occurred_at DESC
    ) e WHERE s.report_email_provider_id=e.provider_id AND s.report_email_delivery_status IS DISTINCT FROM e.delivery`);
}

export async function receiveEmailDelivery(req, res) {
  res.setHeader('Cache-Control','no-store');
  if (!env.RESEND_WEBHOOK_SECRET) return res.status(503).json({ ok: false });
  let event;
  try {
    const raw = req.body.toString('utf8');
    new Webhook(env.RESEND_WEBHOOK_SECRET).verify(raw, req.headers);
    event = JSON.parse(raw);
    if (!event || typeof event !== 'object') throw new Error('Invalid event');
  } catch { return res.status(400).json({ ok: false }); }
  if (!['email.delivered','email.bounced','email.complained','email.failed'].includes(event.type)) return res.json({ ok: true, ignored: true });
  if (typeof event.data?.email_id !== 'string' || event.data.email_id.length > 200
      || !event.data.email_id || typeof req.headers['svix-id'] !== 'string' || req.headers['svix-id'].length > 200
      || !Number.isFinite(Date.parse(event.created_at))) return res.status(400).json({ ok: false });
  try {
    await db.query(`INSERT INTO email_delivery_events(event_id,provider_id,type,occurred_at)
      VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
    [req.headers['svix-id'],event.data.email_id,event.type,event.created_at]);
    await reconcileEmailDelivery();
    return res.json({ ok: true });
  } catch { return res.status(503).json({ ok: false }); }
}
