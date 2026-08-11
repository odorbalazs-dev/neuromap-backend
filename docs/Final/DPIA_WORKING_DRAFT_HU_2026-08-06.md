# NeuroMap Kids adatvédelmi hatásvizsgálat

> **Állapot: ADATKEZELŐI MUNKAPÉLDÁNY - JOGI TÁMASZKODÁSRA MÉG NEM ALKALMAS**
>
> Verzió: 2026-07-26-draft-4-hu
> Szükséges jóváhagyók: adatkezelő, képzett EU adatvédelmi jogász vagy DPO, biztonsági felelős, termékfelelős
> Ez a dokumentum mérnöki támogatással készült DPIA-munkapéldány. Nem jogi szakvélemény, nem tanúsítás, nem hatósági jóváhagyás, és önmagában nem igazolja a GDPR-megfelelést.

## 1. Döntés és hatókör

Az adatkezelést az éles indulás előtt adatvédelmi hatásvizsgálatot igénylő folyamatként kell kezelni. A szolgáltatás gyermekre vonatkozó, potenciálisan különleges kategóriájú információkat, sérülékeny érintetteket, szisztematikus pontozást/profilalkotást, AI-támogatott riportgenerálást, online fizetést, valamint több országra és nyelvre kiterjedő skálázást érint.

Ez a DPIA a teljes fizetős kérdőívfolyamatot lefedi:

1. felnőtt nyelvválasztása és jogi tájékoztatása;
2. az ÁSZF/adatkezelési tájékoztató külön elfogadása, a 9. cikk szerinti kifejezett hozzájárulás és az opcionális analitikai döntés;
3. felnőtt vásárló kapcsolattartási adatai és gyermekre vonatkozó megfigyelések;
4. determinisztikus kérdőívpontozás és fókuszterület-kiválasztás;
5. Stripe checkout és fizetési webhook;
6. sorba állított AI-támogatott riportgenerálás;
7. PDF és tranzakciós email kézbesítése;
8. számlagenerálás a Számlázz.hu rendszerén keresztül;
9. opcionális megfigyelési napló és follow-up üzenetek;
10. támogatás, biztonsági naplózás, adatvédelmi jogok, megőrzés és törlés;
11. szigorúan minimalizált analitika ott, ahol ehhez opcionális hozzájárulás történt.

A DPIA nem hagy jóvá klinikai felhasználást, diagnózist, kezelés kiválasztását, automatizált jogosultsági döntést, iskolai vagy munkáltatói felhasználást, kérdőíveredményeken alapuló hirdetési célzást vagy személyes adatok értékesítését.

## 2. Irányítás és elszámoltathatóság

| Szerep | Felelősség | Megnevezett felelős / állapot |
| --- | --- | --- |
| Adatkezelő | Meghatározza a célokat és eszközöket; jóváhagyja a DPIA-t | **Nyitott - a jogi személyt, székhelyet és letelepedési országot meg kell erősíteni** |
| Termékfelelős | Termékkör, nem diagnosztikus pozicionálás és kiadási döntés | **Nyitott - név szerinti felelős kijelölése szükséges** |
| Adatvédelmi vezető / DPO | Független felülvizsgálat, tanácsadás és monitorozás | **Nyitott - dokumentálni kell, hogy a GDPR 37. cikk alapján szükséges-e DPO** |
| Biztonsági felelős | Hozzáférés-kezelés, incidenskezelés, bizonyítékok és felülvizsgálat | **Nyitott - név szerinti felelős kijelölése szükséges** |
| Klinikai/tartalmi szakértő | Kérdőív- és riportállítások felülvizsgálata | **Nyitott - képzett külső szakmai review szükséges** |
| Adatfeldolgozók | Railway, Stripe, OpenAI, Resend, Számlázz.hu, Webflow és releváns infrastruktúra | **Szerződéses és adattovábbítási felülvizsgálat hiányos** |

Az adatkezelőnek fenn kell tartania a kapcsolódó adatkezelési nyilvántartást, adatfeldolgozói nyilvántartást, adattovábbítási értékelést, megőrzési ütemezést, érintetti jogi naplót, incidensnaplót, hozzájárulási bizonyítékokat és a DPIA által hivatkozott release sign-off dokumentációt.

## 3. Az adatkezelés leírása és adatáramlás

### 3.1 Adatáramlás

Felnőtt böngésző -> Webflow UI -> Railway API -> PostgreSQL -> Stripe checkout -> Stripe webhook -> elemzési sor/worker -> OpenAI API -> PDF-generátor -> Resend email -> felnőtt email címe. A számlázási adatok a fizetett sessionből a Számlázz.hu felé áramlanak. A megfigyelési napló adatai később tokenizált linken keresztül térhetnek vissza. Marketingeszközök csak durva, nem egészségügyi konverziós eseményeket kaphatnak, és csak akkor, ha az alkalmazandó hozzájárulás/konfiguráció ezt megengedi.

### 3.2 Érintettek

- a felnőtt vásárló, szülő, törvényes képviselő vagy felhatalmazott felnőtt;
- a felnőtt által leírt gyermek, aki nem a szerződő felhasználó;
- támogatási kapcsolattartók és adminisztrátorok, akiknek műveletei biztonsági naplókban megjelenhetnek.

A szolgáltatás nem kérheti a gyermek nevét. Egy becenév is személyes adat lehet, ha sessionnel, email címmel, válaszokkal vagy riporttal összekapcsolható, ezért a terméknek továbbra is csak a szülő vagy felnőtt vásárló nevét szabad kérnie.

### 3.3 Adatkategóriák

