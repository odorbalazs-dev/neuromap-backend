# Webflow es landing page szerzodes

Ez a dokumentum az uj landing page legfontosabb technikai szerzodese. A landing vizualisan teljesen ujratervezheto, de a kerdoiv runtime csak akkor marad stabil, ha az alabbi hatarokat megtartjuk.

## Aktualis external loaderek

Engine:

```html
<script src="https://neuromap-backend-production-969d.up.railway.app/public/webflow/engine.js?v=20260726-legal-rights-v3"></script>
```

Checkout success/cancel:

```html
<script src="https://neuromap-backend-production-969d.up.railway.app/public/webflow/checkout-pages.js?v=20260721-customer-experience-v2"></script>
```

Az aktualis, dashboardon masolhato snippetek forrasa a `webflow-embed-manager.service.js`. Uj verzional egyszerre kell frissiteni:

- a runtime belso verziojat;
- az embed manager verziojat;
- a `web/*.html` loader mintakat;
- a Webflow Engine/checkout embedben levo query-string verziot.

## Betoltesi sorrend

A jelenlegi Webflow oldal tortenetileg a kovetkezo logikai sorrendet igenyli:

1. UI, forditasok es `NM_CONFIG`.
2. Triage bank.
3. Specifikus bank bundle.
4. Webflow bridge es extra bankok.
5. Engine loader utolsokent.

Az uj oldal megvalositasa elott a Webflow Navigatorban ellenorizni kell a tenyleges embed-sorrendet. Az engine inicializalaskor azonnal keresi a bankokat es a kotelezo DOM-elemeket.

## Runtime globalok

Az engine a kovetkezo bongeszo-globalokkal dolgozik:

```text
window.NM_CONFIG
window.NM_UI
window.NM_UI_FALLBACK
window.NM_TRIAGE_BANK
window.NM_SPECIFIC_BANK
window.NM_EXTRA_BANK
window.NM_ADAPTIVE_ENGINE
window.NM_LEGAL_CONSENT
```

Az uj landing ne hozzon letre azonos nevu, inkompatibilis globalokat.

## Kotelezo vagy runtime altal hasznalt DOM ID-k

```text
backBtn
checkoutStatus
childAge
email
labelChildAge
labelEmail
langButtons
langSwitch
languageModal
modalIntro
modalTitle
name
nextBtn
nmApp
nmEngineBootGate
nmProgressSteps
nmResumeBanner
nmSocialLanding
pageTitle
paymentBtn
progressBar
progressText
questionnaireStart
specificSection
summarySection
triageSection
```

Az `nm-engine-boot-style`, `nm-frontend-design-v3`, `nm-landing-polish-v2` es `nm-package-selector-style` az engine altal injektalt style elemek azonositoinak peldai. Uj CSS ne utkozzon ezekkel.

Az ID-ket csak akkor szabad atnevezni, ha ugyanabban a valtozasban az engine osszes hivatkozasa es smoke tesztje is frissul.

## Landing felismeresi pontok

Az engine az alabbi szelektorokkel keresi a landinget:

```css
#nmSocialLanding
.nm-social-landing
.nm-landing
[data-nm-landing]
```

A hero felismerese:

```css
.nm-hero
[data-nm-section="hero"]
```

A kerdoivindito CTA felismerese:

```css
.nm-start-btn
[data-nm-cta]
a[href="#questionnaireStart"]
a[href*="questionnaireStart"]
```

Az uj landingben legalabb egy egyertelmu `[data-nm-landing]`, `[data-nm-section="hero"]` es `[data-nm-cta]` jeloles legyen. Az explicit data-attributum stabilabb, mint a vizualis classnevhez kotes.

## Landing -> kerdoiv allapotvaltas

CTA utan az engine `html.nm-questionnaire-open` allapotot hasznal. Ebben:

- a marketing landing eltunik;
- a kerdoiv eleje azonnal lathato;
- a fix topbar megmarad;
- a felhasznalo nem latja egyszerre a teljes landinget es a kerdoivet;
- a gorgetesi pozicio a `questionnaireStart`/`nmApp` kozelebe kerul.

Az uj landing ne allitsa vissza sajat scriptbol a marketing szekciok `display` ertekeit a kerdoiv modban. Ez volt korabban annak egyik oka, hogy a landing teteje a kerdoiv felett megmaradt.

## Fix fejlec

Az engine a `.nm-topbar` elemet a `body` kozelebe mozgatja, fix poziciot ad neki es injektalhat egy `.nm-brand-lockup` markajelzest. Az uj landing:

- egyetlen topbart tartson;
- ne tegye transzformalt/overflow-hidden szulobe;
- ne irja felul kesobb `position: static` ertekkel;
- biztositson eleg felso helyet, hogy a tartalom ne csusszon ala;
- mobilon is tartsa elerhetoen a nyelvvalasztot.

## Nyelv es RTL

Tamogatott nyelvek:

```text
hu en de it es zh ja ar pl pt fr
```

Alapszabalyok:

- Minden landing-szovegnek mind a 11 nyelven kell leteznie.
- Nem elfogadhato, ha a kivalasztott nyelv es az angol keveredik.
- Arabnal `html[dir="rtl"]` es megfelelo iranyu komponensek kellenek.
- A nyelvvalaszto az `nm_lang` tarolasi kulcsot es az engine publikus nyelvi fuggvenyeit hasznalja; ne keszuljon masodik, kulon nyelvallapot.
- Hosszu nemet, lengyel es romanizalatlan arab/japan szovegeknel mobil wrapot kell vizsgalni.
- Ne skalazz fontot viewport-szelesseggel; hasznalj stabil responsive mereteket.

