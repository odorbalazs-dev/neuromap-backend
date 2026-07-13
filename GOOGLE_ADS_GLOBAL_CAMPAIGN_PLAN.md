# NeuroMap Kids - globális Google kampányterv

Ez a terv a NeuroMap Kids kérdőív Google Ads értékesítéséhez készült. A cél az, hogy a kampány minden jelenlegi kérdőívnyelven fusson, globális eléréssel, de mérhető, kontrollálható és hirdetési szabályzat szempontból biztonságos struktúrában.

Jelenlegi támogatott nyelvek: `hu`, `en`, `de`, `it`, `es`, `zh`, `ja`, `ar`, `pl`, `pt`, `fr`.

Alap landing URL:
`https://neuromap-kids.webflow.io`

Fióképítési források:

- kampányok, keretek, lokalizált RSA-elemek és kulcsszavak: `campaigns/google-ads/google-ads-search-build.json`
- Google Ads-fiók beállítási sorrendje: `campaigns/google-ads/google-ads-account-setup.md`
- automatikus kampányspecifikáció-ellenőrzés: `npm run audit:google-ads`

## Aktuális üzleti cél és fontos korlát

- Skálázási cél: **napi 150 vásárlás**.
- Termékár: **5 USD**, ezért a cél nem kezelhető egyszerű forgalmi célként.
- Tervezési árfolyam: **360 HUF/USD** (csak modellfeltételezés), így a napi bruttó árbevétel kb. **270 000 Ft**.
- Fenntartható cél-CPA: kezdetben legfeljebb **800-1 200 Ft/vásárlás**.
- 150 vásárláshoz ezen a CPA-sávon kb. **120 000-180 000 Ft napi hirdetési költés** szükséges.
- A napi 150 vásárlás ezért skálázási mérföldkő, nem induló kampánybeállítás.

### Google 120 000 Ft-os promóció

A promóció csak akkor építhető be, ha az adott Google Ads-fiókban a `Számlázás > Promóciók` oldalon ténylegesen megjelenik, és a fiók megfelel a feltételeknek. A jóváírás nem készpénz, jellemzően a megadott időablakon belüli jogosító költés után jelenik meg, és későbbi hirdetési költésre használható fel.

Javasolt felhasználás:

1. A fiókban látható pontos költési küszöb és határidő rögzítése.
2. 14 napos, napi 10 000 Ft-os HU/EN/DE Search pilot.
3. A promóciót nem szabad veszteséges forgalommal "kihajszolni".
4. A jóváírást a pilot nyertes piacainak bővítésére, majd FR/ES/PL kontrollált tesztjére használjuk.

## 1. Stratégiai pozicionálás

A kampány fő üzenete ne az legyen, hogy a rendszer diagnózist, ADHD/autizmus/szorongás azonosítást vagy terápiás választ ad. A biztonságosabb és bizalomépítőbb pozíció:

**Rövid, szülőbarát kérdőív, amely segít érthetőbben látni a gyermek viselkedési, érzelmi és tanulási mintázatait.**

Kiemelt ígéretek:

- kb. 10 perces kitöltés
- szülőbarát, megnyugtató nyelvezet
- strukturált PDF riport emailben
- nem diagnózis, hanem előszűrési és tájékozódási segítség
- gyakorlati következő lépések szülőknek
- többnyelvű elérhetőség

Kerülendő állítások:

- "Tudd meg, ADHD-s-e a gyermeked."
- "Diagnosztizáld otthon."
- "Terápia helyett."
- "Biztos válasz 10 perc alatt."
- "Autizmus teszt gyerekeknek" direkt, diagnosztikus ígérettel.

Használható állítások:

- "Érthetőbb kép gyermeked viselkedéséről."
- "Rövid kérdőív szülőknek."
- "Szülőbarát PDF riport."
- "Segít rendszerezni, mire érdemes figyelni."
- "Nem diagnózis, hanem strukturált előszűrés."

## 2. Google Ads policy keretek