| Kategória | Példák | Érzékenység |
| --- | --- | --- |
| Felnőtt azonosító/kapcsolati adat | felnőtt neve, email, nyelv | Személyes adat |
| Gyermekre vonatkozó megfigyelések | viselkedés, érzelmek, tanulás, rutinok, társas és szenzoros megfigyelések | Potenciális 9. cikk szerinti egészséghez kapcsolódó adat |
| Származtatott szűrési adatok | pontszámok, rangsor, fókusz, confidence, riportszöveg | Potenciális 9. cikk szerinti következtetett egészséghez kapcsolódó adat |
| Szerződés/fizetés | csomag, ár, pénznem, Stripe-hivatkozások, időbélyegek | Személyes/pénzügyi metaadat |
| Számla | számlázási név/cím/adószám, számlaszám és státusz | Jogszabályi pénzügyi nyilvántartás |
| Hozzájárulási/jogi bizonyíték | szerepkör, szabályzatverziók, kifejezett hozzájárulás, időbélyegek, visszavonás | Elszámoltathatósági adat |
| Follow-up/napló | stratégiák, kontextus, jegyzetek és időbeli változások | Potenciális 9. cikk szerinti egészséghez kapcsolódó adat |
| Üzemeltetés/biztonság | job státusz, kézbesítési státusz, minimalizált request log, admin audit események | Személyes adat, ha összekapcsolható |

A core riporthoz nem szükséges szabad szöveges gyermeknév, pontos lokáció, iskola neve, orvosi dokumentáció, genetikai adat, biometrikus adat, hirdetési profil vagy közösségimédia-azonosító.

## 4. Célok és javasolt jogalapok

A végleges jogalapokat minden célpiacra és letelepedési helyre jóvá kell hagyatni. A mérnöki kialakítás jelenleg az alábbi konzervatív megfeleltetést támogatja:

| Cél | GDPR 6. cikk szerinti jogalap | GDPR 9. cikk szerinti feltétel | Megjegyzés |
| --- | --- | --- | --- |
| Fizetett riport készítése, fizetés, kézbesítés és támogatás | 6(1)(b), szerződés / szerződéskötést megelőző lépések | 9(2)(a), kifejezett hozzájárulás a kérdőívhez és következtetett egészséghez kapcsolódó adatokhoz | A visszavonás leállítja a jövőbeli érzékeny feldolgozást; a szerződés nem írhatja felül a 9. cikket |
| Számlázás és kötelező számviteli/fogyasztóvédelmi nyilvántartás | 6(1)(c), jogi kötelezettség | Általában nem szükséges kérdőíves adatra; a számlaadatokat el kell különíteni | A pontos nemzeti megőrzési időt meg kell erősíteni |
| Biztonság, visszaélés-megelőzés és szolgáltatásintegritás | 6(1)(f), jogos érdek | Kerülni kell a különleges kategóriájú tartalmat a logokban; ha elkerülhetetlen, jogi jóváhagyás szükséges | Dokumentált érdekmérlegelés szükséges |
| Adatvédelmi jogok és panaszkezelés | 6(1)(c), jogi kötelezettség | 9(2)(f) releváns lehet jogi igényeknél; jogász erősítse meg | A kérelmet a session email-címére küldött egyszer használatos kóddal kell megerősíteni; csak a kód hash-e tárolódik, 15 perces lejárattal és öt próbálkozásos korláttal |
| Termékbiztonsági és tartalmi minőségellenőrzés | 6(1)(f) vagy 6(1)(b), körülményektől függően | 9(2)(a) vagy anonimizálás | Csak minimalizált mintákkal és reviewer-hozzáféréssel |
| Opcionális analitika és hirdetési mérés | 6(1)(a), hozzájárulás | Nem kaphat különleges kategóriájú adatot | Külön hozzájárulás, visszavonhatóság, minimalizált események |

## 5. Szükségesség és arányosság

A kifejezett hozzájárulásnak konkrétnak, megfelelő tájékoztatáson alapulónak, egyértelműnek, bizonyíthatónak, a választott nyelvhez illeszkedőnek és az opcionális analitikától elkülönítettnek kell lennie. A checkout ettől külön rögzíti az azonnali digitális teljesítés kifejezett kérését és az elállási jogra gyakorolt következmény tudomásulvételét; ezek nem előre kijelölt mezők, és nem minősülnek a GDPR 9. cikke szerinti hozzájárulásnak.

### 5.1 Szükségesség

Az adatkezelés célja, hogy a felnőtt strukturált, nem diagnosztikus, szülőbarát előszűrési riportot kapjon. A kérdőívválaszok nélkül a szolgáltatás nem tud személyre szabott mintázatot és gyakorlati javaslatot adni. A fizetési, email- és számlaadatok a szerződés teljesítéséhez, kézbesítéshez és jogszabályi kötelezettségekhez szükségesek.

### 5.2 Kevésbé beavatkozó alternatívák

A rendszernek továbbra is minimalizálnia kell az adatokat:

- gyermek neve helyett felnőtt vásárló neve;
- strukturált válaszok szabad szöveg helyett;
- rövid összefoglaló fizetés előtt, teljes riport csak fizetés után;
- érzékeny adatok kizárása marketing/analitika felé;
- tokenizált hozzáférés közvetlen emailes személyazonosság-feltárás helyett;
- megőrzési idő és törlés automatizálása.

### 5.3 Pontosság és méltányosság

A szolgáltatás nem diagnózis. A scoring determinisztikus, a riport AI-támogatott magyarázatot ad, de nem helyettesíthet szakembert. Az UI-nak és a PDF-nek minden nyelven egyértelműen jeleznie kell a korlátokat, a bizonytalanságot és azt, mikor érdemes szakemberhez fordulni.

## 6. Átláthatóság és érintetti jogok

A folyamatnak a fizetés előtt közölnie kell:

- ki az adatkezelő és hogyan érhető el;
- milyen adatokat kér a rendszer és miért;
- hogy gyermekre vonatkozó megfigyelések és következtetések keletkezhetnek;
- hogy a riport nem diagnózis, nem orvosi eszköz és nem kezelési döntés;
- mely adatfeldolgozók vesznek részt;
- milyen országokba vagy szolgáltatókhoz történhet adattovábbítás;
- mennyi ideig őrződnek meg az adatok;
- hogyan vonható vissza a hozzájárulás;
- hogyan gyakorolható hozzáférés, helyesbítés, törlés, korlátozás, tiltakozás és adathordozhatóság;
- hogyan lehet panaszt tenni.

Érintetti jogok minimális elvárt működése:

| Jog | Támogatás | Nyitott kockázat |
| --- | --- | --- |
| Hozzáférés | tokenizált kérelem, majd a session email-címére küldött egyszer használatos kód ellenőrzése; siker után strukturált export | a manuális helyreállítási eljárás és külső visszaélési teszt még nyitott |
| Helyesbítés | email/support workflow és számlaadatoknál külön kezelés | érzékeny riport utólagos javítási hatása |
| Törlés | érzékeny session/report adatok törlése vagy pszeudonimizálása | számlázási és jogi megőrzés elkülönítése |
| Korlátozás | feldolgozási kapuk worker/email előtt | bizonyíték szükséges, hogy minden pipeline tiszteletben tartja |
| Hozzájárulás visszavonása | jövőbeli érzékeny feldolgozás leállítása | már teljesített digitális tartalom és számlázás kezelése |
| Tiltakozás | jogos érdeken alapuló log/biztonsági célok elbírálása | érdekmérlegelés szükséges |
| Adathordozhatóság | strukturált export a szerződés/hozzájárulás alapján kezelt adatokra | formátum és azonosítás véglegesítése |

## 7. Megőrzés és törlés

Javasolt adatmegőrzési logika:

| Adatkör | Javasolt megőrzés | Megjegyzés |
| --- | --- | --- |
| Kérdőívválaszok, scoring, riport, follow-up | alapértelmezés szerint 90 nap, majd törlés/pszeudonimizálás, ha rövidebb szerződéses szükséglet nem indokolható | a végleges időt jogász hagyja jóvá, a backup-életciklussal együtt |
| Email kézbesítési metaadat | rövid üzemeltetési idő, például 30-90 nap | tartalom nélkül |
| Számlaadatok | nemzeti számviteli és adózási szabályok szerint | elkülönítve az érzékeny kérdőíves adatoktól |
| Hozzájárulási bizonyíték | a jogi igényérvényesítési/elszámoltathatósági időig | minimalizált, verziózott |
| Biztonsági naplók | rövid, arányos idő | érzékeny tartalom nélkül |
| Admin audit események | belső ellenőrzési célra korlátozott idő | hozzáférés korlátozása |

A backup törlésre, visszaállításra és pszeudonimizálásra külön bizonyíték szükséges az éles indulás előtt.

## 8. Címzettek, adatfeldolgozók és adattovábbítások

| Szolgáltató | Funkció | Fő kockázat | Szükséges bizonyíték |
| --- | --- | --- | --- |
| Railway | hosting, API, adatbázis, worker | régió, hozzáférés, backup, naplók | DPA, régió, biztonsági bizonyíték, backup policy |
| Stripe | fizetés, checkout, webhook | pénzügyi adatok, nemzetközi továbbítás | DPA, adatáramlás, checkout jogi szöveg |
| OpenAI | AI-támogatott riportgenerálás | különleges kategóriájú tartalom, modellhasználat | DPA/terms, training kizárás, régió/transfer review |
| Resend | email kézbesítés | riport kézbesítése rossz címre, tracking | DPA, tracking beállítás, security review |
| Számlázz.hu | számlázás | jogszabályi megőrzés, adatpontosság | szerződés, adatmezők, megőrzés |
| Webflow | frontend hosting/embed | cookie/analytics, jogi modalok | adatfeldolgozói feltételek, cookie/consent review |
| Google/Meta/TikTok | opcionális marketing/analitika | különleges kategóriájú adat átadása tilos | consent, eseményminimalizálás, policy review |

Az adattovábbítások és harmadik országbeli transzferek jogalapját, SCC-ket, TIA-t és regionális beállításokat az élesítés előtt dokumentálni kell. A szolgáltatónkénti nyilvános forrásvizsgálatot, tényleges payloadot, eltéréseket és bekérendő fiókszintű bizonyítékokat a 18-20. melléklet és a `VENDOR_AND_TRANSFER_REGISTER.md` tartalmazza. A nyilvános szolgáltatói dokumentum nem helyettesíti az elfogadott DPA-t, a konkrét fiókbeállítás bizonyítékát vagy a TIA-t.

## 9. Automatizált feldolgozás és AI

A rendszer automatizált pontozást és AI-támogatott magyarázatot használ. A cél nem joghatás vagy hasonlóan jelentős hatás kiváltása, hanem tájékoztató jellegű, szülőbarát összegzés. Mégis fennáll a kockázat, hogy a felhasználó a riportot diagnózisként értelmezi vagy döntések alapjául használja.

Kötelező kontrollok:

- minden nyelven ismételt nem diagnosztikus figyelmeztetés;
- nincs kezelésre, jogosultságra, iskolai döntésre vagy szakvéleményre utaló állítás;
- prompt és output guardrail;
- modellverzió és promptverzió naplózása;
- minőségellenőrzési mintavétel;
- különleges kategóriájú adatok kizárása hirdetési és analitikai rendszerekből;
- emberi/ügyfélszolgálati útvonal panasz vagy hibás riport esetén.

## 10. Kockázatértékelési módszer

