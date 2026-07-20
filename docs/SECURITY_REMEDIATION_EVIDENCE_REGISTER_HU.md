# Biztonsági javítások és bizonyítékok nyilvántartása

**Dokumentumazonosító:** NMK-SEC-REG-001  
**Verzió:** 1.0  
**Állapot:** belső, ellenőrzött munkapéldány  
**Bizonyítéki pillanatkép dátuma:** 2026. július 20.  
**Vizsgált forrásállapot:** `b2d8e6b27f8b3084abd232e0488a8acdd91dfeb9`  
**Rendszer:** NeuroMap Kids Webflow + Railway kérdőív-, fizetési és riportfolyamat  
**Dokumentumgazda:** kijelölendő  
**Következő kötelező felülvizsgálat:** éles indulás előtt, majd legalább negyedévente és minden jelentős biztonsági változás után

---

## 1. A dokumentum célja

Ez a nyilvántartás a NeuroMap Kids rendszerben végrehajtott biztonsági javításokat, azok műszaki indokát, forráskódbeli bizonyítékát, belső ellenőrzési eredményét, fennmaradó kockázatát és a még beszerzendő külső vagy üzemeltetési bizonyítékokat foglalja össze.

A dokumentum célja, hogy:

- visszakövethető legyen, mely kockázatra milyen javítás készült;
- a javítás ne csak állítás, hanem forráskóddal és ellenőrzési eredménnyel alátámasztott tétel legyen;
- egy külső biztonsági auditor, adatvédelmi szakértő vagy megbízott üzemeltető azonos bizonyítéki struktúrából dolgozhasson;
- elkülönüljön a belső műszaki igazolás a külső tanúsítástól;
- a DPIA és az élesítési döntés biztonsági mellékleteként használható legyen.

## 2. Fontos korlátozás

Ez a dokumentum **nem külső biztonsági tanúsítvány**, nem behatolási teszt, nem SOC 2 vagy ISO 27001 igazolás, nem jogi szakvélemény és nem GDPR-megfelelőségi tanúsítvány. A benne szereplő „igazolt” minősítés azt jelenti, hogy a megjelölt forrásállapotban a kontroll jelenléte belső kódvizsgálattal és - ahol elérhető - automatizált ellenőrzéssel alátámasztható.

Külső kommunikációban az „függetlenül auditált”, „tanúsított”, „teljesen biztonságos” vagy „GDPR-tanúsított” állítás csak megfelelő, aláírt külső bizonyíték birtokában használható.

## 3. Hatókör

A vizsgálat a következő rendszerterületekre terjed ki:

- Webflow frontend és publikus kérdőívfolyamat;
- ügyfél-session, checkout és checkout-helyreállítás;
- Stripe checkout és webhook-feldolgozás;
- Railway Node/Express API;
- admin vezérlőközpont hitelesítése és műveletvédelme;
- PostgreSQL kapcsolat, rate limit és érzékeny adatok tárolása;
- elemzési queue és worker;
- PDF- és számlafeldolgozás idempotenciája;
- hozzájárulás, különleges adatkezelés, érintetti kérelmek;
- megőrzés, törlés és adatminimalizálás;
- jogi launch gate és élesítési feltételek;
- production npm-függőségek ismert sérülékenységei.

A vizsgálat nem foglal magában tényleges külső penetrációs tesztet, Railway/Stripe/OpenAI/Resend fiókszintű IAM-auditot, hálózati forgalomrögzítést, éles adatbázis-konfiguráció exportját vagy jogi szakértői jóváhagyást.

## 4. Bizonyítéki minősítések

| Minősítés | Jelentés |
|---|---|
| **A** | Forráskód + automatizált ellenőrzés + dátumozott éles vagy független bizonyíték. |
| **B** | Forráskód + sikeres automatizált belső ellenőrzés. |
| **C** | Forráskód- vagy tervszintű bizonyíték rendelkezésre áll, de nincs teljes automatizált vagy éles igazolás. |
| **P** | Függőben lévő külső, szerződéses vagy üzemeltetési bizonyíték. |

**Értelmezés:** a jelen pillanatképben nincs A minősítésű tétel, mert nem áll rendelkezésre csatolt, dátumozott éles konfigurációexport vagy független auditor által aláírt jelentés. Ez nem a kontroll hiányát, hanem az A szintű bizonyíték hiányát jelenti.

## 5. Vezetői összefoglaló

| Mutató | Eredmény |
|---|---:|
| Nyilvántartott bevezetett kontrollok | 20 |
| B minősítésű, automatizáltan is ellenőrzött kontrollok | 14 |
| C minősítésű, kóddal igazolt kontrollok | 6 |
| Függő külső vagy üzemeltetési bizonyítékok | 6 |
| `npm run audit:security` | 10/10 PASS |
| Jogi/hozzájárulási smoke ellenőrzések | 3/3 sikeres |
| Ismert production npm-sérülékenységek | 0 |

### 5.1. Összesített álláspont

