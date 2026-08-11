# Aktualis allapot

Allapotrogzites: 2026-07-26

## Git

- Repo: `odorbalazs-dev/neuromap-backend`
- Tavoli repo: `https://github.com/odorbalazs-dev/neuromap-backend.git`
- Ag: `main`
- Rogzitett HEAD az atadas keszitesekor: `4eae093`
- A munkafa nem tiszta. A helyi allapot ujabb a fenti commitnal.

Az uj chat semmilyen `reset`, `checkout --`, automatikus visszaallitas vagy tomeges feluliras muveletet ne vegezzen a diff elozetes megertese nelkul.

## Jelenlegi, meg nem commitolt munka

A kovetkezo teruleteken vannak helyi modositasok:

- Webflow engine es checkout oldalak.
- Jogi hozzajarulasi frontend.
- Webflow embed manager es beillesztheto loader fajlok.
- Nyelvi audit es kapcsolodo smoke tesztek.
- DPIA, vendor-adatkezelesi dokumentumok es integritasfajlok.
- Biztonsagi bizonyitek- es DPIA-generalo scriptek.

Az érintett területek közé tartozik a Webflow engine, a jogi és vásárlási
hozzájárulás, az adatvédelmi joggyakorlás, a biztonsági kontrollok, a checkout,
a worker/recovery folyamat, a DPIA és a független validációs dokumentáció.
Mindig futtasd újra a `git status --short` parancsot; a dokumentumban szereplő
leírás nem helyettesíti a munkafa tényleges ellenőrzését.

## Aktiv frontend es ajanlatverziok

- Webflow engine: `20260726-legal-rights-v3`
- Checkout success/cancel loader: `20260721-customer-experience-v2`
- Webflow embed manager: `20260726-legal-rights-v3`
- Ajanlati katalogus: `2026-07-two-tier-v1`
- Standard csomag: `standard_v1`, 7.99 USD
- Plus csomag: `plus_v1`, 9.99 USD
- Regi 5 USD-s ajanlat nem valaszthato.

## Tamogatott nyelvek

`hu`, `en`, `de`, `it`, `es`, `zh`, `ja`, `ar`, `pl`, `pt`, `fr`

Az arab oldal RTL. Minden felhasznaloi szovegnek es checkout-oldalnak ugyanazon a kivalasztott nyelven kell maradnia. Angol fallback csak hibaelharitasi vedohalo, nem elfogadhato vegso UX.

## Kerdesbankok

- Triage bank: 250 tetel.
- ADHD bank: 250 tetel.
- ASD bank: 250 tetel.
- ANXIETY bank: 250 tetel.
- DEPRESSION bank: 250 tetel.
- LEARNING bank: 250 tetel.
- A runtime egy triage korben 25 kerdest, majd 30 specifikus kerdest valaszt.
- Bizonytalan dontesnel 5 kiegeszito kerdes jelenhet meg.

## Legutóbbi ellenőrzés

A 2026-07-26-i jogi és biztonsági módosítások utáni teljes audit eredményét
csak az aktuális `npm run audit:all` futás kimenete igazolja. Korábbi sikeres
futást nem szabad az új változások bizonyítékaként kezelni. A vizuális Webflow,
checkout és Word/PDF ellenőrzés külön kiadási kapu marad.

## Fontos aktualis mukodes

- A jogi hozzajarulasi folyamat a kerdoiv inditasakor aktiv, nem pusztan a landing megtekintesekor.
- A kerdoiv 4 oras, szemelyes adatot nem tarolo `sessionStorage` piszkozat-visszaallitast hasznal.
- A nev es email nem kerul a kerdoiv-piszkozatba.
- A checkout csak ervenyes, backend altal kiallitott hozzajarulasi bizonylattal indulhat.
- A digitális teljesítés kérése és az elállási jog elvesztésének tudomásulvétele külön, közvetlenül a vásárlás előtt történik.
- Az adatvédelmi kérelmek végrehajtása rövid élettartamú emailes OTP-hitelesítéshez kötött.
- Az éles production launch gate csak dokumentált, tartós bizonyítékokkal nyitható meg.
- A frontend ket csomagot kezel; az arat es jogosultsagokat a backend katalogusa hitelesiti.
- A fizetes utan a webhook sorba allitja az elemzest es a szamlazast; a kulon Railway worker dolgozza fel.

## Elavult vagy masodlagos anyag

- `PROJECT_STATE.md`: torteneti kiindulopont, nem teljes aktualis forras.
- Korabbi chat-szovegek es kepernyokepek: kontextusnak hasznalhatok, implementacios szerzodesnek nem.
- Generalt bundle fajlokat nem szabad kezzel szerkeszteni, ha van hozza build script.
