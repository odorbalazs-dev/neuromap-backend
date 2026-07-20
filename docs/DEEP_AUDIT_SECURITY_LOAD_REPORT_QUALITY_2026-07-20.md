# NeuroMap Kids mélyaudit

**Dátum:** 2026-07-20  
**Vizsgált kódállapot:** `2d6e93a31d50169561d9022d57d9094969d7a2e5`  
**Területek:** biztonság, terhelhetőség, riport- és PDF-minőség  
**Jelleg:** belső műszaki audit és javítási bizonyíték, nem független tanúsítás

## 1. Vezetői összefoglaló

Az audit a fizetés, webhook, elemzési sor, OpenAI-riport, PDF-generálás és email-küldés teljes kódútját vizsgálta. A feltárt, kódból javítható magas kockázatú hibák javítása megtörtént.

Fő eredmények:

- a worker ugyanazt a szabályozott, adatkezelési és idempotencia-kapukkal védett jobfolyamatot használja, mint az admin és cron indítás;
- az HTTP-, OpenAI- és Stripe-hívások explicit időkorlátot és korlátozott újrapróbálást kaptak;
- a publikus hibaválaszok nem adnak vissza belső adatbázis-, Stripe- vagy feldolgozási részleteket;
- az email-küldés determinisztikus idempotencia-kulcsokkal védett a többszörös küldés ellen;
- a riport-contract már tartalmi minimumot, fejezetstruktúrát, bekezdésformát és nyelvspecifikus, nem diagnosztikai figyelmeztetést is ellenőriz;
- a PDF-tördelés a rendelkezésre álló oldal magasságához igazodik, így csökkent az árva címek és az üresen maradó oldalak kockázata;
- az elavult, nem használt szolgáltatás- és konfigurációs modulok törölve lettek;
- a teljes automatikus auditcsomag, a célzott regressziós tesztek és a produkciós függőségi audit megfelelt.

**Mérnöki következtetés:** a vizsgált commit kódszinten lényegesen erősebb és reprodukálható ellenőrzési kapukkal rendelkezik. Ez nem helyettesíti a produkciós terheléspróbát, a független penetrációs tesztet, a jogi jóváhagyást, a klinikai szakértői felülvizsgálatot vagy a 11 nyelv anyanyelvi ellenőrzését.

## 2. Hatókör és módszer

Az audit az alábbi láncot fedte le:

1. Webflow kérdőív és checkout payload fogadása.
2. Stripe Checkout és webhook feldolgozás.
3. PostgreSQL session- és analysis-job állapotgép.
4. Worker claim, lease, heartbeat, retry és stale-job helyreállítás.
5. OpenAI-riport generálás és tartalmi contract.
6. PDF-tördelés és fájlgenerálás.
7. Resend email-küldés, újraküldés és idempotencia.
8. HTTP szerverkorlátok, leállítás és hibakezelés.
9. Kérdésbankok, nyelvi állományok és riport-smoke tesztek.

Alkalmazott ellenőrzések:

- statikus forráskód- és importvizsgálat;
- titok- és veszélyes mintakeresés;
- JavaScript szintaxisellenőrzés;
- adatbázis-migrációs és queue-invariánsok ellenőrzése;
- automatizált audit- és smoke-tesztek;
- npm produkciós függőségi audit;
- PDF-generálás és renderelt oldalak vizuális mintavétele;
- DOCX OOXML-szerkezet, XML-érvényesség és kódolás ellenőrzése.

## 3. Biztonsági audit

### 3.1 Javított problémák