A vizsgált forrásállapotban a legfontosabb korábbi kockázatokra - nyers admin token újrahasználata, publikus session védtelensége, érzékeny checkout token query paraméterben, kérdőívválaszok tartós böngészőtárolása, teljes Stripe webhook payload tárolása, egyetlen példányra korlátozódó rate limit és implicit adatbázis-SSL - konkrét műszaki javítás készült.

A belső auditok alapján a javítások fő invariánsai jelen vannak. Az éles indítás biztonsági lezárásához azonban még szükséges a production konfiguráció dokumentált ellenőrzése, jogosultsági felülvizsgálat, helyreállítási próba és külső penetrációs teszt.

---

## 6. Tételes kontrollnyilvántartás

### SEC-001 - Rövid élettartamú admin session és CSRF-védelem

**Állapot:** bevezetve, belsőleg ellenőrizve  
**Bizonyítéki minősítés:** B  
**Kapcsolódó commit:** `bfe0d72` - Harden admin and checkout security

**Kiinduló kockázat:** A nyers `ADMIN_TOKEN` minden admin kérésben való továbbítása és böngészőoldali tárolása növeli a token kiszivárgásának és újrajátszásának kockázatát. A sessionalapú admin műveletek CSRF-védelem nélkül más webhelyről is kezdeményezhetők lehetnek.

**Végrehajtott javítás:** Az admin felület rövid élettartamú, `HttpOnly`, `SameSite=Strict` cookie-sessiont használ. Az állapotmódosító admin kérések külön CSRF cookie-t és `x-admin-csrf` fejlécet ellenőriznek. A session időtartama környezeti változóval szabályozható.

**Forrásbizonyíték:** 

- `src/middleware/adminAuth.js:10-11` - session- és CSRF-cookie nevek;
- `src/middleware/adminAuth.js:33-53` - `SameSite=Strict`, `HttpOnly`, secure cookie beállítások;
- `src/middleware/adminAuth.js:162` - CSRF fejléc ellenőrzése;
- `src/config/env.js:202` - `ADMIN_SESSION_TTL_MINUTES`;
- `src/config/env.js:207-208` - secure admin cookie konfiguráció.

**Automatizált bizonyíték:** `npm run audit:security` - PASS: „Admin dashboard uses session + CSRF instead of raw token headers”; PASS: „Admin middleware creates HttpOnly session and verifies CSRF”.

**Fennmaradó kockázat:** A cookie tényleges `Secure` attribútuma és a session lejárata csak éles HTTPS konfigurációexporttal igazolható A szinten.

**A szinthez még szükséges:** dátumozott Railway environment export titkok nélkül; böngésző DevTools cookie-kép; külső CSRF-próba.

### SEC-002 - Konstans idejű titok-összehasonlítás és legacy admin hitelesítés tiltása

**Állapot:** bevezetve, belsőleg ellenőrizve  
**Bizonyítéki minősítés:** B

**Kiinduló kockázat:** Egyszerű karakterlánc-összehasonlítás timing side-channel kockázatot okozhat. A legacy admin header hitelesítés bekapcsolva hagyása megkerülné a session- és CSRF-védelmet.

**Végrehajtott javítás:** A titokellenőrzés `crypto.timingSafeEqual` alapú segédfüggvényt használ. A legacy tokenes hitelesítés alapértelmezetten tiltott, és csak explicit környezeti kapcsolóval engedhető vissza.

**Forrásbizonyíték:**

- `src/utils/secureCompare.js:1-15` - timing-safe összehasonlítás;
- `src/services/admin-session.service.js:17` - session secret ellenőrzése;
- `src/middleware/adminAuth.js:94` - biztonságos összehasonlítás;
- `src/middleware/adminAuth.js:179` - legacy út csak engedélyező flag mellett;
- `src/config/env.js:206` - `ADMIN_LEGACY_TOKEN_AUTH=false` alapértelmezés.

**Automatizált bizonyíték:** `npm run audit:security` - az admin dashboard nyers tokenes működésének hiányát ellenőrzi, eredmény PASS.

**Fennmaradó kockázat:** Hibás production env esetén a legacy kapcsoló visszakapcsolható; ezért konfigurációs változáskezelés szükséges.

### SEC-003 - CORS allowlist és HTTP biztonsági fejlécek

**Állapot:** bevezetve, belsőleg ellenőrizve  
**Bizonyítéki minősítés:** B

**Kiinduló kockázat:** Széles CORS-beállítások és hiányzó böngészővédelmi fejlécek növelik a nem engedélyezett originről történő API-használat, tartalombeágyazás, MIME-sniffing és downgrade támadások kockázatát.

**Végrehajtott javítás:** Explicit origin allowlist, korlátozott metódusok és fejlécek, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, szigorú CSP, `frame-ancestors 'none'` és production HSTS került bevezetésre.

**Forrásbizonyíték:**

- `src/app/server.js:25-55` - CORS origin allowlist, metódusok és engedélyezett fejlécek;
- `src/middleware/security.js:100-107` - nosniff, referrer, permissions, CSP és HSTS.

