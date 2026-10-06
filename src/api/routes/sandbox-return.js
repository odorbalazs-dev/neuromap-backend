import express from 'express';
import { randomBytes } from 'node:crypto';
import { env } from '../../config/env.js';
import { sandboxCheckoutEnabled } from '../../services/sandbox-checkout-policy.js';

const router = express.Router();
router.get(/^\/(hu|en|de|it|es|zh|ja|ar|pl|pt|fr)-checkout-(success|cancel)$/, (req, res, next) => {
  if (!sandboxCheckoutEnabled(env)) return next();
  const lang = req.params[0];
  const nonce = randomBytes(18).toString('base64');
  res.setHeader('Cache-Control', 'no-store, private, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'self' 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'`);
  res.type('html').send(`<!doctype html><html lang="${lang}"${lang === 'ar' ? ' dir="rtl"' : ''}><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>NeuroMap Kids - sandbox</title></head><body>
<script nonce="${nonce}">window.NM_CONFIG={API_BASE_URL:window.location.origin};</script>
<script src="/public/webflow/checkout-pages.js?v=20261006-managed-failure-v2" defer></script>
</body></html>`);
});
export default router;