A kockázatértékelés valószínűség x hatás skálát használ:

| Pontszám | Jelentés |
| --- | --- |
| 1 | ritka / csekély |
| 2 | alacsony |
| 3 | közepes |
| 4 | magas |
| 5 | nagyon magas / súlyos |

| Kockázati helyzet | Eredendő LxI | Kontrollok / bizonyíték | Maradék LxI | Felelős / teendő |
| --- | ---: | --- | ---: | --- |
| Jogosulatlan hozzáférés gyermekhez kapcsolódó válaszokat/riportokat fed fel | 4x5=20 | tokenizált sessionök, admin auth, least-data API-k, korlátozott logok, biztonsági audit | 2x5=10 | Biztonsági felelős; külső penetrációs teszt és access review nyitott |
| Riport elgépelt vagy kompromittált email címre megy | 3x5=15 | email validáció, szerződés-visszaigazolás, kézbesítés-monitoring | 2x5=10 | Termék/adatvédelem; skálázás előtt email-ellenőrzés vagy javítási workflow |
| Felhasználó diagnózisként értelmezi a riportot | 4x5=20 | ismételt nem diagnosztikus szöveg, korlátok, szakemberhez irányítás | 2x5=10 | Klinikai/jogi külső review nyitott |
| AI nem biztonságos, túl magabiztos vagy téves tanácsot ad | 4x5=20 | strukturált promptok, output ellenőrzések, verziózás, szülőbarát nyelvezet | 2x5=10 | Klinikai QA és mintavételes emberi review nyitott |
| Érzékeny adat jut hirdetési/analitikai platformra | 4x5=20 | alapértelmezett consent denied, payload minimalizálás, advertising tiltása | 1x5=5 | Adatvédelem/biztonság; éles network inspection szükséges |
| Hozzájárulás érvénytelen, összekapcsolt vagy nyelvileg hibás | 4x5=20 | kétlépcsős verziózott flow, kifejezett 9. cikk szerinti hozzájárulás, külön analitika | 2x5=10 | Adatvédelmi jogász és anyanyelvi jogi review nyitott |
| Gyermek szükségtelen név/becenév alapján azonosítható | 3x4=12 | felnőttnév mező, nincs gyermeknév mező, minimalizálási szöveg | 1x4=4 | Termék; free-text tartalom monitorozása |
| Érzékeny adat a szükségesnél tovább marad meg | 4x5=20 | retention timestamp, lifecycle cron, erasure service | 2x5=10 | Üzemeltetés; backup törlés és cron bizonyíték nyitott |
| Törlés jogszabály szerint megőrzendő számlát töröl vagy érzékeny adatot hagy meg | 3x4=12 | elkülönített pénzügyi megőrzés, érzékeny pszeudonimizálás | 1x4=4 | Adatvédelmi/számviteli jogász validálja a nemzeti időket |
| Joggyakorlási kérelem illetéktelen személynek kerül kiadásra | 3x5=15 | nagy entrópiájú session token, emailben küldött egyszer használatos kód, SHA-256 kódhash, 15 perces lejárat, öt próbálkozásos zárolás, request rate limit, nincs email-only instant export | 1x5=5 | Adatvédelem; független visszaélési teszt és manuális fallback eljárás nyitott |
| Korlátozás/visszavonás ellenére worker vagy email pipeline feldolgoz | 3x5=15 | központi governance kapuk és query filterek feldolgozás/küldés előtt | 1x5=5 | Engineering; visszatérő integrációs bizonyíték szükséges |
| Határokon átnyúló továbbítás érvényes garancia nélkül | 4x5=20 | teljes kontroll csak szerződések, régiók és TIA ellenőrzése után | 3x5=15 | Adatkezelő/adatvédelmi jogász - **nyitott magas maradék kockázat** |
| Adatfeldolgozó modelltréningre vagy inkompatibilis célra használ adatot | 3x5=15 | tervezett API/business feltételek és minimalizált payload | 2x5=10 | Vendor owner; account setting és DPA bizonyíték nyitott |
| Nyelvi hibák félrevezető hozzájárulást vagy riportot eredményeznek | 4x4=16 | 11 nyelvű assetek, fallback ellenőrzések, nyelvi auditok | 2x4=8 | Anyanyelvi jogi/klinikai review nyelvenként nyitott |
| Szolgáltatáskiesés/fizetési versenyhelyzet elveszíti a fizetett riportot | 4x3=12 | idempotens webhook, queue, worker, retry, recovery monitoring | 2x3=6 | Üzemeltetés; éles terhelési/DR bizonyíték szükséges |
| Incidens későn kerül felismerésre vagy bejelentésre | 3x5=15 | logolás, riasztások, breach runbook | 2x5=10 | Adatkezelő/biztonság; tabletop gyakorlat és kontaktok nyitott |
| A termék orvostechnikai szabályozás alá esik a pozicionálás ellenére | 3x5=15 | tájékoztató scope, nincs diagnózis/kezelési döntés, disclaimerek | 2x5=10 | Képzett MDR jogi értékelés nyitott |
| Iskola/biztosító/munkáltató következményes döntésre használja a riportot | 3x5=15 | fogyasztói feltételek és nem diagnosztikus korlátok | 2x5=10 | Termék/jog; intézményi döntési cél tiltása és panaszmonitorozás |

## 11. Biztonsági és szervezési intézkedések