**Automatizált bizonyíték:** `npm run audit:security` - PASS: „Rate limiting can use database-backed counters and production HSTS”.

**Fennmaradó kockázat:** Az éles domainlista és a tényleges válaszfejlécek külön production HTTP-felvételt igényelnek.

### SEC-004 - Több replika között közös, fail-closed rate limiting

**Állapot:** bevezetve, belsőleg ellenőrizve  
**Bizonyítéki minősítés:** B

**Kiinduló kockázat:** Memóriában tárolt rate limit több Railway replika esetén példányonként újraindul, így megkerülhető. Hibánál automatikusan engedő limiter túlterhelést és brute-force kockázatot okozhat.

**Végrehajtott javítás:** PostgreSQL-alapú számlálók támogatása készült, a production alapértelmezés adatbázis-backed és fail-closed. A memóriás mód csak explicit konfigurációval használható.

**Forrásbizonyíték:**

- `src/middleware/security.js:38-65` - adatbázis limiter és `api_rate_limits` műveletek;
- `src/middleware/security.js:133` - fail-open csak explicit környezeti beállítással;
- `src/config/env.js:237-238` - `RATE_LIMIT_BACKEND=database`, `RATE_LIMIT_FAIL_OPEN=false`.

**Automatizált bizonyíték:** `npm run audit:security` - PASS: adatbázis-backed rate limiting jelenléte.

**Fennmaradó kockázat:** A limitek kapacitás- és false-positive beállításai terhelési mérés alapján hangolandók.

### SEC-005 - Explicit adatbázis-SSL konfiguráció

**Állapot:** bevezetve, belsőleg ellenőrizve  
**Bizonyítéki minősítés:** B

**Kiinduló kockázat:** Implicit vagy kikapcsolt TLS esetén az alkalmazás és az adatbázis közötti forgalom lehallgatható vagy módosítható lehet.

**Végrehajtott javítás:** Az SSL-viselkedés explicit `DATABASE_SSL_MODE` változóval szabályozott; a tanúsítvány-ellenőrzés alapértelmezett, és egyedi CA base64 formában betölthető.

**Forrásbizonyíték:**

- `src/db/db.js:4-14` - SSL mód, `rejectUnauthorized`, egyedi CA;
- `src/db/db.js:31` - pool SSL konfiguráció;
- `src/config/env.js:232-233` - kapcsolódó env változók.

**Automatizált bizonyíték:** `npm run audit:security` - PASS: „Database SSL behavior is explicit and configurable”.

**Fennmaradó kockázat:** A Railway tényleges CA- és connection-string beállítása production exporttal igazolandó.

### SEC-006 - Ügyfél-session hozzáférési token hash-elése és kötelező ellenőrzése

**Állapot:** bevezetve, belsőleg ellenőrizve  
**Bizonyítéki minősítés:** B

**Kiinduló kockázat:** Pusztán session UUID alapján lekérhető fizetési vagy riportállapot jogosulatlan hozzáférést eredményezhet. Nyers hozzáférési token adatbázisban történő tárolása adatbázis-szivárgás esetén azonnal felhasználható lenne.

**Végrehajtott javítás:** Kriptográfiailag véletlen public access token készül; az adatbázisban csak SHA-256 hash tárolódik. A session elérés és checkout retry a token birtoklását és timing-safe egyezését követeli meg.

**Forrásbizonyíték:**

- `src/db/migrations/018_security_hardening.sql:2-8` - token hash oszlop és index;
- `src/services/session.service.js:10` - token hash-elés;
- `src/services/session.service.js:29-43` - kötelező token és biztonságos összehasonlítás;
- `src/services/session.service.js:62-83` - token generálása és hash tárolása;
- `src/config/env.js:239` - `PUBLIC_SESSION_TOKEN_REQUIRED=true`.

**Automatizált bizonyíték:** `npm run audit:security` - PASS: „Customer session access tokens are hashed and enforced”; PASS: „Checkout retry requires customer session token”.

**Fennmaradó kockázat:** A böngészőben átmenetileg tárolt token XSS esetén hozzáférhető; ezt CSP, rövid élettartam és frontend minimalizálás csökkenti.

### SEC-007 - Checkout access token URL fragmentben, nem query paraméterben

**Állapot:** bevezetve, belsőleg ellenőrizve  
**Bizonyítéki minősítés:** B

**Kiinduló kockázat:** Query paraméterben szereplő hozzáférési token bekerülhet szerver-, proxy-, analitikai és böngészőelőzmény-naplókba, illetve referrerbe.

**Végrehajtott javítás:** A Stripe success/cancel URL a tokent hash fragmentben adja át. A fragmentet a böngésző nem küldi el HTTP kérésben; a checkout oldal a tokent `sessionStorage`-ba veszi át.

**Forrásbizonyíték:**

- `src/services/stripe.service.js:155-189` - session és access token fragmentbe építése;
- `src/services/stripe.service.js:224-225` - success/cancel URL használat;
- `public/webflow/checkout-pages.js:389-411` - fragment olvasása és `sessionStorage` használata;
- `public/webflow/engine.js:8816-8825` - ügyfél-token `sessionStorage` használata.