A kampány érzékeny területet érint, mert gyermekekkel, mentális/viselkedési mintázatokkal és egészséghez közeli témákkal kapcsolatos. Emiatt a kampányt úgy kell felépíteni, hogy ne célozzon gyermekeket, ne használjon érzékeny egészségügyi személyre szabást, és ne állítsa, hogy a felhasználó vagy gyermeke konkrét állapottal rendelkezik.

Kötelező alapelvek:

- Csak felnőtteknek/szülőknek szóljon.
- A hirdetés ne sugallja, hogy "a te gyermeked ADHD-s/autista/szorongó".
- Ne használjunk sérülékenységet kihasználó vagy ijesztgető szöveget.
- Ne legyen diagnózis, kezelés, gyógyszer vagy orvosi döntés ígérete.
- Remarketingnél különösen óvatosan kell eljárni: ne épüljön érzékeny állapotra vagy egészségügyi érdeklődésre.
- A landing oldalon látható legyen: "nem diagnózis", adatkezelés, kapcsolat, ár, mit kap a vásárló.

## 3. Kampányarchitektúra

Ne egyetlen globális kampány fusson minden nyelvre. A javasolt felépítés:

1. Search kampányok nyelvi klaszterenként
2. Performance Max csak akkor, ha már van stabil konverziós adat
3. YouTube/Demand Gen awareness kampányok a fő piacokon
4. Brand kampány külön
5. Remarketing csak szabályzatbarát, általános üzenettel

### Nyelvi/piaci kampánycsoportok

| Kód | Kampánycsoport | Elsődleges piacok | Megjegyzés |
| --- | --- | --- | --- |
| HU | Magyar | Magyarország, magyar diaszpóra | Alacsonyabb CPC, jó validációs piac |
| EN | English Global | US, UK, CA, AU, IE, NZ, SG, EU angol keresések | Legnagyobb skála, legerősebb verseny |
| DE | German/DACH | Németország, Ausztria, Svájc | Magas vásárlóerő, magas bizalmi igény |
| FR | French | Franciaország, Belgium, Svájc, Kanada francia | Jó edukációs üzenetekkel |
| ES | Spanish | Spanyolország, LATAM spanyol piacok | Árérzékenység országonként eltér |
| IT | Italian | Olaszország | Szülői edukációs szög |
| PT | Portuguese | Portugália, Brazília | Külön kreatív teszt javasolt BR/PT |
| PL | Polish | Lengyelország | Jó közép-európai skálázási piac |
| JA | Japanese | Japán | Bizalom, minőség, diszkréció fontos |
| ZH | Chinese | Hong Kong, Taiwan, Singapore, kínai diaszpóra | Mainland China Google elérés korlátozott |
| AR | Arabic | GCC, Egyesült Arab Emírségek, Szaúd-Arábia, arab diaszpóra | RTL landing és kulturális finomhangolás kell |

## 4. Final URL és UTM rendszer

Ideális final URL nyelvi paraméterrel:

```text
https://neuromap-kids.webflow.io/?lang={lang}
```

Google Ads `Final URL suffix`:

```text
utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={adgroupid}-{creative}&utm_term={keyword}&device={device}&network={network}
```

Az automatikus címkézést (`gclid`, illetve ahol alkalmazható `gbraid`/`wbraid`) bekapcsolva kell hagyni.

Példák:

```text
https://neuromap-kids.webflow.io/?lang=hu&utm_source=google&utm_medium=cpc&utm_campaign=nm_hu_core_search_parent&utm_content=behavior_patterns
https://neuromap-kids.webflow.io/?lang=en&utm_source=google&utm_medium=cpc&utm_campaign=nm_en_global_search_parent&utm_content=child_behavior_questionnaire
https://neuromap-kids.webflow.io/?lang=de&utm_source=google&utm_medium=cpc&utm_campaign=nm_de_dach_search_parent&utm_content=verhalten_fragebogen
```

Fontos fejlesztési feltétel:

- A Webflow engine olvassa a `?lang=` paramétert.
- Ha van `?lang=ja`, akkor a landing, kérdőív, checkout success/cancel és riport nyelvi logikája is ugyanarra a nyelvre álljon.
- Ha nincs nyelvi paraméter, maradjon böngészőnyelv vagy korábbi `localStorage` fallback.

## 5. Konverziós mérési terv

Elsődleges konverzió:

- `purchase`
- érték: `5 USD`
- forrás: Stripe sikeres fizetés / success oldal / backend validáció

Mikrokonverziók:

- `nm_landing_view`
- `nm_questionnaire_started`
- `nm_triage_completed`
- `nm_specific_completed`
- `nm_checkout_started`
- `checkout_cancelled`
- `report_email_sent`

Google Ads optimalizálásnál:

- induláskor `nm_checkout_started` és `purchase` is legyen mérve
- licitoptimalizálás végül csak `purchase` alapján történjen
- mikrokonverziók legyenek megfigyelési célok, ne elsődleges vásárlási célok

## 6. Kampánytípusok

### A. Search - magas szándékú keresések

Ez legyen az elsődleges induló kampánytípus. A cél olyan szülők elérése, akik már keresnek gyerekviselkedés, figyelem, szorongás, tanulási nehézség vagy szülői kérdőív témában.

Javasolt kampányok:

- `NM_HU_Search_ParentIntent`
- `NM_EN_Search_ParentIntent`
- `NM_DE_Search_ParentIntent`
- `NM_FR_Search_ParentIntent`
- stb. nyelvenként

### B. Brand Search

Külön kampány:

- `NeuroMap Kids`
- `Neuromap`
- `neuromapkids`
- `NeuroMap report`

Cél: ha Meta/TikTok/YouTube után rákeresnek, ne vesszen el a forgalom.

### C. Performance Max

Csak akkor javasolt, ha már legalább 50-100 vásárlás van több piacon.

Indok:

- A termék érzékeny témájú.
- A PMax szélesebben terít, ezért kontroll nélkül hamar hozhat rossz minőségű forgalmat.
- Először Search validálja a legjobb üzeneteket.

### D. YouTube / Demand Gen

Awareness és edukáció:

- rövid, megnyugtató szülői jelenetek
- reggeli rutin
- óvoda/iskola előtti bizonytalanság
- este, amikor a szülő próbálja megérteni a napot
- nem ijesztgető, nem diagnosztikus, hanem "rendszerező segítség"

CTA:

- "Töltsd ki a rövid kérdőívet"
- "Nézd meg, milyen mintázatok rajzolódnak ki"
- "Kapj szülőbarát PDF riportot"

## 7. Ad group struktúra

Nyelvenként ugyanaz a logikai struktúra:

1. Child behavior questionnaire
2. Attention and impulse patterns
3. Social communication patterns
4. Anxiety and avoidance patterns
5. Learning difficulty patterns
6. Parent report / PDF report
7. Morning routine / everyday situations

Fontos: a hirdetésben ne "diagnosztikai címkét" adjunk el, hanem "értelmezhető mintázatot és következő lépést".

## 8. Kulcsszó-stratégia

### Magyar példa kulcsszavak

- gyerek viselkedés kérdőív
- gyermek viselkedési minták
- szülői kérdőív gyerekeknek
- gyerek figyelem nehézség
- gyerek szorongás jelei
- tanulási nehézség gyereknél
- óvodai viselkedési problémák
- iskolai figyelmi nehézség
- szülőbarát riport gyerekről

### Angol példa kulcsszavak

- child behavior questionnaire
- child behavior report
- parent questionnaire child behavior
- child attention difficulties checklist
- child anxiety signs parent guide
- learning difficulties child checklist
- autism signs child parent checklist
- ADHD signs child parent guide
- child emotional behavior questionnaire

### Német példa kulcsszavak

- kinder verhalten fragebogen
- verhaltensmuster kind
- fragebogen kind verhalten eltern
- konzentrationsprobleme kind
- kind angst anzeichen
- lernschwierigkeiten kind
- eltern report kind verhalten