| Terület | Korábbi kockázat | Elvégzett javítás | Eredmény |
|---|---|---|---|
| Worker végrehajtás | A külön worker közvetlenül megkerülhette a központi job-szabályokat | A worker a `requeueStaleJobs` és `processNextAnalysisJob` szolgáltatási utat használja | Egységes consent, governance, retry és állapotgép |
| Publikus hibák | Belső hibaüzenet kiszivároghatott a kliensnek | A kontrollerek általános 500-as üzenetet adnak, a részlet csak szerverlogba kerül | Kisebb információszivárgás |
| HTTP-erőforrások | Nem volt minden fontos kéréskorláthoz explicit limit | JSON-méretlimit, header/request/keep-alive timeout és graceful drain került be | Jobb DoS-ellenállás és kiszámíthatóbb leállás |
| Stripe-hálózat | Hosszan függőben maradó vagy duplán induló kérések | Timeout, korlátozott network retry és determinisztikus idempotencia-kulcs | Kisebb dupla checkout és függő kérés kockázat |
| OpenAI-hívás | Korlátlan várakozás vagy túl hosszú válasz | Timeout, retry- és output-token korlát | Kiszámíthatóbb kapacitás és költség |
| Email-küldés | Retry esetén többszörös ügyfélemail lehetett | Cél- és tartalomfüggő idempotencia-kulcsok | Kisebb duplikált email kockázat |
| Bejövő szöveg | Vezérlő- és bidi-karakterek megmaradhattak | NFKC normalizálás, kontroll- és bidi override karakterek eltávolítása | Kisebb log-, UI- és prompt-megtévesztési felület |
| Adatbázis-kapcsolat | A szolgáltatások nehezen voltak megkülönböztethetők | Szerepfüggő PostgreSQL `application_name` | Jobb incidensvizsgálat és kapacitásmonitoring |
| Elavult kód | Nem használt OpenAI/Resend/Stripe/payment modulok zavarták az ownershipot | A holt modulok törölve lettek, futásidejű importjuk nincs | Kisebb karbantartási és félrekonfigurációs felület |

### 3.2 Meglévő védelmek, amelyeket az audit igazolt

- admin session cookie: `HttpOnly`, `SameSite=Strict`, produkcióban `Secure`;
- CSRF-védelem és timing-safe admin token összehasonlítás;
- adatbázis-alapú rate limiting SHA-256-tal képzett azonosítókkal;
- Stripe webhook aláírás-ellenőrzés és webhook-idempotencia;
- queue claim `FOR UPDATE SKIP LOCKED` használatával;
- aktív job sessionönkénti egyedisége adatbázis-szinten;
- lease, heartbeat, exponenciális backoff és stale-job recovery;
- migrációs advisory lock és migration checksum;
- adatkezelési és hozzájárulási kapuk az elemzés és ügyfélkommunikáció előtt.

### 3.3 Biztonsági ellenőrzési eredmények

- `npm audit --omit=dev --json`: **0 ismert sérülékenység** 151 függőségben.
- JavaScript szintaxisellenőrzés: **24/24 érintett fájl megfelelt**.
- Produkciós hardening audit: **27/27 ellenőrzés megfelelt**.
- Beégetett API-kulcs vagy jelszó: **nem található a vizsgált módosításokban**.
- Törölt legacy modulokra mutató futásidejű import: **nem található**.

### 3.4 Fennmaradó, külső biztonsági feladatok

Ezek kódból nem hitelesíthetők, ezért élesítés előtt külön bizonyíték szükséges:

1. Független penetrációs teszt a publikus API-ra és az admin felületre.
2. Railway-, Stripe-, OpenAI-, Resend- és adatbázis-secret rotáció és jogosultsági felülvizsgálat.
3. Production rate-limit és fail-open/fail-closed beállítások ellenőrzése.
4. Incidenskezelési runbook gyakorlat és restore-próba.
5. DPA-k, adatmegőrzési folyamat és törlési kérelmek jogi/üzemeltetési jóváhagyása.

## 4. Terhelhetőségi audit

### 4.1 Architektúrális állapot

A feldolgozás adatbázis-alapú sorral és egymástól független worker lane-ekkel skálázható. A claim tranzakciós, a zárolt sorokat a többi worker kihagyja, a hosszú munkák lease-t és heartbeatet használnak, a hibák korlátozott próbálkozással és exponenciális késleltetéssel kerülnek újra sorra.