**Automatizált bizonyíték:** `npm run audit:security` - PASS: „Success/cancel pages pass session access token only from hash/sessionStorage”.

**Fennmaradó kockázat:** Harmadik fél script ugyanazon originen olvashatja a fragmentet; csak szükséges scriptek engedélyezendők.

### SEC-008 - Kérdőívválaszok tartós localStorage-tárolásának megszüntetése

**Állapot:** bevezetve, belsőleg ellenőrizve  
**Bizonyítéki minősítés:** B

**Kiinduló kockázat:** A gyermekre vonatkozó potenciálisan különleges adat hosszú ideig megmaradhat közös vagy elveszett eszközön, és minden azonos originű script hozzáférhet.

**Végrehajtott javítás:** A Webflow engine nem ír kérdőívdraftot `localStorage`-ba; a korábbi draftkulcs csak eltávolítási célból maradt kompatibilitási takarításként.

**Forrásbizonyíték:**

- `public/webflow/engine.js:12` - legacy draftkulcs;
- `public/webflow/engine.js:5032,5042,5050` - korábbi draft törlése;
- nincs `localStorage.setItem(DRAFT_STORAGE_KEY, ...)` művelet.

**Automatizált bizonyíték:** `npm run audit:security` - PASS: „Questionnaire draft answers are not persisted in localStorage”.

**Fennmaradó kockázat:** A kitöltés alatti értékek a böngésző memóriájában vannak; XSS- és eszközbiztonság továbbra is releváns.

### SEC-009 - Stripe webhook aláírás ellenőrzése

**Állapot:** bevezetve, kóddal igazolva  
**Bizonyítéki minősítés:** C

**Kiinduló kockázat:** Aláírás-ellenőrzés nélkül támadó hamis fizetési eseménnyel riportot, emailt vagy számlát indíthatna.

**Végrehajtott javítás:** A webhook controller átadja a `stripe-signature` fejlécet, és az esemény kizárólag a Stripe SDK `webhooks.constructEvent` ellenőrzése után kerül feldolgozásra. A webhook secret kötelező környezeti változó.

**Forrásbizonyíték:**

- `src/api/controllers/webhook.controller.js:7` - signature fejléc;
- `src/services/stripe.service.js:238-242` - secret ellenőrzés és `constructEvent`;
- `src/config/env.js:172` - kötelező `STRIPE_WEBHOOK_SECRET`.

**Belső ellenőrzés:** forráskódvizsgálat.

**Fennmaradó kockázat:** Nincs ehhez a pillanatképhez csatolt Stripe CLI valid/invalid signature replay eredmény vagy dashboard screenshot.

**A szinthez még szükséges:** teszt webhook érvényes és hibás aláírással, eseményazonosítóval és időbélyeggel.

### SEC-010 - Webhook idempotencia, feldolgozási claim és payload-minimalizálás

**Állapot:** bevezetve, belsőleg ellenőrizve  
**Bizonyítéki minősítés:** B

**Kiinduló kockázat:** A Stripe eseményeket ismételten kézbesítheti. Párhuzamos feldolgozás dupla queue-jobot, emailt vagy számlát okozhat. Teljes webhook objektum tárolása felesleges személyes és fizetési metaadatot őrizhet meg.

**Végrehajtott javítás:** A webhook esemény egyedi claim tokennel, státusz- és stale-feldolgozás szabályokkal foglalható le. Adatbázisba csak allowlistelt, minimalizált audit payload kerül. A payload külön életciklus szerint redaktálható.

**Forrásbizonyíték:**

- `src/services/webhook.service.js:19-37` - payload allowlist/minimalizálás;
- `src/services/webhook.service.js:53-84` - claim és safe payload tárolás;
- `src/services/webhook.service.js:115,217` - feldolgozás lezárása és claim használata;
- `src/db/migrations/014_webhook_event_claims.sql` - processing token és index;
- `src/db/migrations/018_security_hardening.sql:39` - payload redaction időpont;
- `src/db/migrations/002_webhook_events.sql:7-10` - payload és feldolgozási mezők.

**Automatizált bizonyíték:** `npm run audit:security` - PASS: „Stripe webhook payload is minimized before database persistence”.

**Fennmaradó kockázat:** A teljes idempotencia éles bizonyítása ismételt azonos Stripe event replay-jel szükséges.

### SEC-011 - Stripe checkout létrehozási idempotencia

**Állapot:** bevezetve, kóddal igazolva  
**Bizonyítéki minősítés:** C

**Kiinduló kockázat:** Hálózati retry vagy többszöri kattintás több checkout sessiont hozhat létre ugyanahhoz a kérdőív-sessionhöz.

**Végrehajtott javítás:** A checkout létrehozás determinisztikus idempotency key-t használ, amelyet a Stripe SDK kérésopcióként kap meg.

**Forrásbizonyíték:**