### Francia példa kulcsszavak

- questionnaire comportement enfant
- rapport comportement enfant
- questionnaire parents enfant
- difficultés attention enfant
- signes anxiété enfant
- difficultés apprentissage enfant

### Spanyol példa kulcsszavak

- cuestionario comportamiento infantil
- informe comportamiento niño
- cuestionario para padres
- dificultades de atención en niños
- ansiedad infantil señales
- dificultades de aprendizaje niños

### Olasz példa kulcsszavak

- questionario comportamento bambino
- report comportamento bambino
- questionario genitori bambino
- difficoltà attenzione bambini
- ansia bambini segnali
- difficoltà apprendimento bambini

### Portugál példa kulcsszavak

- questionário comportamento infantil
- relatório comportamento criança
- questionário para pais
- dificuldades de atenção criança
- sinais de ansiedade infantil
- dificuldades de aprendizagem criança

### Lengyel példa kulcsszavak

- kwestionariusz zachowania dziecka
- raport zachowania dziecka
- kwestionariusz dla rodziców
- trudności z koncentracją dziecko
- objawy lęku u dziecka
- trudności w nauce dziecko

### Japán példa kulcsszavak

- 子ども 行動 質問票
- 子ども 行動 パターン
- 保護者向け 質問票
- 子ども 注意 困難
- 子ども 不安 サイン
- 学習 困難 子ども

### Kínai példa kulcsszavak

- 儿童行为问卷
- 孩子行为报告
- 家长问卷儿童行为
- 儿童注意力困难
- 儿童焦虑迹象
- 儿童学习困难

### Arab példa kulcsszavak

- استبيان سلوك الطفل
- تقرير سلوك الطفل
- استبيان للوالدين
- صعوبات الانتباه عند الأطفال
- علامات القلق عند الطفل
- صعوبات التعلم عند الأطفال

## 9. Kizáró kulcsszavak

Minden nyelven legyen negatív kulcsszólista. Magyar/angol induló lista:

- ingyenes
- free
- pdf free
- letöltés ingyen
- diagnosis
- diagnose
- diagnózis
- gyógyszer
- medication
- medicine
- treatment
- therapy near me
- emergency
- crisis
- suicide
- felnőtt
- adult
- university
- job
- iq test
- eq test
- DSM
- ICD
- official diagnosis
- clinical assessment
- psychiatrist
- pszichiáter
- pszichológus időpont

Megjegyzés: nem minden ilyen keresés rossz üzletileg, de induláskor érdemes szűkíteni, hogy ne diagnózist vagy terápiás szolgáltatást kereső forgalom érkezzen.

## 10. Hirdetésszöveg starter pack

### HU

Headlines:

- Érthetőbb kép gyermeked viselkedéséről
- Rövid kérdőív szülőknek
- Szülőbarát PDF riport
- Nem diagnózis, hanem iránytű
- Viselkedési minták érthetően

Descriptions:

- Tölts ki egy rövid kérdőívet, és kapj szülőbarát riportot a kirajzolódó mintázatokról.
- Segít rendszerezni, mire érdemes figyelni otthon, óvodában vagy iskolában. Nem diagnózis.

### EN

Headlines:

- Understand Your Child's Behavior
- Parent-Friendly PDF Report
- Short Questionnaire for Parents
- Not a Diagnosis, a Clearer Starting Point
- Behavioral Patterns Made Easier

Descriptions:

- Complete a short questionnaire and receive a parent-friendly report about everyday behavior patterns.
- Helps organize what to observe at home or school. Informational screening only, not a diagnosis.

### DE

Headlines:

- Verhalten deines Kindes besser verstehen
- Kurzer Fragebogen für Eltern
- Elternfreundlicher PDF-Bericht
- Keine Diagnose, sondern Orientierung
- Muster im Alltag klarer sehen

Descriptions:

- Beantworte einen kurzen Fragebogen und erhalte einen verständlichen Bericht für Eltern.
- Hilft, Beobachtungen zu Hause, im Kindergarten oder in der Schule zu ordnen. Keine Diagnose.

### IT

Headlines:

- Comprendi meglio il comportamento di tuo figlio
- Questionario breve per genitori
- Report PDF chiaro e rassicurante
- Non è una diagnosi
- Pattern quotidiani più comprensibili

Descriptions:

- Compila un breve questionario e ricevi un report pensato per i genitori.
- Aiuta a organizzare ciò che osservi a casa o a scuola. Solo screening informativo.

### ES

Headlines:

- Comprende mejor la conducta de tu hijo
- Cuestionario breve para padres
- Informe PDF claro y útil
- No es un diagnóstico
- Patrones cotidianos más claros

Descriptions:

- Completa un breve cuestionario y recibe un informe pensado para familias.
- Ayuda a ordenar lo que observas en casa o en la escuela. Solo orientación informativa.

### FR

Headlines:

- Mieux comprendre le comportement de votre enfant
- Questionnaire court pour parents
- Rapport PDF clair et rassurant
- Ce n'est pas un diagnostic
- Des repères plus lisibles

Descriptions:

- Remplissez un court questionnaire et recevez un rapport clair pour les parents.
- Aide à organiser les observations à la maison ou à l'école. Dépistage informatif uniquement.

### PT

Headlines:

- Entenda melhor o comportamento da criança
- Questionário curto para pais
- Relatório PDF simples e claro
- Não é um diagnóstico
- Padrões do dia a dia mais claros

Descriptions:

- Preencha um questionário curto e receba um relatório pensado para pais.
- Ajuda a organizar o que observar em casa ou na escola. Apenas triagem informativa.

### PL

Headlines:

- Lepiej zrozum zachowanie dziecka
- Krótki kwestionariusz dla rodziców
- Przyjazny raport PDF
- To nie jest diagnoza
- Codzienne wzorce w jaśniejszej formie

Descriptions:

- Wypełnij krótki kwestionariusz i otrzymaj raport przyjazny dla rodziców.
- Pomaga uporządkować obserwacje z domu lub szkoły. To tylko informacyjne badanie przesiewowe.

### JA

Headlines:

- お子さまの行動を整理
- 保護者向けの短い質問票
- わかりやすいPDFレポート
- 診断ではなく、整理のために
- 日常の行動パターンを見える化

Descriptions:

- 短い質問票に答えると、保護者向けのわかりやすいPDFレポートを受け取れます。
- 家庭や園・学校で何を見るかを整理するための参考情報です。診断ではありません。

### ZH

Headlines:

- 更好理解孩子的行为
- 给家长的简短问卷
- 清晰易懂的PDF报告
- 不是诊断，而是参考
- 整理日常行为线索

Descriptions:

- 完成简短问卷，获得面向家长的清晰PDF报告。
- 帮助整理家庭或学校中的观察重点。仅供信息参考，不作为诊断。

### AR

Headlines:

- فهم أوضح لسلوك طفلك
- استبيان قصير للوالدين
- تقرير PDF واضح ومطمئن
- ليس تشخيصا بل نقطة بداية
- تنظيم ملاحظات الحياة اليومية

Descriptions:

- أجب عن استبيان قصير واحصل على تقرير واضح موجه للوالدين.
- يساعدك على تنظيم ما تلاحظه في المنزل أو المدرسة. معلومات إرشادية فقط وليست تشخيصا.

## 11. Kreatív irányok Google Display, YouTube és Demand Gen kampányhoz

Javasolt vizuális világ:

- skandináv, világos, tiszta, megnyugtató
- valódi élethelyzetek vagy nagyon finom, nem gyerekes illusztrációk
- ne legyen túl erős szomorú gyermek kép
- ne legyen diagnózisos vagy klinikai hangulat
- a szülő megkönnyebbülése legyen a fő érzelem

Kreatív jelenetek:

1. Reggeli készülődés, amikor a szülő próbálja megérteni, miért nehéz az indulás.
2. Óvoda/iskola után beszélgetés, amikor a szülő rendszerezni szeretné a nap tanulságait.
3. Este laptop/tablet mellett: rövid kérdőív, majd megnyugtató PDF riport.
4. Szülői jegyzetelés: "mire figyeljek holnap?"
5. Nyugodt családi jelenet: nem címkézés, hanem jobb megértés.

Videó hook példák:

- "Néha nem az a legnehezebb, ami történt, hanem megérteni, miért történt."
- "Ha szeretnéd rendszerezni, amit a gyermeked viselkedésében látsz..."
- "Egy rövid kérdőív, ami segít érthetőbb képet kapni."
- "Nem diagnózis. Egy nyugodtabb kiindulópont szülőknek."

## 12. Landing page követelmények Google kampányhoz

A landing legyen minden kampányban ugyanaz a fő oldal, de a nyelvet az URL-paraméter állítsa.

Kötelező elemek:

- látható ár
- mit kap a vásárló
- "nem diagnózis" figyelmeztetés
- adatkezelés
- kapcsolat
- Stripe fizetés biztonsága
- PDF riport emailben
- várható kézbesítési idő
- kérdőív nyelve és riport nyelve egyértelmű legyen
- success/cancel oldal ugyanazon a nyelven jelenjen meg

Konverziót növelő elemek:

- "Miért éri meg most kitölteni?"
- 3 konkrét haszon
- példa riport-részlet vagy riport-előnézet
- rövid, megnyugtató disclaimer
- fizetés előtt összegzés és felső CTA

## 13. Induló költségkeret és kapuk

Minden nyelvi kampány előre elkészül `PAUSED` állapotban. Az első 14 napban csak ezek indulhatnak:

| Kampány | Napi keret | Induló állapot |
| --- | ---: | --- |
| `NM_HU_Search_Core` | 3 000 Ft | pilot |
| `NM_EN_Search_Core_Tier1` | 4 000 Ft | pilot |
| `NM_DE_Search_Core_DACH` | 3 000 Ft | pilot |
| `NM_GLOBAL_Search_Brand` | 500 Ft | pilot |
| Minden további nyelv | 0 Ft költés | előkészítve, szüneteltetve |

Pilot összesen: **10 500 Ft/nap**, 14 nap alatt legfeljebb **147 000 Ft**.

Induló licit:

- pontos és kifejezésegyezésű kulcsszavak
- maximalizált kattintás szigorú CPC-plafonnal
- `purchase` elsődleges konverzió
- minden mikrokonverzió másodlagos/megfigyelési cél

Váltás `Maximize Conversions` stratégiára csak legalább 15-30 igazolt vásárlás után. `Target CPA` csak stabil, legalább 30-50 vásárlásos időszak után.

Skálázási kapuk:

1. **Pilot -> 20 vásárlás/nap:** CPA legfeljebb 1 200 Ft, nincs mérési hiba.
2. **20 -> 50 vásárlás/nap:** legalább két nyereséges nyelvi piac, checkout és email hibaarány kontroll alatt.
3. **50 -> 100 vásárlás/nap:** CPA legfeljebb 1 000 Ft vagy magasabb átlagos kosárérték.
4. **100 -> 150 vásárlás/nap:** legalább három stabil piac, 7 napos teljesítményablak, napi költésemelés legfeljebb 15-20%.

## 14. Napi 150 vásárlás realitása

A napi 150 vásárlás `5 USD` termékáron forgalmilag elérhető lehet, de csak kivételesen alacsony CPA mellett nyereséges. A skálázás gazdasági feltétele:

- cél-CPA: 800-1 200 Ft
- szükséges napi költés: 120 000-180 000 Ft
- 360 HUF/USD tervezési árfolyamon napi bruttó árbevétel: kb. 270 000 Ft
- a fenti árbevételből még levonandó a Stripe, OpenAI, email, számlázás, refund és üzemeltetés költsége