A jelenleg implementált kontrollok közé tartozik a TLS transport, környezeti változókban kezelt és éles környezetben erősségre ellenőrzött titkok, hash-elt access/rights/verification tokenek, rövid élettartamú egyszer használatos megerősítő kódok, paraméterezett SQL, Stripe-aláírás-ellenőrzés, idempotens webhook-kezelés, lease/heartbeat/retry mechanizmusú queue worker, időkorlátos és user agenthez kötött admin session, éles környezetben fail-closed rate limiting, audit események, CORS allow-list, feldolgozási korlátozás, érzékeny törlés, lifecycle jobok, launch evidence gate és minimalizált marketing payload. A vásárlási nyilatkozatok és a 9. cikk szerinti hozzájárulás külön bizonyítékként tárolódnak.

Jóváhagyás előtt bizonyíték szükséges a nyugalmi titkosításról, secret rotationről, least-privilege éles hozzáférésről, MFA-ról, dependency/security scanekről, backup visszaállításról és törlésről, penetrációs tesztről, log redactionről, incidensriasztásról, disaster recoveryről, vendor hozzáférésekről és web/worker/adatbázis feladatkörök szétválasztásáról.

## 12. Személyesadat-incidens kezelése

Az adatkezelőnek az incidenskezelési runbookot kell használnia a containmenthez, bizonyítékmegőrzéshez, bizalmassági/integritási/rendelkezésre állási hatások értékeléséhez, érintett személyek és adatok azonosításához, valamint a bejelentési döntéshez. A GDPR szerinti felügyeleti hatósági bejelentés indokolatlan késedelem nélkül, lehetőség szerint a tudomásszerzéstől számított 72 órán belül szükséges, ha az incidens valószínűsíthetően kockázattal jár. Magas kockázat esetén az érintetteket indokolatlan késedelem nélkül tájékoztatni kell, kivéve ha dokumentált kivétel alkalmazható. Az adatfeldolgozói szerződéseknek elég gyors értesítést kell lehetővé tenniük.

## 13. Fogyasztóvédelmi és digitális tartalmi kötelezettségek

A checkoutnak fizetés előtt világosan meg kell jelenítenie a kereskedő azonosítóját, teljes árat, pénznemet, csomagtartalmat, kézbesítési módot, panasz/támogatási útvonalat és a digitális teljesítés feltételeit. A rendelés gombnak egyértelműen jeleznie kell a fizetési kötelezettséget. Ha az azonnali digitális teljesítés hatással van az elállási jogra, a felnőttnek kifejezetten kérnie kell az azonnali teljesítést és el kell ismernie ennek következményét; az adatkezelőnek tartós adathordozón szerződés-visszaigazolást kell adnia. A digitális tartalomra vonatkozó kötelező megfelelőségi/jogorvoslati jogok UI-szöveggel nem mondhatók le.

A pontos nemzeti implementáció, ÁFA/számlanyelv és elállási kivételek minden célpiacra jogi review-t igényelnek.

## 14. Konzultáció

Jóváhagyás előtt szükséges konzultáció:

- képzett EU adatvédelmi jogász/DPO;
- biztonsági felelős és független penetrációs tesztelő;
- képzett gyermekfejlődési/pszichológiai reviewer;
- anyanyelvi jogi és tartalmi reviewerek minden kínált nyelvre;
- számviteli/adótanácsadó a számlamegőrzéshez;
- lehetőség szerint reprezentatív felnőtt felhasználók, valódi gyermekadatok feltárása nélkül.

Ha a végleges DPIA továbbra is olyan magas kockázatot azonosít, amelyet az adatkezelő nem tud mérsékelni, jogi tanácsot kell kérni arról, szükséges-e a GDPR 36. cikk szerinti előzetes konzultáció az illetékes felügyeleti hatósággal.

## 15. Maradék kockázati döntés

**Jelenlegi döntés: A DPIA NEM JELÖLHETŐ JÓVÁHAGYOTTKÉNT.** A maradék kockázat magas, mert az adatfeldolgozói/adattovábbítási bizonyítékok, adatkezelői azonosítás, DPO-döntés, külső jogi review, klinikai/tartalmi validáció, célországi szabályok, éles biztonsági bizonyítékok és orvostechnikai besorolás még nincsenek lezárva.

A mérnöki kontrollok érdemben csökkentik a kockázatot, de nem zárják le ezeket az irányítási elemeket. A `DPIA_APPROVED` és kapcsolódó launch-gate változóknak false állapotban kell maradniuk, amíg a megnevezett jóváhagyók bizonyítékhivatkozásokkal alá nem írják a `LEGAL_RELEASE_SIGNOFF.md` dokumentumot.

## 16. Felülvizsgálati események

Legalább évente, valamint azonnal felül kell vizsgálni, ha az alábbiak bármelyike változik:

- célok, célfelhasználók, célországok vagy hirdetési stratégia;
- kérdőívterületek, klinikai állítások vagy scoring küszöbök;
- AI modell, prompt, adatfelhasználás, adatfeldolgozó vagy régió;
- megőrzési idő, új adatkategória vagy új integráció;
- iskolák, klinikusok, biztosítók, munkáltatók vagy közfeladatot ellátó szervek általi használat;
- jelentős incidens, panasz, érintetti jogi trend vagy modellbiztonsági probléma;
- bizonyíték arra, hogy a riport következményes döntéseket befolyásol;
- gyermekeket, AI-t, egészségügyi adatot, digitális tartalmat vagy orvostechnikai eszközt érintő jogi/szabályozói iránymutatás.

## 17. Jóváhagyási nyilvántartás

| Jóváhagyás | Név | Dátum | Döntés | Bizonyíték / feltétel |
| --- | --- | --- | --- | --- |
| Adatkezelő |  |  | Nyitott |  |
| Adatvédelmi jogász / DPO |  |  | Nyitott |  |
| Biztonsági felelős |  |  | Nyitott |  |
| Klinikai/tartalmi reviewer |  |  | Nyitott |  |
| Termékfelelős |  |  | Nyitott |  |

Üres sor nem minősül jóváhagyásnak.