- `src/services/stripe.service.js:144` - idempotency key képzése;
- `src/services/stripe.service.js:230` - idempotency key átadása.

**Fennmaradó kockázat:** Stripe tesztkörnyezetben párhuzamos retry eredménnyel még igazolandó.

### SEC-012 - Elemzési queue lease, heartbeat, ownership és visszaállítás

**Állapot:** bevezetve, kóddal igazolva  
**Bizonyítéki minősítés:** C

**Kiinduló kockázat:** Több worker ugyanazt a jobot dolgozhatja fel; worker crash esetén job maradhat örökre processing állapotban; korábbi worker későn visszaírhatja egy új lease eredményét.

**Végrehajtott javítás:** Egyedi lease token, heartbeat, `FOR UPDATE SKIP LOCKED`, ownership ellenőrzés, időzített retry és stale-job recovery került bevezetésre. A terminális hibák kísérletszámhoz kötöttek.

**Forrásbizonyíték:**

- `src/db/migrations/013_analysis_job_leases.sql:2-10` - lease és heartbeat mezők/index;
- `src/services/analysis-queue.service.js:74-99` - claim, heartbeat és SKIP LOCKED;
- `src/services/analysis-queue.service.js:108-195` - lease ownership és retry;
- `src/services/analysis-queue.service.js:224` - stale recovery;
- `src/services/analysis-job-lease.service.js:13-45` - heartbeat és ownership assert.

**Fennmaradó kockázat:** Több workerrel végzett fault-injection teszt és Railway restart-próba még szükséges.

### SEC-013 - Számlafeldolgozási claim és idempotens státuszmodell

**Állapot:** bevezetve, kóddal igazolva  
**Bizonyítéki minősítés:** C

**Kiinduló kockázat:** Párhuzamos számlázási retry duplikált számlát állíthat ki; elakadt processing státusz nem áll helyre.

**Végrehajtott javítás:** A számla rekord processing tokennel foglalható le; csak megengedett kezdőstátuszból indulhat; a stale feldolgozás helyreállítható; success/failure csak a megfelelő token birtokában írható vissza.

**Forrásbizonyíték:**

- `src/db/migrations/015_invoice_processing_claims.sql:2-6` - processing token és index;
- `src/db/migrations/006_invoices.sql:6-27` - státuszok, kísérletszám és időpontok;
- `src/services/invoice.service.js:140-189` - claim és stale recovery;
- `src/services/invoice.service.js:253-325` - issued/failure lezárás tokenfeltétellel.

**Fennmaradó kockázat:** Számlázz.hu sandboxban párhuzamos retry- és provider-timeout teszt szükséges.

### SEC-014 - Különleges adatokhoz kifejezett hozzájárulás és reklámcélú tiltás

**Állapot:** bevezetve, belsőleg ellenőrizve  
**Bizonyítéki minősítés:** B

**Kiinduló kockázat:** A gyermek viselkedésére és lehetséges egészségi mintázataira vonatkozó adatok különleges személyes adatnak minősülhetnek. Kifejezett hozzájárulás és bizonyítható policy-verzió nélkül az adatkezelés jogalapja és elszámoltathatósága gyenge. Érzékeny adatok reklámprofilozásra továbbítása különösen magas kockázatú.

**Végrehajtott javítás:** Verziózott explicit consent receipt, különleges adathoz adott hozzájárulás, visszavonási állapot és consent event napló készült. A rendszer az érzékeny folyamatban `advertising=false` értéket követel; opcionális analytics hozzájárulás külön kezelhető.

**Forrásbizonyíték:**

- `src/services/consent.service.js:17-19` - withdrawal és special category consent;
- `src/services/consent.service.js:63-65` - advertising consent tiltása;
- `src/services/consent.service.js:94-95,126-127` - analytics és advertising szétválasztása;
- `src/services/consent.service.js:151-158` - bizonyító consent event mezők;
- `src/services/consent.service.js:203-247` - receipt és policy-verzió ellenőrzése;
- `src/services/consent.service.js:316-350` - visszavonás és sessionkorlátozás.

**Automatizált bizonyíték:** `npm run smoke:legal-consent` - `[smoke:legal-consent] OK`.

**Fennmaradó kockázat:** A hozzájárulási szöveg jogi megfelelőségét és a gyermek/szülői jogosultság kezelését célországonként jogi szakértőnek kell jóváhagynia.

### SEC-015 - Adatmegőrzés, redakció és érzékeny session törlése

**Állapot:** bevezetve, belsőleg ellenőrizve  
**Bizonyítéki minősítés:** B

**Kiinduló kockázat:** Határidő nélküli kérdőív-, riport- és webhook-adattárolás sérti az adattakarékosság és korlátozott tárolhatóság elvét, és növeli egy incidens hatását.

**Végrehajtott javítás:** Adatmegőrzési mátrix, sessionenkénti `retention_delete_at`, érzékeny mezők pszeudonimizálása/törlése, webhook payload redakció és batch lifecycle runner készült. A számlázási megőrzési kivétel dokumentált.

**Forrásbizonyíték:**