## Jogi hozzajarulas

Az engine dinamikusan tolti a `legal-consent.js` fajlt. A kerdoiv inditasa elott:

1. megfelelo nyelvu reszletes tajekoztatas jelenik meg;
2. a szulo kulon elfogadja a kotelezo jogi es adatvedelmi pontokat;
3. a backend consent receiptet ad;
4. a checkout ezt a receiptet kotelezoen elkuldi.

A vásárlás indításakor ezektől elkülönülő, nem előre bejelölt megerősítés kéri
a digitális tartalom azonnali teljesítését és az alkalmazandó elállási jog
elvesztésének tudomásulvételét. A landing vagy más frontend-kód ezt nem állíthatja
be automatikusan.

Az adatvédelmi joggyakorlási felület session tokent kér, majd a megadott emailre
küldött, rövid élettartamú egyszer használatos kóddal hitelesíti a kérelmezőt.
A kódot, a kérelem tokent és az exportált adatot marketing vagy analitikai
rendszernek átadni tilos.

Az uj landing nem kerulheti meg, nem elore pipalhatja es nem rejtheti el ezt a folyamatot. A modalnak billentyuzettel, fokuszcsapdaval, Esc/cancel viselkedessel es ertelmes hibauzenettel kell mukodnie.

## Csomagvalasztas

Az engine a ket csomagot az ajanlati katalogushoz illesztve kezeli:

```text
standard_v1 - 7.99 USD
plus_v1     - 9.99 USD
```

Kapcsolodo data-attributumok:

```text
data-nm-package-selector
data-nm-package-code
data-nm-package-section
```

Tarolasi kulcs: `nm_package_code_v1`.

Az uj landing mutathat mas vizualis osszehasonlitast, de:

- a kodok nem valtozhatnak;
- az ar nem lehet kliensoldali forras;
- nem allithat olyan Plus elonyt, amely nincs az entitlement katalogusban;
- a valasztasnak a summary oldalon es checkout payloadban is ugyanazt kell jelentenie.

## Biztonsagosan modosithato felulet

Altalaban biztonsagos:

- hero, szekciok, tipografia, spacing es responsive layout;
- lokalizalt landing copy;
- bizalmi elemek es csomagbemutatas;
- valos, nem diagnosztikai peldak;
- CTA-k vizualis hierarchiaja;
- a landing sajat kepei es mediai;
- Webflow markup, ha a fenti data-attributumok es ID-k megmaradnak.

Backend-koordinaciot igenyel:

- checkout payload shape;
- package code vagy ar;
- kerdoiv ID-k es valaszskala;
- triage/specifikus darabszam;
- consent receipt es legal flow;
- session/status tokenkezeles;
- analytics esemenynevek vagy parameterek;
- bank- es pontozasi logika;
- success/cancel URL-struktura.

## Analytics szerzodes

A frontend tobbek kozott ezeket az esemenyeket kuldi a `dataLayer`/`nmTrack` utvonalon:

```text
nm_landing_view
nm_language_selected
nm_questionnaire_loaded
nm_questionnaire_started
nm_triage_completed
nm_specific_completed
nm_package_selected
nm_checkout_started
nm_checkout_success_view
```

Erzekeny valasz, gyermeknev, email, pontszam vagy feltetelezett egeszsegugyi allapot nem kerulhet marketing analytics payloadba. A kliens oldali esemenyek meresi segedeszkozok, nem fizetesi igazsagforrasok.

## Checkout payload hatar

Az uj landing fejlesztese nem modosithatja a kovetkezo elvarasokat:

```text
25 triage ID + 25 answer
30 specific ID + 30 answer
0 vagy 5 extra ID + answer
answer: egesz 0..3
age: egesz 3..17
language: a 11 tamogatott kod egyike
packageCode: standard_v1 vagy plus_v1
consent: backend receipt
purchaseConfirmations: külön vásárláskori megerősítések
```

## Piszkozat es szemelyes adatok

Az engine 4 oran at kepes a kerdoiv nem szemelyes allapotat `sessionStorage`-ban helyreallitani. Nev es email nem tarolhato a draftban. Uj landing vagy uj onboarding ne vezessen be tartos localStorage tarolast szemelyes vagy erzekeny adatra.

## Uj landing ajanlott technikai megoldasa

Egy nagy inline Webflow embed helyett:

1. a vizualis HTML lehet Webflow markup;
2. a runtime es i18n legyen verziozott kulso asset;
3. az engine loader maradjon rovid;
4. az uj landing sajat classai `nm-landing-*` namespace-t hasznaljanak;
5. az engine szerzodes data-attributumokkal kapcsolodjon;
6. publish elott az embed managerben szereplo verzio egyezzen a Webflow loaderrel.

## Kotelezo vizualis ellenorzes

Legalabb ezekkel a viewportokkal kell screenshot es interakcios ellenorzes:

```text
1440 x 900
1280 x 720
390 x 844
360 x 800
```

Nyelvi mintak:

```text
hu - alap latin es ekezetek
de - hosszu szavak
ja - CJK tordeles
ar - RTL
```

Ellenorizni kell: nincs atfedes, nincs kesleltetett meretugras, CTA elrejti a landinget, topbar fix, nyelvvaltas teljes, consent elerheto, csomagvaltas mukodik, summary es checkout CTA lathato.