A web és worker szerep `SERVICE_ROLE` alapján szétválasztható. A worker concurrency 1-64 között állítható; az alapértelmezett kódoldali érték 1, a kampányminta 8 lane-t javasol csak ellenőrzött provider- és adatbázis-kvóták mellett. A PostgreSQL pool alapértelmezett maximuma szolgáltatásonként 10 kapcsolat.

### 4.2 Kapacitásmodell

Napi 5000 vásárlás egyenletes eloszlásban:

- 208,3 riport/óra;
- 3,47 riport/perc;
- 90 másodperces átlagos jobbal egy lane elméleti kapacitása 40 riport/óra;
- 8 lane elméleti kapacitása 320 riport/óra egy worker replikában.

Ez az elméleti számítás nem tartalmazza a forgalmi csúcsokat, provider rate limitet, retryt, hálózati ingadozást, nagyobb tokenfelhasználást vagy adatbázis-terhelést. Nyolc lane csak akkor tekinthető kampány-alapértéknek, ha az OpenAI és Resend kvóták, a Railway CPU/memória, valamint a Postgres pool- és max-connection kerete ezt méréssel igazolja.

### 4.3 Elvégzett terhelési javítások

- konfigurálható worker concurrency, idle/error sleep, lease és heartbeat;
- központi retry/backoff és stale-job recovery;
- szolgáltatási szerep láthatósága az adatbázisban;
- HTTP- és külső provider-timeoutok;
- OpenAI output-token korlát;
- Stripe- és email-idempotencia;
- graceful shutdown, amely deploykor nem vesz fel új munkát;
- hardening és campaign-readiness automatizált kapuk.

### 4.4 Élesítés előtti kötelező terheléspróba

1. Stagingben legalább kétórás, valós PDF- és emailgenerálást szimuláló teszt.
2. Külön burst-profil: 150 checkout 10 perc alatt, majd 500 checkout 30 perc alatt.
3. Mérendő KPI-k: queue age p50/p95/p99, job duration, retry rate, provider 429/5xx, DB pool wait, CPU, memória és email delivery latency.
4. Backpressure-riasztás: queue age és pending job küszöb.
5. Szándékos worker restart és stale-job recovery igazolása.
6. OpenAI- és Resend-kvóták írásos rögzítése.
7. Stripe webhook retry és endpoint-időkorlát ellenőrzése a Stripe Dashboardon.

**Következtetés:** a kódarchitektúra alkalmas kampányterhelés vizsgálatára és horizontális skálázásra, de napi 5000 fizetett riport produkciós kiszolgálása csak a fenti staging mérés és külső kvótaigazolás után állítható felelősen.

## 5. Riport- és PDF-minőségi audit

### 5.1 Elvégzett javítások

- A riport minimum teljes hossza 5000 karakter.
- Minden elvárt fejezetnek minimum tartalmi hossza van.
- A fejezetcímek hossza korlátozott, és a cím után kötelező az elkülönülő törzsszöveg.
- Mind a 11 nyelven kötelező a nem diagnosztikai jelleg megfelelő megfogalmazása.
- A contract-hibás első OpenAI-válasz javító promptot kap; a második hibás válasz nem jut PDF-be vagy emailbe.
- A PDF-tördelés a tényleges fennmaradó oldalhelyet vizsgálja, és bekezdés- vagy felsorolásszinten darabol.
- A smoke teszt kimeneti könyvtára elkülöníthető, így a vizuális QA reprodukálható.

### 5.2 Tartalmi állapot

- Öt specifikus bank van, bankonként 250 kérdéssel.
- A bank quality audit eredménye 100/100.
- A 11 nyelves automatikus audit nem talált hiányzó nyelvi mezőt vagy contract-hibát.
- A riport szerkezete, korosztályi részei, szülői javaslatai és nem diagnosztikai kerete automatizált teszttel ellenőrzött.