- `docs/RETENTION_AND_ERASURE_SCHEDULE.md:13-33` - megőrzési mátrix, napi lifecycle és jogi kivétel;
- `src/db/migrations/016_consent_and_data_lifecycle.sql:6` - retention delete időpont;
- `src/services/data-governance.service.js:164-211` - érzékeny sessionadatok törlése és pszeudonimizálás;
- `src/services/data-lifecycle.service.js:11-71` - batch erasure és webhook-redakció;
- `src/services/data-lifecycle.service.js:211-212` - lifecycle runner.

**Automatizált bizonyíték:** `npm run smoke:legal-governance` - `[smoke:legal-governance] OK`.

**Fennmaradó kockázat:** Éles cronfutás, törlési napló és backupból való lejárat igazolása szükséges.

### SEC-016 - Érintetti kérelmek tokenvédett feldolgozása

**Állapot:** bevezetve, belsőleg ellenőrizve  
**Bizonyítéki minősítés:** B

**Kiinduló kockázat:** Gyenge kérelmezőazonosítás esetén támadó más személy adatait kérheti le, módosíthatja vagy törölheti.

**Végrehajtott javítás:** Hozzáférés, hordozhatóság, korlátozás, hozzájárulás-visszavonás, törlés és helyesbítés kezelése készült. A request token csak hash-elve tárolódik, összehasonlítása timing-safe; session hozzáférési token szükséges. A számlázási jogi kivétel elkülönül.

**Forrásbizonyíték:**

- `src/db/migrations/019_legal_governance_and_data_subject_rights.sql:51-93` - privacy request és event táblák, token hash és indexek;
- `src/services/privacy-rights.service.js:283-319` - random token, hash és session token ellenőrzés;
- `src/services/privacy-rights.service.js:328-393` - export, korlátozás, visszavonás és törlés;
- `src/services/privacy-rights.service.js:461-465` - timing-safe request token ellenőrzés;
- `docs/DATA_SUBJECT_RIGHTS_RUNBOOK.md:7-34` - hitelesített privacy center, határidő és export szabályok.

**Automatizált bizonyíték:** `npm run smoke:legal-governance` - OK.

**Fennmaradó kockázat:** Az ügyfélszolgálati személyazonosság-ellenőrzés, határidőfigyelés és elutasítási folyamat operatív próbája szükséges.

### SEC-017 - Jogi és adatvédelmi launch gate

**Állapot:** bevezetve, belsőleg ellenőrizve  
**Bizonyítéki minősítés:** B

**Kiinduló kockázat:** A checkout technikailag elindulhat akkor is, ha kötelező privacy policy, DPIA, vendor DPA, security vagy szakmai tartalmi jóváhagyás hiányzik.

**Végrehajtott javítás:** Kódolt readiness-check és launch-gate készült a szükséges jóváhagyási kategóriákkal. A checkout blokkolási viselkedés konfigurálható; a jogi sign-off dokumentum rögzíti, hogy ez nem megfelelőségi tanúsítvány.

**Forrásbizonyíték:**

- `src/services/launch-gate.service.js:4-66` - kötelező jóváhagyások, állapot és checkout gate;
- `src/config/env.js:298` - legal approval flag;
- `docs/LEGAL_RELEASE_SIGNOFF.md:5` - launch gate korlátozása és sign-off rend.

**Automatizált bizonyíték:** `npm run smoke:launch-gate` - „Launch gate smoke test passed.” A teszt adatbázis nélküli, kontrollált fixture-környezetben futott; az „outstanding readiness checks” log a negatív állapot modellezését mutatja, nem éles jóváhagyást.

**Fennmaradó kockázat:** A production approval rekordok, felelősök és aláírt külső dokumentumok nélkül a launch gate nem jelent jogi megfelelőséget.

### SEC-018 - Kötelező titkok és production konfiguráció validálása

**Állapot:** bevezetve, kóddal igazolva  
**Bizonyítéki minősítés:** C

**Kiinduló kockázat:** Hiányzó vagy üres OpenAI, Stripe, webhook, Resend, email- és URL-konfiguráció hibás fizetési, riport- vagy kommunikációs folyamatot, illetve biztonságtalan fallbacket okozhat.

**Végrehajtott javítás:** A konfigurációs modul kötelező változókat és biztonsági alapértékeket definiál, az adatbázis-konfiguráció hibáját diagnosztizálja.

**Forrásbizonyíték:**

- `src/config/env.js:168-180` - OpenAI, Stripe, webhook, Resend, email és URL változók;
- `src/config/env.js:202-239` - admin, SSL, rate limit és public token biztonsági beállítások.

**Fennmaradó kockázat:** A titkok tényleges erőssége, rotációja, Railway scope-ja és hozzáférési köre repo-szinten nem ellenőrizhető.

### SEC-019 - Production függőségek sérülékenységi ellenőrzése

**Állapot:** 2026. július 20-án belsőleg ellenőrizve  
**Bizonyítéki minősítés:** B

