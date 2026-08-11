# Minosegi es kiadasi ellenorzolista

## 1. Munka elotti allapot

- [ ] `git rev-parse --show-toplevel` a megfelelo repot adja.
- [ ] `git status --short` elmentve/ertelmezve.
- [ ] A mar letezo modositasokat nem irjuk felul.
- [ ] Az aktualis loader es belso verzio azonositva.
- [ ] A Webflow Navigator tenyleges embed-sorrendje ellenorizve.
- [ ] Az uj landing kovetelmenyei es nem-celjai rogzitve.

## 2. Szerzodesek

- [ ] A kotelezo DOM ID-k megmaradtak.
- [ ] A landing/hero/CTA data-attributumok megvannak.
- [ ] A CTA `nm-questionnaire-open` modba valt, a landing eltunik.
- [ ] A topbar fix marad, nem csuszik ki transzformalt kontener miatt.
- [ ] A kerdoiv payload darabszamai valtozatlanok.
- [ ] `standard_v1` es `plus_v1` kod valtozatlan.
- [ ] A consent receipt tovabbra is kotelezo.
- [ ] Nev/email nem kerul kerdoiv-draftba vagy analyticsbe.

## 3. Tartalom es UX

- [ ] A hero elso viewportja rovid es attekintheto.
- [ ] A marka, fo ertekigeret es CTA azonnal ertheto.
- [ ] A kovetkezo szekciobol mar latszik egy resz.
- [ ] Nincs diagnosztikai vagy felelmet kelto allitas.
- [ ] A Standard es Plus kulonbsege konkret es valos.
- [ ] Az ar mellett szerepel, hogy egyszeri fizetes.
- [ ] A PDF/riport bemutatas valos tartalmat mutat.
- [ ] Nincs felesleges, ismetlodo aprobetus bizalmi kapszula.
- [ ] Az ovoda/iskola szovegek termeszetesek es ertelmesek.
- [ ] A felhasznalo kerdoiv utan a summary elejen es vegen is eleri a kovetkezo lepest.

## 4. Nyelv

- [ ] Mind a 11 nyelvhez teljes landing-copy van.
- [ ] Nincs angol/valasztott nyelv keveredes.
- [ ] Magyar ekezetek es nyelvspecifikus irasjelek helyesek.
- [ ] `de` hosszu szovegek nem lognak ki.
- [ ] `ja` es `zh` tordelese olvashato.
- [ ] `ar` RTL irany, igazitas es gombsorrend helyes.
- [ ] Csomagnevek, CTA-k, hibak es jogi modal is lokalizalt.

## 5. Accessibility

- [ ] Minden interaktiv elem billentyuzettel elerheto.
- [ ] Fokuszstilus lathato.
- [ ] Modal fokuszcsapda es Esc/cancel mukodik.
- [ ] Cimke es input kapcsolata helyes.
- [ ] Szinkontraszt megfelelo.
- [ ] A valaszok nem csak szinnel kulonboznek.
- [ ] Nincs automatikus fokuszvesztes rendereleskor.
- [ ] `prefers-reduced-motion` mellett nincs zavaró animacio.

## 6. Responsive es vizualis QA

- [ ] 1440 x 900 screenshot.
- [ ] 1280 x 720 screenshot.
- [ ] 390 x 844 screenshot.
- [ ] 360 x 800 screenshot.
- [ ] Nincs horizontal scroll.
- [ ] Nincs szoveg- vagy gombatfedes.
- [ ] Nincs ket masodperc utani meretugras vagy CSS-feluliras.
- [ ] Fix fejlec alatt a tartalom nem takarodik.
- [ ] A nyelvi modal mobilon is teljesen hasznalhato.

## 7. Funkcionalis frontend

- [ ] Nyelvvalasztas teljesen ujrarendereli a landinget.
- [ ] Csomagvalasztas ketiranyu es allapottarto.
- [ ] A CTA megnyitja a jogi/kerdoiv flow-t.
- [ ] A 25 triage kerdes betolt.
- [ ] A 30 specifikus kerdes betolt.
- [ ] Extra 5 csak indokolt esetben jelenik meg.
- [ ] Vissza/kovetkezo megorzi a valaszokat.
- [ ] 4 oras draft resume mukodik nev/email nelkul.
- [ ] Summary olvashato es checkout CTA mukodik.
- [ ] Success/cancel oldal a megfelelo nyelven es allapotban jelenik meg.

## 8. Automatizalt ellenorzesek

Gyors frontend kor:

```powershell
node --check public\webflow\engine.js
node --check public\webflow\legal-consent.js
node --check public\webflow\checkout-pages.js
npm run smoke:browser-engine
npm run smoke:engine-age-field
npm run smoke:legal-consent
npm run smoke:two-tier-offer
npm run smoke:checkout-pages
npm run audit:language-quality
```

Teljes kor:

```powershell
npm run audit:all
```

- [ ] Minden parancs kilepesi kodja 0.
- [ ] A generalta artifactok diffje atnezve.
- [ ] A teszt nem irt felul felhasznaloi munkat.

## 9. Biztonsag es adatvedelem

- [ ] Nincs secret vagy token frontend assetben.
- [ ] Nincs PII a konzollogban vagy analyticsben.
- [ ] A checkout backend validacioja valtozatlanul aktiv.
- [ ] A consent flow nem megkerulheto.
- [ ] Privacy es Terms URL-ek publikusak es aktualisak.
- [ ] Marketing tracker nem kap kerdoivvalaszt vagy fokuszt.
- [ ] CORS nem lett szelesebb indok nelkul.
- [ ] Uj kulso scripthez supply-chain es CSP hatas atnezve.

## 10. Release

- [ ] Runtime belso verzio novelve.
- [ ] Embed manager verzio frissitve.
- [ ] `web/*.html` loader mintak frissitve.
- [ ] Webflow embed cache-busting verzio frissitve.
- [ ] Webflow Publish megtortent.
- [ ] Railway deploy sikeres.
- [ ] `/health` es `/health/version` rendben.
- [ ] Worker service logja tenyleges workert mutat.
- [ ] Admin dashboard launch-readiness es operational alert rendben.
- [ ] Egy teljes Stripe tesztvasarlas vegigment a webhook -> worker -> PDF -> email -> invoice lancon.
- [ ] Commit csak a tervezett fajlokat tartalmazza.
- [ ] Push utan a remote commit ellenorizve.

