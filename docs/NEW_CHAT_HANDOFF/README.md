# NeuroMap Kids - uj chat atadasi csomag

Frissitve: 2026-07-26

## Mire valo ez a csomag?

Ez a csomag arra keszult, hogy egy uj Codex/ChatGPT fejlesztesi chat gyorsan, de megbizhatoan atlasson egy mar nagy es osszetett NeuroMap Kids rendszert. A kozvetlen kovetkezo cel egy uj landing page megtervezese es megvalositasa ugy, hogy a mar mukodo kerdoiv, checkout, jogi hozzajarulas, fizetes, riport, szamlazas es monitoring ne seruljon.

A csomag szandekosan nem tartalmaz jelszot, API-kulcsot, admin tokent vagy adatbazis-kapcsolati adatot.

## Olvasasi sorrend

1. `NEW_CHAT_PROMPT_HU.md` - bemasolhato kezdoprompt az uj chathez.
2. `CURRENT_STATE.md` - aktualis git- es kiadasi allapot, fontos figyelmeztetesek.
3. `ARCHITECTURE_AND_FLOWS.md` - rendszerarchitektura es teljes end-to-end folyamat.
4. `REPOSITORY_MAP.md` - mappak, fontos fajlok es tulajdonosi hatarok.
5. `WEBFLOW_LANDING_CONTRACT.md` - az uj landing oldal legfontosabb technikai szerzodese.
6. `LANDING_PAGE_BRIEF.md` - termek-, UX-, tartalmi es vizualis brief.
7. `OPERATIONS_AND_DEPLOYMENT.md` - Railway, worker, adatbazis, konfiguracio es uzemeltetes.
8. `QUALITY_AND_RELEASE_CHECKLIST.md` - fejlesztesi es kiadasi ellenorzolista.
9. `CONTEXT_INDEX.json` - gepileg is feldolgozhato kontextusindex.

## Forrasok megbizhatosagi sorrendje

1. Az aktualis kod es adatbazis-migraciok.
2. Az aktualis `git diff` es `git status`.
3. Ez az atadasi csomag.
4. A tematikus dokumentumok a `docs/` mappaban.
5. A regi `PROJECT_STATE.md`, amely hasznos tortenet, de 2026-06-04 ota elavult reszeket tartalmaz.

Ha a dokumentacio es a kod elter, a kodot kell megvizsgalni, majd a dokumentaciot frissiteni. Nem szabad vakon a regi chat szovegebol vagy kepernyokepekbol implementalni.

## Biztonsagi szabalyok az uj chathez

- Ne masolja ki es ne dokumentalja a `.env` fajl ertekeit.
- Ne jelenitsen meg Stripe, OpenAI, Resend, Szamlazz.hu, Railway vagy admin titkokat.
- Ne toroljon es ne allitson vissza ismeretlen munkafa-modositast.
- Ne modositsa a kerdoiv pontozasi, beleegyezesi vagy checkout szerzodeset pusztan dizajnmunka kedveert.
- Ne allitson klinikai vagy diagnosztikai igenyt. A termek strukturalt, tajekoztato eloszuresi riportot ad, nem diagnozist.
- Commit es push csak kifejezett felhasznaloi keresre tortenjen.

## Mit kell az uj landing munka elott tenni?

```powershell
git rev-parse --show-toplevel
git status --short
git diff --stat
git log -5 --oneline
```

Ezutan olvasni kell legalabb a kovetkezo fajlokat:

```text
public/webflow/engine.js
public/webflow/legal-consent.js
src/services/webflow-embed-manager.service.js
src/config/products.js
src/utils/validateCheckoutPayload.js
src/utils/normalizeCheckoutPayload.js
web/engine-embed.full.html
```