**Kiinduló kockázat:** Ismert sérülékenységet tartalmazó npm-függőség távoli kódfuttatást, szolgáltatásmegtagadást vagy adatszivárgást okozhat.

**Végrehajtott kontroll:** A production dependency tree rendszeresen `npm audit --omit=dev` ellenőrzést kap. A jelen pillanatkép auditja 151 összes függőséget és 0 ismert sérülékenységet jelzett.

**Automatizált bizonyíték:** 2026-07-20, `NODE_OPTIONS=--use-system-ca npm audit --omit=dev --json`, exit code 0; info/low/moderate/high/critical/total mind 0.

**Fennmaradó kockázat:** Az audit csak az npm advisory adatbázisban ismert és a lockfile-ban azonosítható hibákat látja; zero-day és alkalmazáslogikai hibát nem zár ki.

### SEC-020 - Biztonsági események, hibák és működési állapot monitorozhatósága

**Állapot:** bevezetve, kóddal és admin funkciókkal igazolva  
**Bizonyítéki minősítés:** C

**Kiinduló kockázat:** Elakadt queue, sikertelen email, feldolgozatlan webhook vagy hibás számlázás észrevétlen maradhat, ami ügyfélkárosodást és késői incidenskezelést okoz.

**Végrehajtott javítás:** Admin control center, queue-, email-, post-payment- és operational alert funkciók, esemény- és retry státuszok készültek. A webhook, queue, invoice, consent és privacy folyamatok külön adatbázis-állapotot és auditmezőket használnak.

**Forrásbizonyíték:**

- `src/services/admin-alert.service.js` - admin riasztási összesítések;
- `src/services/post-payment-monitoring.service.js` - fizetés utáni folyamatfigyelés;
- `src/services/analysis-queue.service.js` - queue állapot, retry és stale recovery;
- `src/services/webhook.service.js` - webhook állapotok;
- `public/admin-dashboard.js` - műveleti és monitorozási felület.

**Fennmaradó kockázat:** Nincs csatolt külső, 24/7 riasztási csatorna, SIEM, log-retention export, on-call rend vagy bizonyított reakcióidő.

---

## 7. Függő külső és üzemeltetési bizonyítékok

### SEC-P01 - Független penetrációs teszt

**Állapot:** nyitott  
**Minősítés:** P  
**Szükséges eredmény:** OWASP-alapú, külső fél által végzett API-, admin-, Webflow-, checkout- és jogosultsági teszt; megállapítások, javítási retest és aláírt zárójelentés.  
**Élesítésre gyakorolt hatás:** erősen ajánlott az első nagy kampány előtt; külső „auditált” állítás feltétele.

### SEC-P02 - Production IAM- és titokkezelési bizonyíték

**Állapot:** nyitott  
**Minősítés:** P  
**Szükséges eredmény:** Railway, Stripe, OpenAI, Resend, Számlázz.hu és adatbázis felhasználók/role-ok listája; MFA; legkisebb jogosultság; titokrotáció dátuma; kilépő felhasználó visszavonási folyamat.  
**Élesítésre gyakorolt hatás:** kötelező üzemeltetési sign-off.

### SEC-P03 - Szállítói DPA, adattovábbítás és alfeldolgozói bizonyíték

**Állapot:** nyitott  
**Minősítés:** P  
**Szükséges eredmény:** DPA-k, régiók, SCC/TIA ahol szükséges, retention és tréningre felhasználás kizárása/konfigurációja, alfeldolgozói lista.  
**Élesítésre gyakorolt hatás:** jogi és DPIA lezárási feltétel.

### SEC-P04 - Éles konfigurációs pillanatkép

**Állapot:** nyitott  
**Minősítés:** P  
**Szükséges eredmény:** titkok nélküli, dátumozott Railway konfigurációexport vagy screenshot a következőkről: secure cookie, legacy auth false, public token required, DB rate limit, fail closed, DB SSL, CORS allowlist, webhook retention és launch gate.  
**Élesítésre gyakorolt hatás:** kötelező belső release evidence.

### SEC-P05 - Backup restore, worker crash és incidensgyakorlat

**Állapot:** nyitott  
**Minősítés:** P  
**Szükséges eredmény:** dátumozott adatbázis-restore próba, worker kill/recovery, webhook replay, queue lease takeover, duplikált számla elleni próba és incidens runbook tabletop jegyzőkönyv.  
**Élesítésre gyakorolt hatás:** nagy kampány előtt kötelező kapacitási és helyreállítási bizonyíték.

### SEC-P06 - Független jogi, adatvédelmi és szakmai tartalmi jóváhagyás

**Állapot:** nyitott  
**Minősítés:** P  
**Szükséges eredmény:** célországokra kiterjedő jogi/privacy review, DPIA jóváhagyás, gyermekpszichológiai kérdésbank- és riportreview, orvostechnikai besorolási álláspont.  
**Élesítésre gyakorolt hatás:** egészségügyi következtetés kockázata miatt az EU-s széles körű élesítés előtt szükséges.

---

## 8. Dátumozott ellenőrzési napló

