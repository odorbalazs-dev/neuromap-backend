# Bemásolható kezdőprompt új chathez

Az alábbi szöveget másold be az új chat első üzenetébe. A repót ugyanebben a munkakönyvtárban nyisd meg.

---

Egy meglévő, összetett NeuroMap Kids rendszer fejlesztését folytatjuk. A következő fő feladat egy új, letisztultabb és magasabb konverzióra tervezett, 11 nyelvű Webflow landing page létrehozása úgy, hogy a jelenlegi kérdőív és teljes backend folyamat változatlanul működőképes maradjon.

A repo ezen a gépen:

`C:\Users\odorb\Documents\Codex\2026-05-17\mire-j-a-codex-mi-az\neuromap-backend`

Mielőtt bármit módosítasz:

1. Futtasd a `git rev-parse --show-toplevel`, `git status --short`, `git diff --stat` és `git log -5 --oneline` parancsokat.
2. Ne állíts vissza, ne törölj és ne írj felül semmilyen meglévő módosítást. A munkafában értékes, még nem commitolt Webflow/customer-experience és jogi/DPIA munka van.
3. Olvasd el ebben a sorrendben:
   - `NEW_CHAT_START_HERE.md`
   - `docs/NEW_CHAT_HANDOFF/README.md`
   - `docs/NEW_CHAT_HANDOFF/CURRENT_STATE.md`
   - `docs/NEW_CHAT_HANDOFF/ARCHITECTURE_AND_FLOWS.md`
   - `docs/NEW_CHAT_HANDOFF/REPOSITORY_MAP.md`
   - `docs/NEW_CHAT_HANDOFF/WEBFLOW_LANDING_CONTRACT.md`
   - `docs/NEW_CHAT_HANDOFF/LANDING_PAGE_BRIEF.md`
   - `docs/NEW_CHAT_HANDOFF/OPERATIONS_AND_DEPLOYMENT.md`
   - `docs/NEW_CHAT_HANDOFF/QUALITY_AND_RELEASE_CHECKLIST.md`
4. Ezután olvasd el legalább a következő aktuális kódfájlokat:
   - `public/webflow/engine.js`
   - `public/webflow/legal-consent.js`
   - `public/webflow/checkout-pages.js`
   - `src/services/webflow-embed-manager.service.js`
   - `src/config/products.js`
   - `src/utils/validateCheckoutPayload.js`
   - `src/utils/normalizeCheckoutPayload.js`
   - `web/engine-embed.full.html`
5. A régi `PROJECT_STATE.md` csak történeti forrás; ahol eltér, az aktuális kód és az új handoff csomag az irányadó.

A rendszer röviden:

- Frontend: Webflow + external JavaScript runtime.
- Backend: Node.js/Express Railwayen.
- Adatbázis: PostgreSQL.
- Fizetés: Stripe Checkout + aláírt, idempotens webhook.
- Feldolgozás: külön Railway analysis worker, adatbázis queue-val, lease/retry/backoff logikával.
- Riport: OpenAI Responses API, strukturált 11 részes, korosztályos, nem diagnosztikai tartalom.
- PDF: PDFKit és Noto fontok.
- Email: Resend, idempotens delivery/retry.
- Számlázás: Szamlazz.hu.
- Admin: saját `/admin/dashboard` Control Center.
- Jogi folyamat: lokalizált tájékoztatás, kifejezett consent receipt, privacy rights és retention.
- Nyelvek: hu, en, de, it, es, zh, ja, ar, pl, pt, fr.
- Csomagok: `standard_v1` 7.99 USD és `plus_v1` 9.99 USD.
- Bankok: triage + ADHD/ASD/ANXIETY/DEPRESSION/LEARNING, mind 250 tétel.

Az új landingnél kötelező:

- A meglévő DOM ID-k, engine data-attribútumok, consent, payload, csomagkódok és analytics adatvédelmi határok megőrzése.
- A landing CTA után a marketing tartalom tűnjön el, a kérdőív mód nyíljon meg, a fix fejléc maradjon látható.
- Mind a 11 nyelv legyen teljes, arabnál RTL; ne keveredjen angol fallback a kiválasztott nyelvbe.
- Ne állíts diagnózist és ne kelts félelmet.
- A dizájn maradjon skandináv jellegű, világos, nyugodt, szülőbarát és szakmai, a meglévő kék/narancs/zöld márkaszínekkel.
- A hero legyen rövid, ne legyen zsúfolt; a következő szekcióból már látszódjon rész az első viewportban.
- Használhatsz valósághoz közeli hétköznapi családi képeket, de ne címkézd a gyermeket.
- Desktop és mobil Playwright screenshotokkal ellenőrizd az elrendezést és az interakciókat.
- A végén futtasd a releváns smoke teszteket, majd `npm run audit:all`.
- Ne commitolj és ne pusholj, amíg külön nem kérem.

Első válaszodban ne kezdj rögtön kódolni. Előbb röviden foglald össze, mit tanultál a repóból, milyen meglévő helyi módosításokat kell megőrizni, és mely fájlok alkotják az új landing biztonságos módosítási felületét. Ezután készíts konkrét implementációs tervet, majd a felhasználói iránymutatás szerint valósítsd meg.

---