### 17.1 A bizonyítékok és a független validáció határa

A kódbázis, az automatikus ellenőrzések, a migrációs előzmények és a generált bizonyítékjegyzékek igazolhatják, hogy egy kontroll a leírt módon implementálva van. Nem tanúsíthatják függetlenül a jogi megfelelést, a klinikai érvényességet, az akadálymentességet, az éles szolgáltatói fiókbeállításokat, a szerződéses lefedettséget vagy a külső támadóval szembeni ellenállást. Ezek addig nyitott tételek, amíg az `INDEPENDENT_VALIDATION_PLAN.md` szerinti illetékes független reviewer aláírt bizonyítéka nem kerül a `LEGAL_REMEDIATION_AND_VALIDATION_REGISTER.md` nyilvántartásba. A jogi szövegek anyanyelvi ellenőrzését a `LEGAL_TRANSLATION_VALIDATION_REGISTER.md`, az érintetti kérelmek azonosítási és működési folyamatát pedig a `DATA_SUBJECT_RIGHTS_RUNBOOK.md` követi.

Pusztán e munkapéldány vagy az automatikus audit sikeressége alapján nem jeleníthető meg „GDPR-megfelelő”, „klinikailag validált”, „orvosilag jóváhagyott”, „biztonságos/tanúsított” vagy ezekkel egyenértékű nyilvános jelvény vagy állítás.

## 18. Melléklet A - Szolgáltatói átvilágítási és bizonyítékjegyzék

**Vizsgálat dátuma:** 2026-07-26
**Bizonyítéki státusz:** nyilvános szolgáltatói dokumentumokból készített mérnöki és adatvédelmi munkapapír; nem szerződéses jóváhagyás és nem jogi tanúsítás.

A vizsgálat a tényleges kódbeli adatáramlást vetette össze a szolgáltatók hivatalos DPA-, adatkezelési, biztonsági, al-adatfeldolgozói, transzfer- és termékdokumentumaival. A nyilvános ígéret csak azt igazolja, hogy a szolgáltató mit tesz közzé. Nem igazolja, hogy a NeuroMap Kids megfelelő jogi személlyel szerződött, elfogadta a DPA-t, a vizsgált régiót és megőrzést használja, vagy a szolgáltató kifejezetten engedélyezi a gyermekhez köthető egészségi jellegű következtetések szándékos beküldését.

### 18.1 Összefoglaló döntési mátrix

| Szolgáltató | Tényleges adatkitettség | Nyilvános bizonyíték alapján megállapítható | DPIA-döntés / nyitott feltétel |
| --- | --- | --- | --- |
| Railway | teljes session, felnőtt kapcsolati adat, kérdőívválaszok, gyermekhez kapcsolódó megfigyelések és következtetések, riport, hozzájárulás, napló | DPA, SCC/UK transzfermechanizmusok és részletes biztonsági kontrollok elérhetők | **Indítási akadály:** a standard adatkezelési melléklet szerint nincs szándékolt érzékeny/különleges adat; írásos eltérés vagy új architektúra kell |
| OpenAI API | kérdések/válaszok, fókuszok, pontozás, profil, korosztályi kontextus és riportutasítás | API-adat alapértelmezetten nem tréningadat; DPA, SCC, al-adatfeldolgozók és adatkontrollok dokumentáltak | **Indítási akadály:** a standard DPA-adatleírás nincs összhangban a szándékos egészségi jellegű adattal; retention/régió/fiók bizonyíték hiányzik |
| Resend | felnőtt email, lokalizált levél, gyermekhez kapcsolódó következtetéseket tartalmazó PDF, delivery metaadat | DPA, SCC, biztonsági és al-adatfeldolgozói anyagok elérhetők | **Magas kockázatú rés:** érzékeny PDF-melléklet szerződéses alkalmasságát írásban igazolni kell, vagy biztonságos letöltési linkre kell váltani |
| Stripe | felnőtt email/számlázási/fizetési adat, csomag, összeg, pénznem, nyelv, belső referencia | DPA, szerepkör- és transfermagyarázat, al-adatfeldolgozói kontrollok elérhetők | Feltételesen elfogadható; kérdőív- vagy riporteremény nem kerülhet Stripe-hoz; fiókbizonyíték kell |
| Számlázz.hu | felnőtt számlázási adatok, összeg/pénznem, termékleírás és tranzakciós referenciák | adatvédelmi tájékoztató, ÁSZF és Számla Agent dokumentáció elérhető | Feltételesen elfogadható; pontos szerepkör, szerződés, retention és payload bizonyítandó |
| Webflow | szándék szerint csak frontend-oldalkérés, consent és nem érzékeny telemetry; a kérdőív közvetlenül Railway felé megy | DPA, privacy FAQ, security és al-adatfeldolgozói lista elérhető | Feltételesen elfogadható; network capture-rel és beállításexporttal bizonyítani kell, hogy Forms/Analytics/embed nem kap érzékeny payloadot |

### 18.2 Railway

**Hivatalos forrás:** https://railway.com/legal/dpa

A nyilvános DPA adatfeldolgozói kötelezettségeket, al-adatfeldolgozói értesítést, SCC/UK transzfergaranciákat és technikai-szervezési intézkedéseket ír le. A biztonsági melléklet logikai elkülönítést, átvitel és tárolás közbeni titkosítást, hozzáférés-kezelést, naplózást, incidenskezelést, üzletmenet-folytonosságot és backup kontrollokat ismertet. Ugyanakkor a standard adatleírás szerint érzékeny vagy különleges kategóriájú adat szándékos kezelése nincs megjelölve.