Erős ajánlás a skálázás előtt:

- magasabb értékű prémium riportcsomag
- checkout utáni releváns upsell
- több gyermekes családi csomag
- emelt árú, szakemberrel megosztható riportváltozat

A 120 000 Ft-os promóció a célméretnél kevesebb mint egy napi hirdetési költésnek felel meg. Pilotfinanszírozási segítség, nem a napi 150 vásárlás finanszírozási alapja.

## 15. Heti optimalizálási rutin

Hetente nézendő:

- kampányonkénti CPA
- nyelvenkénti conversion rate
- keresési kifejezések
- negatív kulcsszavak bővítése
- checkout dropoff
- kérdőív completion rate
- report/email success rate
- refund/support arány
- melyik nyelven keveredik angol szöveg
- melyik piacokon kell lokálisabb landing copy

Első 30 nap célja nem a maximális skála, hanem:

- legjobb 3 nyelv/piac azonosítása
- legjobb üzenet azonosítása
- checkout és riportfolyamat stabilitása
- vásárlói bizalom javítása

## 16. Élesítés előtti checklist Google Ads-hez

- [ ] Google Ads konverzió: `purchase`
- [ ] GA4 eventek aktívak
- [ ] Google Ads és GA4 összekötve
- [ ] Google Tag Manager publikálva
- [ ] `?lang=` URL-paraméter működik minden nyelven
- [ ] minden landing copy lokalizált
- [ ] checkout success/cancel minden nyelven lokalizált
- [ ] Stripe checkout nyelv megfelelően áll
- [ ] Számlázz.hu számla nyelve megfelelő
- [ ] privacy policy elérhető
- [ ] terms/refund információ elérhető
- [ ] kontakt email elérhető
- [ ] "nem diagnózis" disclaimer látható
- [ ] Google policy szempontból nem ijesztgető a copy
- [ ] nem célzunk gyerekeket
- [ ] nincs érzékeny egészségügyi remarketing
- [ ] admin dashboard látja a vásárlásokat, hibákat és email kézbesítést

## 17. Első 30 napos indítási terv

### 1. hét

- HU, EN, DE Search kampány indítás
- brand kampány indítás
- napi riport CPA, checkout, purchase alapján
- search term negatív lista tisztítás
- minden más nyelvi kampány szüneteltetve marad

### 2. hét

- FR, ES, PL csak akkor adható hozzá, ha a pilot CPA megfelel a kapunak
- első A/B landing üzenet teszt
- YouTube rövid edukációs kreatívok előkészítése

### 3. hét

- IT, PT, JA kampánystruktúra végső ellenőrzése, majd csak nyertes pilot mellett teszt
- legjobb nyelvek költségkeretének emelése
- keresési kifejezések és negatív listák újabb tisztítása

### 4. hét

- ZH és AR kontrollált teszt csak megfelelő nyelvi és policy ellenőrzés után
- nyelvi minőség audit
- CPA és vásárlói visszajelzés alapján termék/landing finomítás
- napi skálázási plafonok beállítása

Performance Max, Display, Demand Gen és remarketing az első 30 napban nem indul. Egészséghez közeli, gyermekekre vonatkozó témák alapján közönséglistát nem építünk.

## 18. Rövid döntési javaslat

Induláskor a legerősebb út:

1. Search kampány HU/EN/DE nyelveken
2. nagyon tiszta, nem diagnosztikus landing
3. vásárlás és checkout mérés stabilizálása
4. negatív kulcsszólista agresszív tisztítása
5. csak működő piacokra költségemelés
6. YouTube/Demand Gen csak edukációs és bizalomépítő szerepben

Nem a "gyermeked problémás?" típusú félelemalapú kampányt érdemes vinni, hanem ezt:

**"Ha bizonytalan vagy abban, mit mutatnak a mindennapi viselkedési minták, a NeuroMap Kids segít nyugodtan, érthetően és szülőbarát módon rendszerezni a képet."**