| Dátum | Vizsgált commit | Ellenőrzés | Eredmény | Megjegyzés |
|---|---|---|---|---|
| 2026-07-20 | `b2d8e6b27f8b3084abd232e0488a8acdd91dfeb9` | `npm run audit:security` | **PASS, 10/10** | Admin session/CSRF, token hash, checkout access, fragment, localStorage, webhook-minimalizálás, rate limit/HSTS, DB SSL és migration kontrollok. |
| 2026-07-20 | ugyanaz | `npm run smoke:legal-consent` | **OK** | Hozzájárulási modell belső smoke ellenőrzése. |
| 2026-07-20 | ugyanaz | `npm run smoke:legal-governance` | **OK** | Jogi governance és érintetti folyamat belső smoke ellenőrzése. |
| 2026-07-20 | ugyanaz | `npm run smoke:launch-gate` | **PASS** | Adatbázis nélküli fixture; az outstanding readiness log negatív állapot szimuláció, nem production sign-off. |
| 2026-07-20 | ugyanaz | `NODE_OPTIONS=--use-system-ca npm audit --omit=dev --json` | **0 sérülékenység** | 151 összes dependency; 148 production, 0 ismert advisory. |

### 8.1. Auditkimenet kivonata

```text
PASS Admin dashboard uses session + CSRF instead of raw token headers
PASS Admin middleware creates HttpOnly session and verifies CSRF
PASS Customer session access tokens are hashed and enforced
PASS Checkout retry requires customer session token
PASS Success/cancel pages pass session access token only from hash/sessionStorage
PASS Questionnaire draft answers are not persisted in localStorage
PASS Stripe webhook payload is minimized before database persistence
PASS Rate limiting can use database-backed counters and production HSTS
PASS Database SSL behavior is explicit and configurable
PASS Security hardening migration exists
Security audit passed.
```

## 9. Biztonsági változási előzmény

| Commit | Dátum | Biztonsági jelentőség |
|---|---|---|
| `a850770` | 2026-07-14 | Checkout és feldolgozási pipeline hardening. |
| `254efef` | 2026-07-14 | Élesítési readiness és checkout flow erősítése. |
| `b832826` | 2026-07-15 | GDPR consent és jogi launch safeguardok. |
| `ae917dd` | 2026-07-15 | Checkout visszaállítása advisory launch gate mellett. |
| `bfe0d72` | 2026-07-16 | Admin és checkout biztonsági hardening. |
| `b2d8e6b` | 2026-07-16 | Jogi governance és DPIA workflow. |

## 10. Élesítés előtti kötelező bizonyítékcsomag

Az alábbi bizonyítékok hiányában a belső kódállapot megfelelő irányú, de a teljes production biztonsági állapot nem tekinthető lezártnak:

1. Production env kontrolllista aláírva, titkok értéke nélkül.
2. Railway service-ek és database role-ok jogosultsági listája.
3. Stripe webhook érvényes/érvénytelen aláírási replay jegyzőkönyv.
4. Dupla checkout és ismételt webhook idempotencia-jegyzőkönyv.
5. Két workerrel végzett lease/failover teszt.
6. Számlázási timeout és duplikációellenes sandbox teszt.
7. Adatmegőrzési cron és törlési napló mintája.
8. Backup-visszaállítás időponttal, RTO/RPO eredménnyel.
9. Érintetti kérelem teljes próba exporttal és törléssel.
10. Független penetration test és retest.
11. Vendor DPA/SCC/TIA csomag.
12. Jogi, DPIA és szakmai tartalmi sign-off.

## 11. Felülvizsgálati és jóváhagyási lap

| Szerepkör | Név | Dátum | Döntés / aláírás |
|---|---|---|---|
| Dokumentumgazda |  |  |  |
| Műszaki felelős |  |  |  |
| Adatvédelmi felelős / DPO |  |  |  |
| Külső biztonsági auditor |  |  |  |
| Jogi jóváhagyó |  |  |  |
| Szakmai tartalmi jóváhagyó |  |  |  |

## 12. Felülvizsgálati szabály

A nyilvántartást frissíteni kell:

- minden biztonsági vagy adatkezelési változtatás után;
- új külső szolgáltató vagy új célország bevezetésekor;
- security advisory vagy incidens után;
- production infrastruktúra vagy worker-topológia változásakor;
- negyedévente akkor is, ha nem történt kódváltozás;
- minden külső audit megállapításának lezárásakor.

Minden új bizonyítékhoz rögzíteni kell a dátumot, a vizsgált commitot vagy konfigurációverziót, a végrehajtót, az ellenőrzési módszert, az eredményt és az artifact elérési helyét.

---

**Belső validációs nyilatkozat:** A dokumentumban felsorolt forrásfájlok és automatizált ellenőrzések a megjelölt commiton 2026. július 20-án belsőleg áttekintésre kerültek. Ez az állítás reprodukálható műszaki ellenőrzést dokumentál, de nem helyettesíti az éles konfiguráció auditját vagy a független tanúsítást.