Ez lényeges eltérés, mert a Railway a teljes adatbázist és feldolgozási láncot futtatja. A DPIA nem hagyható jóvá addig, amíg nincs végrehajtott DPA és írásos szolgáltatói/szerződéses megerősítés a tényleges adatkategóriákra és érintettekre, vagy az érzékeny adat nincs megfelelően jóváhagyott infrastruktúrára áthelyezve.

### 18.3 OpenAI API

**Hivatalos források:**

- DPA: https://cdn.openai.com/pdf/openai-data-processing-addendum.pdf
- API-adatkontrollok: https://developers.openai.com/api/docs/guides/your-data
- al-adatfeldolgozók: https://openai.com/policies/sub-processor-list/
- biztonsági bizonyítékok: https://trust.openai.com/

Az OpenAI DPA 28. cikk szerinti adatfeldolgozói kötelezettségeket, titoktartást, érintetti jogi támogatást, biztonságot, incidensértesítést, auditot, al-adatfeldolgozókat és SCC/UK mechanizmusokat rögzít. Az API-adatkezelési útmutató szerint az API-adatok alapértelmezetten nem használatosak modelltréningre, kivéve opt-in esetén. A dokumentáció ugyanakkor külön kezeli az abuse-monitoring megőrzést, az endpoint alkalmazásállapotát, a `store: false`, a Zero Data Retention és a regionális lehetőségeket.

A no-training állítás nem jelent automatikusan nulla megőrzést és nem bizonyítja a konkrét projekt beállítását. A production prompt gyermekhez kapcsolódó, potenciálisan 9. cikk szerinti adatot tartalmaz. A standard DPA-adatleírás és ez a szándékolt felhasználás közötti eltérést írásban/szerződésben kell rendezni, és csatolni kell a konkrét projekt regionális, retention, data-sharing/training és `store` bizonyítékát.

### 18.4 Resend

**Hivatalos források:**

- DPA: https://resend.com/legal/dpa
- al-adatfeldolgozók: https://resend.com/legal/subprocessors
- biztonsági dokumentáció: https://resend.com/docs/security
- szolgáltató által aláírt DPA-minta: https://resend.com/static/documents/resend-dpa-signed.pdf

A Resend DPA adatfeldolgozói kötelezettségeket, SCC-ket, al-adatfeldolgozókat és technikai-szervezési kontrollokat ír le. A security anyag hozzáférés-kezelést, titkosítást, naplózást, incidenskezelést, penetrációs tesztet, törlést/exportot és üzletmenet-folytonosságot ismertet.

A NeuroMap azonban nem csak tranzakciós email-címet, hanem érzékeny tartalmú PDF-et is küld. Az elfogadott DPA és a PDF-melléklet ilyen célú alkalmassága fiók- és szerződésszintű tény. Téves címzett esetén a melléklet tartósan kikerül az adatkezelő kontrollja alól. Írásos alkalmassági megerősítés nélkül a preferált kockázatcsökkentés rövid élettartamú, hitelesített letöltési link.

### 18.5 Stripe

**Hivatalos források:**

- DPA: https://stripe.com/legal/dpa
- DPA FAQ: https://stripe.com/legal/dpa/faqs
- al-adatfeldolgozói kontroll: https://support.stripe.com/questions/stripe-s-subprocessors-and-vetting-process
- Services Agreement összefoglaló: https://stripe.com/legal/ssa-overview

A Stripe dokumentumai a szolgáltatásonként változó adatkezelői/adatfeldolgozói szerepet, transzfermechanizmusokat, al-adatfeldolgozókat és biztonsági kötelezettségeket ismertetik. A tervezett payload arányos, mert nem tartalmaz kérdőívválaszt vagy következtetett fókuszt. Ezt metadata-allow-listtel és production webhook/payload mintával kell bizonyítani. A fiókhoz elfogadott DPA, szerződő entitás, MFA, least privilege, restricted key és webhook signing-secret rotáció bizonyítéka szükséges.

### 18.6 Számlázz.hu / KBOSS.hu Kft.

**Hivatalos források:**

- adatvédelmi tájékoztató: https://www.szamlazz.hu/adatvedelem/
- ÁSZF: https://www.szamlazz.hu/aszf/
- Számla Agent: https://docs.szamlazz.hu/third-party-invoicing/szamla-agent

A nyilvános anyagok azonosítják a szolgáltatót, a lehetséges adatkezelői/adatfeldolgozói szerepeket, a számlázási adatkategóriákat, infrastruktúrát és megőrzési szempontokat. A konkrét szerepkör a szerződés és művelet függvénye. A számlaadat-megőrzést el kell választani a rövidebb kérdőív/riport-retentiontől. A Számla Agent kulcs hozzáférését/rotációját, a tényleges mezőket, az elfogadott feltételeket és a jogszabályi megőrzést fiókszinten kell bizonyítani.

### 18.7 Webflow

**Hivatalos források:**

- DPA: https://webflow.com/legal/dpa
- privacy FAQ: https://webflow.com/legal/privacy-faqs
- al-adatfeldolgozók: https://webflow.com/legal/subprocessors
- security: https://webflow.com/security

A Webflow dokumentumai adatfeldolgozói/adatkezelői szerepeket, transzfereket, amerikai feldolgozást, titkosítást és biztonsági kontrollokat ismertetnek. A production adatvédelmi határ azonban konfigurációfüggő. Dátumozott hálózati felvétellel, Forms/CMS/Analytics/session-replay állapottal, custom-code leltárral és cookie/storage vizsgálattal kell igazolni, hogy a kérdőív, fókusz, riport és felnőtt email közvetlenül csak a Railway API felé megy.

## 19. Melléklet B - Fiók- és szerződésszintű bizonyítékcsomag

A következő lista minden core szolgáltatónál kötelező. A bizonyítékot nem a DPIA-ba beágyazott titokként, hanem kontrollált tárban, hivatkozási azonosítóval kell megőrizni.