Fontos korlát: ez technikai és szerkezeti minőséget igazol. Nem jelenti a kérdésbankok pszichometriai validálását, diagnosztikai alkalmasságát vagy klinikai tanúsítását.

### 5.3 PDF-ellenőrzési eredmények

- alap smoke PDF: 9 oldal;
- stresszriport: 16 oldal;
- a mintavételezett renderelt oldalakon nem volt szövegátfedés vagy törzsszöveg nélküli árva fejezetcím;
- a teljes PDF smoke megfelelt.

### 5.4 Fennmaradó minőségi feladatok

1. Gyermek- és serdülőkori mentálhigiénés szakember dokumentált szakmai review-ja.
2. Anyanyelvi lektor minden támogatott nyelvre, külön gyermekpszichológiai terminológiai ellenőrzéssel.
3. Vaktesztelt mintariportok korosztályonként és fókuszterületenként.
4. Valós visszajelzések alapján olvashatósági, hasznossági és félreértési mutatók mérése.
5. Longitudinális kalibráció és verziózott bank/report release notes.

## 6. Automatizált bizonyítékok

| Ellenőrzés | Eredmény |
|---|---|
| `npm run audit:all` | Megfelelt |
| Bankok darabszáma | 5 x 250, megfelelt |
| Bank quality audit | 100/100 |
| 11 nyelves audit | Megfelelt, hiány nélkül |
| Engine selection smoke | Megfelelt |
| Checkout payload smoke | Megfelelt |
| Legal consent/governance smoke | Megfelelt |
| Analysis report contract smoke | 11 fejezet, pozitív és negatív esetek megfeleltek |
| Email idempotency smoke | Megfelelt |
| PDF smoke | Megfelelt |
| Admin dashboard smoke | Megfelelt |
| Production hardening audit | 27/27 |
| `npm audit --omit=dev --json` | 0 sérülékenység |
| `git diff --check` | Hiba nélkül; csak Windows sorvég-figyelmeztetés |
| DOCX OOXML-integritás | 3/3 csomag érvényes, mojibake-találat 0 |

## 7. Dokumentum-ellenőrzési korlát

A munkakörnyezetben nem volt elérhető LibreOffice/soffice, ezért a DOCX-fájlok képi renderelése nem volt végrehajtható. A fallback ellenőrzés a ZIP/OOXML csomag épségét, a kötelező részek jelenlétét, minden XML- és relationship-fájl parse-olhatóságát, valamint a gyanús karakterkódolás hiányát igazolta. Ez szerkezeti, nem tipográfiai bizonyíték.

## 8. Élesítési döntési kapu

### Kódszinten lezárt

- biztonsági hardening kapuk;
- queue/worker megbízhatóság;
- checkout- és email-idempotencia;
- riport-contract és PDF orphan guard;
- 11 nyelves automatikus teljességi ellenőrzés;
- ismert produkciós npm-sérülékenység hiánya.

### Külső bizonyíték nélkül nem tekinthető lezártnak

- független biztonsági audit vagy penetrációs teszt;
- produkciós terheléspróba és provider-kvótaigazolás;
- DPIA és jogi dokumentumok szakjogászi jóváhagyása;
- klinikai tartalom szakértői review-ja;
- minden nyelv anyanyelvi lektorálása;
- production backup-visszaállítás és incidensgyakorlat.

## 9. Végső minősítés

A `2d6e93a31d50169561d9022d57d9094969d7a2e5` commit a korábbi állapothoz képest érdemben csökkenti a duplikált feldolgozás, információszivárgás, függő külső kérések, árva PDF-címek és contract-hibás riportok kockázatát. Az automatizált belső műszaki kapuk megfeleltek.

Az audit alapján a rendszer **kódszinten staging- és ellenőrzött kampányterhelés-próbára alkalmas**. Teljes produkciós, napi 5000 vásárlásra vonatkozó alkalmasság, jogi megfelelőség, klinikai validitás vagy független biztonsági tanúsítás a felsorolt külső ellenőrzések nélkül nem állítható.