| Bizonyíték | Tartalom | Elfogadási feltétel |
| --- | --- | --- |
| Szerződés/DPA | elfogadott vagy aláírt példány, dátum, jogi entitás, szolgáltatási melléklet | a tényleges érintettek és adatkategóriák szerepelnek; érzékeny adat nem „none” |
| Régió és transzfer | production régió, adatút, SCC modul, UK addendum, TIA | a tényleges fiókhoz és al-adatfeldolgozói lánchoz kötött |
| Fiókbeállítás | MFA, hozzáférési lista, retention, training/data sharing, tracking, region, deletion | dátumozott screenshot vagy export, felelős jóváhagyásával |
| Payload/network | redaktált production minta minden integrációhoz és nyelvi folyamathoz | nincs indokolatlan adat; marketingplatformon nincs érzékeny adat vagy azonosító |
| Megőrzés/törlés | export, törlés, backup, megszüntetés és restore eljárás | teszteredmény és szolgáltatói álláspont csatolva |
| Incidens | kapcsolattartó, értesítési vállalás, belső escalation | tabletop vagy kontaktpróba bizonyítéka |
| Al-adatfeldolgozók | aktuális lista és változásértesítés | feliratkozás, utolsó review és kifogásolási folyamat |
| Alternatíva | szolgáltató elutasítása vagy kiesése esetén architektúra | érzékeny adat továbbítása leállítható üzleti adatvesztés nélkül |

Javasolt azonosítók: `VEN-RAILWAY-*`, `VEN-OPENAI-*`, `VEN-RESEND-*`, `VEN-STRIPE-*`, `VEN-SZAMLAZZHU-*`, `VEN-WEBFLOW-*`, `MKT-GOOGLE-*`, `MKT-META-*`, `MKT-TIKTOK-*`.

**Kötelező indítási kapu:** Railway és OpenAI adatkategória/szerződéses eltérése, valamint a Resend érzékeny PDF-alkalmassága lezáratlan állapotban a DPIA nem írható alá jóváhagyottként.

## 20. Melléklet C - Marketingplatformok elkülönítése és tiltott payloadok

### 20.1 Google Analytics / Google tag

**Hivatalos források:**

- adatfeldolgozási feltételek elfogadása: https://support.google.com/analytics/answer/3379636?hl=en
- Analytics adatvédelem és ügyfélkontrollok: https://support.google.com/analytics/answer/6004245?hl=en
- PII és érzékeny adat tiltása: https://support.google.com/analytics/answer/13297105?hl=en
- regionális adatgyűjtés: https://support.google.com/analytics/answer/12017362?hl=en
- Google-termékekkel való adatmegosztás: https://support.google.com/analytics/answer/9012600?hl=en
- EU user-consent policy: https://www.google.com/about/company/user-consent-policy/

A Google Analytics szabályai tiltják a felismerhető PII és az érzékeny információt feltáró/azonosító adat átadását. A NeuroMap számára csak előzetes hozzájáruláson alapuló, durva landing-page mérés tervezhető. Hozzájárulás sem teszi megengedhetővé a gyermekre vagy egészségi jellegre utaló payloadot.

Tiltott: email, gyermekadat, korosztályi részlet, válasz, bank/fókusz, másodlagos fókusz, severity, riport, session/access token, számla-/fizetési referencia, érzékeny URL vagy query paraméter. A kérdőív-, összegzés-, checkout-success-, riport- és megfigyelési oldalakon tag nem tölthető be, amíg külön jogi/policy review és network capture ezt nem engedélyezi.

### 20.2 Meta Business Tools

**Hivatalos források:**

- adatfeldolgozási feltételek: https://www.facebook.com/legal/terms/dataprocessing
- Business Tools feltételek: https://www.facebook.com/legal/terms/businesstools/preview

A Meta Business Tools feltételei tiltják a 13 év alatti gyermekhez kapcsolódó, egészségügyi és más érzékeny adatok beküldését. A production szerveroldali Meta-eseményküldés jelenleg szándékosan letiltott. Pixel/CAPI nem jelenhet meg a kérdőív-, összegzés-, success/report- és megfigyelési oldalakon. A landing-only mérés is külön DPIA-változásértékelést, consent/policy review-t és hálózati bizonyítékot igényel.

### 20.3 TikTok advertiser tools

**Hivatalos források:**

- Business Products adatfeltételek: https://ads.tiktok.com/i18n/official/policy/controller-to-controller%2Fprivacy
- advertiser tools feltételek: https://ads.tiktok.com/help/article/tiktok-advertiser-tools-and-related-terms?lang=en
- tiltott adatmegosztás: https://ads.tiktok.com/help/article/about-notifications-of-potentially-prohibited-data-sharing-on-tiktok?lang=en

A TikTok iránymutatása tiltja a gyermekekre, egészségre, pénzügyekre és más érzékeny kategóriára vonatkozó adatok megosztását, és érzékeny oldalakon külön kockázatként kezeli a pixelt/Events API-t. A vizsgált production flow-ban nincs TikTok-integráció. Új pixel, Events API, SDK, enhanced matching vagy kampány-URL paraméter anyagi adatkezelési változás; jóváhagyott DPIA-módosítás előtt nem telepíthető.

### 20.4 Kötelező technikai korlát

A marketing eseménysémának allow-list alapúnak kell lennie, alapértelmezett consent `denied` állapottal. A tiltást automatizált build/smoke ellenőrzés, böngészőhálózati vizsgálat és GTM/Webflow custom-code leltár igazolja. A marketinges teljesítménymérés nem kapcsolható össze kérdőív-, riport-, email-, fizetési vagy stabil session-azonosítóval.
