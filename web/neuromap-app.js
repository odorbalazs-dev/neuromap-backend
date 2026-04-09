window.NeuroMapApp = (() => {
  const API_BASE_URL = "https://neuromap-backend-production-969d.up.railway.app";
  const SUPPORTED_LANGS = ["hu", "en", "de", "fr", "es", "it", "zh", "ja", "pt", "ar"];

  let currentLang = localStorage.getItem("nm_lang") || null;

  let selectedType = "";
  let triageAnswers = [];
  let specificAnswers = [];
  let currentSpecificQuestionSet = [];
  let currentExtraQuestionSet = [];
  let usedSpecificQuestionPool = [];
  let finalPayload = null;

  const translations = {
    hu: {
      ui: {
        brandTitle: "NeuroMap Kids",
        brandSubtitle: "Online fejlődési mintázatfeltérképezés",
        headerPill: "A kiértékelést e-mailben küldjük meg",
        heroBadge: "Szülőbarát • Strukturált • Online",
        heroTitle: "Gyors, átlátható kérdőív a gyermek fejlődési mintázatainak feltérképezéséhez",
        heroLead: "Az alapkérdőív és a részletes kérdéssor segít strukturált képet adni a szülői megfigyelésekről. A teljes, részletes kiértékelést fizetés után emailben küldjük el a megadott címre.",
        heroPoint1: "Átlátható, lépésenként vezetett kitöltési folyamat.",
        heroPoint2: "A részletes kérdőív minden alkalommal új kérdéseket tartalmaz.",
        heroPoint3: "A kiértékelés nem diagnózis, hanem tájékoztató jellegű összefoglaló.",
        sideTitle: "Mit kapsz a folyamat végén?",
        sideLead: "Fizetés után elkészítjük a részletes, szülőbarát értékelést, és emailben küldjük el.",
        mini1: "kérdéses alapszűrés",
        mini2: "részletes kérdéssor",
        mini3: "kérdéses bank területenként",
        mini4: "emailes kiértékelés",
        step1Badge: "Kezdés",
        startTitle: "Kérdőív indítása",
        startLead: "Add meg a gyermek keresztnevét és az email címedet. Az email címre fizetés után küldjük a részletes kiértékelést.",
        labelName: "A gyermek keresztneve",
        labelEmail: "Email cím",
        labelAge: "Korosztály",
        consentText: "Elfogadom az adatkezelési feltételeket, és tudomásul veszem, hogy ez a kérdőív nem diagnózis, hanem tájékoztató jellegű összefoglalót készít a megadott válaszok alapján.",
        hintText: "A kérdőív eredménye nem helyettesíti a személyes szakértői vizsgálatot.",
        startBtn: "Kérdőív megnyitása",
        step2Badge: "1. lépés • Alapkérdőív",
        triageTitle: "Alapkérdőív",
        triageLead: "Ez a rész segít meghatározni, melyik területet érdemes részletesebben áttekinteni.",
        triageSubmitBtn: "Kérdőív beküldése",
        step3Badge: "2. lépés • Ajánlott irány",
        recommendationTitle: "Ajánlott fókuszterület",
        recommendationNote: "Ez nem diagnózis, hanem a részletesebb kérdőív kiválasztását segítő irányjelzés.",
        specificStartBtn: "Kérdőív megnyitása",
        step4Badge: "3. lépés • Részletes kérdőív",
        specificTitleBase: "Részletes kérdőív",
        specificSubmitBtn: "Kérdőív beküldése",
        step4bBadge: "4. lépés • Pontosító kérdések",
        extraTitle: "Pontosító kérdések",
        extraLead: "A pontosabb kiértékeléshez néhány további kérdésre is szükség van.",
        extraSubmitBtn: "Kérdőív beküldése",
        step5Badge: "5. lépés • Fizetés",
        paymentTitle: "Részletes kiértékelés emailben",
        paymentLead: "A specifikus kérdőív részletes kiértékelését fizetés után készítjük el, és a megadott email címre küldjük el.",
        priceCaption: "egyszeri díj",
        securityNote: "A fizetés után a rendszer feldolgozza a válaszokat, elkészíti a kiértékelést, majd emailben küldi el.",
        paymentBtn: "Fizetés és kiértékelés indítása",
        step6Badge: "Kész",
        doneTitle: "Az értékelés feldolgozás alatt",
        loadingState: "Kiértékelés és elemzés folyamatban van...",
        successMessage: "A fizetés sikeres volt. A kiértékelést elküldjük a megadott email címre.",
        loadingCheckout: "Átirányítás a biztonságos fizetési oldalra...",
        loadingRedirect: "Átirányítás folyamatban...",
        genericError: "Hiba történt"
      },
      alerts: {
        missingName: "Kérlek, add meg a gyermek keresztnevét.",
        missingEmail: "Kérlek, add meg az email címet.",
        invalidEmail: "Az email cím formátuma nem megfelelő.",
        missingConsent: "A továbblépéshez el kell fogadnod a feltételeket.",
        checkoutError: "Nem sikerült elindítani a fizetést."
      },
      ageGroups: {
        "4m-1y": "4 hónap – 1 év",
        "1y-3y": "1 év – 3 év",
        "4-6y": "4 – 6 év"
      },
      responses: ["Nem jellemző", "Enyhén jellemző", "Gyakran jellemző", "Kifejezetten jellemző"],
      recommendations: {
        ASD: "A válaszok alapján ASD jellegű szociális-kommunikációs és rugalmatlansági mintázatok részletesebb áttekintése javasolt.",
        ADHD: "A válaszok alapján figyelmi és önszabályozási mintázatok részletesebb áttekintése javasolt.",
        ANX: "A válaszok alapján szorongásos mintázatok részletesebb áttekintése javasolt.",
        DEP: "A válaszok alapján hangulati terheltségre utaló mintázatok részletesebb áttekintése javasolt.",
        LEARN: "A válaszok alapján tanulási vagy fejlődési készségprofilbeli nehézségek részletesebb áttekintése javasolt."
      },
      specificIntro: {
        ASD: "Ez a részletes kérdőív a társas kapcsolódás, a rugalmasság és az érzékenységi mintázatok áttekintését segíti.",
        ADHD: "Ez a részletes kérdőív a figyelem, az impulzivitás és az önszabályozás mintázatait vizsgálja.",
        ANX: "Ez a részletes kérdőív a feszültség, az aggodalmaskodás és az elkerülő mintázatok mélyebb áttekintését támogatja.",
        DEP: "Ez a részletes kérdőív a hangulat, az érdeklődés és az érzelmi terheltség összképét segít feltárni.",
        LEARN: "Ez a részletes kérdőív a tanulási, nyelvi, emlékezeti és készségelsajátítási mintázatok részletesebb megfigyelését szolgálja."
      }
    },

    en: {
      ui: {
        brandTitle: "NeuroMap Kids",
        brandSubtitle: "Online developmental pattern screening",
        headerPill: "The evaluation will be sent by email",
        heroBadge: "Parent-friendly • Structured • Online",
        heroTitle: "A fast, transparent questionnaire to map developmental patterns in children",
        heroLead: "The screening and detailed questionnaire help structure parental observations. The full evaluation is sent by email after payment.",
        heroPoint1: "A clear, guided step-by-step process.",
        heroPoint2: "The detailed questionnaire contains new questions each time.",
        heroPoint3: "The evaluation is informational and not a diagnosis.",
        sideTitle: "What do you receive at the end?",
        sideLead: "After payment, we prepare a detailed, parent-friendly evaluation and send it by email.",
        mini1: "question screening",
        mini2: "detailed questionnaire",
        mini3: "question bank per area",
        mini4: "email evaluation",
        step1Badge: "Start",
        startTitle: "Start questionnaire",
        startLead: "Enter the child's first name and your email address. The detailed evaluation will be sent there after payment.",
        labelName: "Child's first name",
        labelEmail: "Email address",
        labelAge: "Age group",
        consentText: "I accept the data processing terms and understand that this questionnaire is not a diagnosis but an informational summary based on the provided answers.",
        hintText: "This questionnaire does not replace an in-person professional assessment.",
        startBtn: "Open questionnaire",
        step2Badge: "Step 1 • Screening",
        triageTitle: "Screening questionnaire",
        triageLead: "This section helps determine which area should be reviewed in more detail.",
        triageSubmitBtn: "Submit questionnaire",
        step3Badge: "Step 2 • Suggested direction",
        recommendationTitle: "Suggested focus area",
        recommendationNote: "This is not a diagnosis, only a guide for the detailed questionnaire.",
        specificStartBtn: "Open questionnaire",
        step4Badge: "Step 3 • Detailed questionnaire",
        specificTitleBase: "Detailed questionnaire",
        specificSubmitBtn: "Submit questionnaire",
        step4bBadge: "Step 4 • Clarifying questions",
        extraTitle: "Clarifying questions",
        extraLead: "A few additional questions are needed for a more precise evaluation.",
        extraSubmitBtn: "Submit questionnaire",
        step5Badge: "Step 5 • Payment",
        paymentTitle: "Detailed evaluation by email",
        paymentLead: "The detailed evaluation is prepared after payment and sent to the provided email address.",
        priceCaption: "one-time fee",
        securityNote: "After payment, the system processes the answers, prepares the evaluation, and sends it by email.",
        paymentBtn: "Pay and start evaluation",
        step6Badge: "Done",
        doneTitle: "Your evaluation is being processed",
        loadingState: "Evaluation and analysis are in progress...",
        successMessage: "Payment was successful. We will send the evaluation to the provided email address.",
        loadingCheckout: "Redirecting to the secure payment page...",
        loadingRedirect: "Redirect in progress...",
        genericError: "Something went wrong"
      },
      alerts: {
        missingName: "Please enter the child's first name.",
        missingEmail: "Please enter your email address.",
        invalidEmail: "The email address format is invalid.",
        missingConsent: "You need to accept the terms to continue.",
        checkoutError: "Could not start the payment."
      },
      ageGroups: {
        "4m-1y": "4 months – 1 year",
        "1y-3y": "1 – 3 years",
        "4-6y": "4 – 6 years"
      },
      responses: ["Not typical", "Slightly typical", "Often typical", "Highly typical"],
      recommendations: {
        ASD: "Based on the answers, a more detailed review of ASD-like social-communication and rigidity patterns is recommended.",
        ADHD: "Based on the answers, a more detailed review of attention and self-regulation patterns is recommended.",
        ANX: "Based on the answers, a more detailed review of anxiety-related patterns is recommended.",
        DEP: "Based on the answers, a more detailed review of mood-related burden is recommended.",
        LEARN: "Based on the answers, a more detailed review of learning or developmental skill patterns is recommended."
      },
      specificIntro: {
        ASD: "This detailed questionnaire reviews social connection, flexibility, and sensitivity patterns.",
        ADHD: "This detailed questionnaire reviews attention, impulsivity, and self-regulation patterns.",
        ANX: "This detailed questionnaire reviews tension, worry, and avoidance patterns in greater depth.",
        DEP: "This detailed questionnaire reviews mood, interest, and emotional burden patterns.",
        LEARN: "This detailed questionnaire reviews learning, language, memory, and skill acquisition patterns."
      }
    },

    de: {
      ui: {
        brandTitle: "NeuroMap Kids",
        brandSubtitle: "Online-Erfassung von Entwicklungsmustern",
        headerPill: "Die Auswertung wird per E-Mail gesendet",
        heroBadge: "Elternfreundlich • Strukturiert • Online",
        heroTitle: "Ein schneller, transparenter Fragebogen zur Erfassung von Entwicklungsmustern bei Kindern",
        heroLead: "Der Basis- und Detailfragebogen helfen, elterliche Beobachtungen strukturiert zu erfassen. Die vollständige Auswertung wird nach der Zahlung per E-Mail gesendet.",
        heroPoint1: "Klarer, schrittweiser Ablauf.",
        heroPoint2: "Der Detailfragebogen enthält jedes Mal neue Fragen.",
        heroPoint3: "Die Auswertung ist informativ und keine Diagnose.",
        sideTitle: "Was erhalten Sie am Ende?",
        sideLead: "Nach der Zahlung erstellen wir eine detaillierte, elternfreundliche Auswertung und senden sie per E-Mail.",
        mini1: "Fragen Basisscreening",
        mini2: "Fragen Detailfragebogen",
        mini3: "Fragenpool pro Bereich",
        mini4: "E-Mail-Auswertung",
        step1Badge: "Start",
        startTitle: "Fragebogen starten",
        startLead: "Geben Sie den Vornamen des Kindes und Ihre E-Mail-Adresse ein. Die detaillierte Auswertung wird nach der Zahlung dorthin gesendet.",
        labelName: "Vorname des Kindes",
        labelEmail: "E-Mail-Adresse",
        labelAge: "Altersgruppe",
        consentText: "Ich akzeptiere die Datenschutzbedingungen und verstehe, dass dieser Fragebogen keine Diagnose, sondern eine informative Zusammenfassung ist.",
        hintText: "Dieser Fragebogen ersetzt keine persönliche fachliche Untersuchung.",
        startBtn: "Fragebogen öffnen",
        step2Badge: "Schritt 1 • Screening",
        triageTitle: "Screening-Fragebogen",
        triageLead: "Dieser Teil hilft festzustellen, welcher Bereich genauer betrachtet werden sollte.",
        triageSubmitBtn: "Fragebogen absenden",
        step3Badge: "Schritt 2 • Empfohlene Richtung",
        recommendationTitle: "Empfohlener Schwerpunkt",
        recommendationNote: "Dies ist keine Diagnose, sondern eine Orientierung für den Detailfragebogen.",
        specificStartBtn: "Fragebogen öffnen",
        step4Badge: "Schritt 3 • Detailfragebogen",
        specificTitleBase: "Detailfragebogen",
        specificSubmitBtn: "Fragebogen absenden",
        step4bBadge: "Schritt 4 • Klärende Fragen",
        extraTitle: "Klärende Fragen",
        extraLead: "Für eine genauere Auswertung werden einige zusätzliche Fragen benötigt.",
        extraSubmitBtn: "Fragebogen absenden",
        step5Badge: "Schritt 5 • Zahlung",
        paymentTitle: "Detaillierte Auswertung per E-Mail",
        paymentLead: "Die detaillierte Auswertung wird nach der Zahlung erstellt und an die angegebene E-Mail-Adresse gesendet.",
        priceCaption: "einmalige Gebühr",
        securityNote: "Nach der Zahlung verarbeitet das System die Antworten, erstellt die Auswertung und sendet sie per E-Mail.",
        paymentBtn: "Bezahlen und Auswertung starten",
        step6Badge: "Fertig",
        doneTitle: "Ihre Auswertung wird verarbeitet",
        loadingState: "Auswertung und Analyse laufen...",
        successMessage: "Die Zahlung war erfolgreich. Wir senden die Auswertung an die angegebene E-Mail-Adresse.",
        loadingCheckout: "Weiterleitung zur sicheren Zahlungsseite...",
        loadingRedirect: "Weiterleitung läuft...",
        genericError: "Ein Fehler ist aufgetreten"
      },
      alerts: {
        missingName: "Bitte geben Sie den Vornamen des Kindes ein.",
        missingEmail: "Bitte geben Sie Ihre E-Mail-Adresse ein.",
        invalidEmail: "Das Format der E-Mail-Adresse ist ungültig.",
        missingConsent: "Sie müssen die Bedingungen akzeptieren, um fortzufahren.",
        checkoutError: "Die Zahlung konnte nicht gestartet werden."
      },
      ageGroups: {
        "4m-1y": "4 Monate – 1 Jahr",
        "1y-3y": "1 – 3 Jahre",
        "4-6y": "4 – 6 Jahre"
      },
      responses: ["Nicht typisch", "Leicht typisch", "Oft typisch", "Stark typisch"],
      recommendations: {
        ASD: "Basierend auf den Antworten wird eine genauere Betrachtung ASD-ähnlicher sozial-kommunikativer und rigider Muster empfohlen.",
        ADHD: "Basierend auf den Antworten wird eine genauere Betrachtung von Aufmerksamkeits- und Selbstregulationsmustern empfohlen.",
        ANX: "Basierend auf den Antworten wird eine genauere Betrachtung angstbezogener Muster empfohlen.",
        DEP: "Basierend auf den Antworten wird eine genauere Betrachtung stimmungsbezogener Belastung empfohlen.",
        LEARN: "Basierend auf den Antworten wird eine genauere Betrachtung von Lern- oder Entwicklungsprofilen empfohlen."
      },
      specificIntro: {
        ASD: "Dieser Detailfragebogen betrachtet soziale Verbindung, Flexibilität und Empfindlichkeitsmuster.",
        ADHD: "Dieser Detailfragebogen betrachtet Aufmerksamkeit, Impulsivität und Selbstregulationsmuster.",
        ANX: "Dieser Detailfragebogen betrachtet Anspannung, Sorgen und Vermeidung genauer.",
        DEP: "Dieser Detailfragebogen betrachtet Stimmung, Interesse und emotionale Belastung.",
        LEARN: "Dieser Detailfragebogen betrachtet Lern-, Sprach-, Gedächtnis- und Fertigkeitserwerbsmuster."
      }
    }
  };

  const triageQuestions = {
    hu: [
      "Reagál a nevére következetesen és megfelelő gyorsasággal?",
      "Keres és tart szemkontaktust természetes helyzetekben?",
      "Mutat vagy odavisz tárgyakat, hogy megossza az érdeklődését?",
      "Utánoz egyszerű mozdulatokat vagy arckifejezéseket?",
      "Élvezi a közös figyelmi helyzeteket, például amikor együtt néznek valamit?",
      "Megnyugtatható ismert személlyel vagy megszokott rutinokkal?",
      "Használ gesztusokat a kommunikáció támogatására?",
      "Megfigyelhető ismétlődő mozgás vagy szokatlan rutinragaszkodás?",
      "Nehezen vált át egyik tevékenységről a másikra?",
      "Kifejezetten erős reakciót ad váratlan változásokra?"
    ],
    en: [
      "Does the child respond to their name consistently and promptly?",
      "Does the child seek and maintain eye contact in natural situations?",
      "Does the child point to or bring objects to share interest?",
      "Does the child imitate simple movements or facial expressions?",
      "Does the child enjoy shared attention situations, for example when looking at something together?",
      "Can the child be calmed by familiar people or routines?",
      "Does the child use gestures to support communication?",
      "Are repetitive movements or unusual attachment to routines noticeable?",
      "Does the child have difficulty switching from one activity to another?",
      "Does the child react strongly to unexpected changes?"
    ],
    de: [
      "Reagiert das Kind zuverlässig und zeitnah auf seinen Namen?",
      "Sucht und hält das Kind in natürlichen Situationen Blickkontakt?",
      "Zeigt oder bringt das Kind Gegenstände, um Interesse zu teilen?",
      "Imitiert das Kind einfache Bewegungen oder Gesichtsausdrücke?",
      "Genießt das Kind Situationen gemeinsamer Aufmerksamkeit, zum Beispiel beim gemeinsamen Anschauen von etwas?",
      "Lässt sich das Kind durch vertraute Personen oder Routinen beruhigen?",
      "Verwendet das Kind Gesten zur Unterstützung der Kommunikation?",
      "Sind wiederholte Bewegungen oder eine ungewöhnliche Bindung an Routinen erkennbar?",
      "Fällt es dem Kind schwer, von einer Aktivität zur anderen zu wechseln?",
      "Reagiert das Kind stark auf unerwartete Veränderungen?"
    ]
  };

  const specificQuestionBanks = {
    hu: {
      ASD: [
        "Szívesen osztja meg másokkal, amit érdekesnek talál?",
        "Rá szokott mutatni dolgokra, hogy más is odanézzen?",
        "Könnyen bekapcsolódik a közös játékba?",
        "Észrevehetően keresi mások társaságát?",
        "Gyakran inkább egyedül foglalja el magát?",
        "Rugalmasan viseli, ha megváltozik a napi rutin?",
        "Zavarja, ha valami nem a megszokott módon történik?",
        "Gyakran ismétel mozdulatokat vagy testtartásokat?",
        "Van olyan tárgy vagy téma, amihez szokatlanul erősen ragaszkodik?",
        "Könnyen megérti mások arckifejezését vagy hangulatát?"
      ],
      ADHD: [
        "Nehéz számára végigülni egy nyugodtabb tevékenységet?",
        "Sokszor feláll vagy mocorog, amikor nyugalom lenne elvárt?",
        "Könnyen elkalandozik, még rövid feladatoknál is?",
        "Gyakran úgy tűnik, hogy nem figyel a hozzá intézett kérésre?",
        "Nehéz számára befejezni, amit elkezdett?",
        "Gyakran félbehagy feladatokat, majd másba kezd?",
        "Sokszor elveszít vagy elfelejt fontos apróságokat?",
        "Nehezen tartja észben, mit kell egymás után megcsinálnia?",
        "Könnyen kizökkenti a környezet zaja vagy mozgása?",
        "Gyakran közbevág másoknak?"
      ],
      ANX: [
        "Gyakran aggódik olyan dolgok miatt is, amelyek máskor nem tűnnek veszélyesnek?",
        "Új helyzetekben nehezen oldódik fel?",
        "Idegen emberek vagy helyek fokozott feszültséget váltanak ki nála?",
        "Elváláskor erősen kapaszkodik vagy nehezen nyugszik meg?",
        "Sok megerősítést kér, hogy minden rendben lesz?",
        "Gyakran fél a hibázástól?",
        "Teljesítményhelyzetben könnyen befeszül?",
        "Feszültebb helyzetekben testi panaszai lehetnek?",
        "Kerül bizonyos helyzeteket, mert azok aggasztják?",
        "Nehezen viseli a bizonytalanságot?"
      ],
      DEP: [
        "Kevesebb örömet mutat azokban a dolgokban, amelyeket korábban szeretett?",
        "Hangulata gyakran lehangolt vagy tartósan kedvetlennek tűnik?",
        "Ingerlékenyebb vagy sérülékenyebb a megszokottnál?",
        "Kevesebb energiát mutat a mindennapokban?",
        "Nehezebben indul bele játékba vagy tevékenységbe?",
        "Gyakrabban félrevonul vagy visszahúzódik?",
        "Korábbi érdeklődése csökkentnek tűnik?",
        "Többször sír vagy szomorkodik látható ok nélkül is?",
        "Könnyebben elveszíti a kedvét, mint korábban?",
        "Frusztráció után lassabban nyugszik meg?"
      ],
      LEARN: [
        "A beszéd- és nyelvi fejlődés egyenetlennek tűnhet?",
        "Egyszerű utasításoknál is előfordulhat, hogy elveszíti a fonalat?",
        "Nehezen jegyez meg új szavakat vagy fogalmakat?",
        "Több ismétlésre van szüksége új készségek megtanulásához?",
        "A már megtanult dolgok alkalmazása helyzetenként bizonytalan?",
        "Finommotoros feladatokban lassabb vagy bizonytalanabb lehet?",
        "Nehezebben tartja fejben a lépéseket egymás után?",
        "Az auditív információk feldolgozása lassabbnak tűnhet?",
        "Szóban nehezebben fejezi ki magát, mint ahogy láthatóan érti a helyzetet?",
        "A figyelem mellett a megértés is ingadozhat?"
      ]
    },
    en: {
      ASD: [
        "Does the child willingly share interesting things with others?",
        "Does the child point to things so that others will look too?",
        "Does the child join shared play easily?",
        "Does the child visibly seek the company of others?",
        "Does the child often prefer to occupy themselves alone?",
        "Does the child cope flexibly with changes in routine?",
        "Is the child upset when things do not happen in the usual way?",
        "Does the child often repeat movements or postures?",
        "Is there an object or topic the child is unusually attached to?",
        "Does the child understand other people's facial expressions or moods easily?"
      ],
      ADHD: [
        "Is it hard for the child to sit through a calmer activity?",
        "Does the child often get up or fidget when calm behavior is expected?",
        "Does the child's attention drift easily, even during short tasks?",
        "Does it often seem that the child is not listening to direct requests?",
        "Is it hard for the child to finish what they start?",
        "Does the child often leave tasks unfinished and move on to something else?",
        "Does the child often lose or forget important small things?",
        "Is it hard for the child to remember what to do step by step?",
        "Is the child easily distracted by movement or noise in the environment?",
        "Does the child often interrupt others?"
      ],
      ANX: [
        "Does the child often worry about things that would not usually seem dangerous?",
        "Does the child struggle to relax in new situations?",
        "Do unfamiliar people or places trigger noticeable tension?",
        "During separation, does the child cling strongly or struggle to calm down?",
        "Does the child often seek reassurance that everything will be okay?",
        "Is the child often afraid of making mistakes?",
        "Does the child become tense in performance situations?",
        "Does the child have physical complaints in stressful situations?",
        "Does the child avoid certain situations because they are worrying?",
        "Does the child struggle with uncertainty?"
      ],
      DEP: [
        "Does the child show less joy in things they used to enjoy?",
        "Does the child's mood often seem low or persistently down?",
        "Is the child more irritable or emotionally fragile than usual?",
        "Does the child show less energy in everyday life?",
        "Is it harder for the child to start playing or engaging in activities?",
        "Does the child withdraw more often?",
        "Does the child's previous interest seem reduced?",
        "Does the child cry or seem sad more often without a clear reason?",
        "Does the child lose motivation more easily than before?",
        "Does the child calm down more slowly after frustration?"
      ],
      LEARN: [
        "Does speech and language development seem uneven?",
        "Does the child sometimes lose track even with simple instructions?",
        "Does the child have difficulty remembering new words or concepts?",
        "Does the child need more repetition to learn new skills?",
        "Is it hard for the child to apply learned things consistently?",
        "Can fine motor tasks seem slower or less certain?",
        "Is it difficult for the child to keep multiple steps in mind?",
        "Can auditory information processing seem slower?",
        "Is it harder for the child to express themselves verbally than their understanding suggests?",
        "Does comprehension seem to fluctuate alongside attention?"
      ]
    },
    de: {
      ASD: [
        "Teilt das Kind interessante Dinge gern mit anderen?",
        "Zeigt das Kind auf Dinge, damit andere auch hinschauen?",
        "Beteiligt sich das Kind leicht am gemeinsamen Spiel?",
        "Sucht das Kind sichtbar die Gesellschaft anderer?",
        "Beschäftigt sich das Kind oft lieber allein?",
        "Geht das Kind flexibel mit Veränderungen im Tagesablauf um?",
        "Stört es das Kind, wenn etwas nicht wie gewohnt abläuft?",
        "Wiederholt das Kind häufig Bewegungen oder Haltungen?",
        "Gibt es einen Gegenstand oder ein Thema, an dem das Kind ungewöhnlich stark hängt?",
        "Versteht das Kind Gesichtsausdrücke oder Stimmungen anderer leicht?"
      ],
      ADHD: [
        "Fällt es dem Kind schwer, eine ruhigere Aktivität durchzuhalten?",
        "Steht das Kind oft auf oder zappelt, wenn Ruhe erwartet wird?",
        "Lässt sich die Aufmerksamkeit des Kindes auch bei kurzen Aufgaben leicht ablenken?",
        "Wirkt es oft so, als würde das Kind direkte Aufforderungen nicht hören?",
        "Fällt es dem Kind schwer, Begonnenes zu Ende zu bringen?",
        "Bricht das Kind Aufgaben häufig ab und wechselt zu etwas anderem?",
        "Verliert oder vergisst das Kind häufig wichtige Kleinigkeiten?",
        "Fällt es dem Kind schwer, sich die einzelnen Schritte einer Aufgabe zu merken?",
        "Lässt sich das Kind leicht durch Geräusche oder Bewegung ablenken?",
        "Unterbricht das Kind andere häufig?"
      ],
      ANX: [
        "Sorgt sich das Kind oft um Dinge, die normalerweise nicht gefährlich erscheinen?",
        "Fällt es dem Kind schwer, sich in neuen Situationen zu entspannen?",
        "Lösen unbekannte Menschen oder Orte deutliche Anspannung aus?",
        "Klammerte sich das Kind bei Trennung stark an oder beruhigt es sich schwer?",
        "Sucht das Kind häufig Bestätigung, dass alles in Ordnung ist?",
        "Hat das Kind oft Angst, Fehler zu machen?",
        "Wird das Kind in Leistungssituationen schnell angespannt?",
        "Hat das Kind in belastenden Situationen körperliche Beschwerden?",
        "Vermeidet das Kind bestimmte Situationen, weil sie ihm Sorgen machen?",
        "Fällt dem Kind Unsicherheit schwer?"
      ],
      DEP: [
        "Zeigt das Kind weniger Freude an Dingen, die es früher mochte?",
        "Wirkt die Stimmung des Kindes oft niedergeschlagen oder dauerhaft gedrückt?",
        "Ist das Kind gereizter oder emotional empfindlicher als sonst?",
        "Zeigt das Kind im Alltag weniger Energie?",
        "Fällt es dem Kind schwerer, mit Spielen oder Aktivitäten zu beginnen?",
        "Zieht sich das Kind häufiger zurück?",
        "Wirkt das frühere Interesse des Kindes vermindert?",
        "Weint oder wirkt das Kind häufiger traurig ohne klaren Grund?",
        "Verliert das Kind leichter die Motivation als früher?",
        "Beruhigt sich das Kind nach Frustration langsamer?"
      ],
      LEARN: [
        "Wirkt die Sprach- und Sprechentwicklung ungleichmäßig?",
        "Verliert das Kind auch bei einfachen Anweisungen manchmal den Faden?",
        "Fällt es dem Kind schwer, neue Wörter oder Begriffe zu behalten?",
        "Braucht das Kind mehr Wiederholungen, um neue Fertigkeiten zu lernen?",
        "Fällt es dem Kind schwer, Gelerntes zuverlässig anzuwenden?",
        "Wirken feinmotorische Aufgaben langsamer oder unsicherer?",
        "Fällt es dem Kind schwer, mehrere Schritte im Kopf zu behalten?",
        "Wirkt die Verarbeitung auditiver Informationen langsamer?",
        "Fällt es dem Kind schwerer, sich sprachlich auszudrücken, als sein Verständnis vermuten lässt?",
        "Schwankt das Verstehen zusammen mit der Aufmerksamkeit?"
      ]
    }
  };

  function getLangData(lang) {
    return translations[lang] || translations.en;
  }

  function getTriageQuestions(lang) {
    return triageQuestions[lang] || triageQuestions.en;
  }

  function getSpecificBank(lang, type) {
    const all = specificQuestionBanks[lang] || specificQuestionBanks.en;
    return all[type] || [];
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el && typeof text === "string") el.textContent = text;
  }

  function showLanguageModal() {
    const modal = document.getElementById("languageModal");
    if (modal) modal.style.display = "flex";
  }

  function hideLanguageModal() {
    const modal = document.getElementById("languageModal");
    if (modal) modal.style.display = "none";
  }

  function applyDirection(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }

  function renderUI() {
    const data = getLangData(currentLang || "en");
    const ui = data.ui;

    setText("brandTitle", ui.brandTitle);
    setText("brandSubtitle", ui.brandSubtitle);
    setText("headerPill", ui.headerPill);
    setText("heroBadge", ui.heroBadge);
    setText("heroTitle", ui.heroTitle);
    setText("heroLead", ui.heroLead);
    setText("heroPoint1", ui.heroPoint1);
    setText("heroPoint2", ui.heroPoint2);
    setText("heroPoint3", ui.heroPoint3);
    setText("sideTitle", ui.sideTitle);
    setText("sideLead", ui.sideLead);
    setText("mini1", ui.mini1);
    setText("mini2", ui.mini2);
    setText("mini3", ui.mini3);
    setText("mini4", ui.mini4);
    setText("step1Badge", ui.step1Badge);
    setText("startTitle", ui.startTitle);
    setText("startLead", ui.startLead);
    setText("labelName", ui.labelName);
    setText("labelEmail", ui.labelEmail);
    setText("labelAge", ui.labelAge);
    setText("consentText", ui.consentText);
    setText("hintText", ui.hintText);
    setText("startBtn", ui.startBtn);
    setText("step2Badge", ui.step2Badge);
    setText("triageTitle", ui.triageTitle);
    setText("triageLead", ui.triageLead);
    setText("triageSubmitBtn", ui.triageSubmitBtn);
    setText("step3Badge", ui.step3Badge);
    setText("recommendationTitle", ui.recommendationTitle);
    setText("recommendationNote", ui.recommendationNote);
    setText("specificStartBtn", ui.specificStartBtn);
    setText("step4Badge", ui.step4Badge);
    setText("specificSubmitBtn", ui.specificSubmitBtn);
    setText("step4bBadge", ui.step4bBadge);
    setText("extraTitle", ui.extraTitle);
    setText("extraLead", ui.extraLead);
    setText("extraSubmitBtn", ui.extraSubmitBtn);
    setText("step5Badge", ui.step5Badge);
    setText("paymentTitle", ui.paymentTitle);
    setText("paymentLead", ui.paymentLead);
    setText("priceCaption", ui.priceCaption);
    setText("securityNote", ui.securityNote);
    setText("paymentBtn", ui.paymentBtn);
    setText("step6Badge", ui.step6Badge);
    setText("doneTitle", ui.doneTitle);
    setText("loadingState", ui.loadingState);
    setText("successMessage", ui.successMessage);

    const langSwitch = document.getElementById("langSwitch");
    if (langSwitch) langSwitch.textContent = (currentLang || "en").toUpperCase();

    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    if (nameInput) {
      nameInput.placeholder = currentLang === "hu" ? "Például: Anna" : currentLang === "de" ? "Zum Beispiel: Anna" : "For example: Anna";
    }
    if (emailInput) {
      emailInput.placeholder = currentLang === "hu" ? "pelda@email.hu" : "example@email.com";
    }
  }

  function renderAgeOptions() {
    const data = getLangData(currentLang || "en");
    const select = document.getElementById("ageGroup");
    if (!select) return;

    const currentValue = select.value || "4m-1y";
    select.innerHTML = `
      <option value="4m-1y">${data.ageGroups["4m-1y"]}</option>
      <option value="1y-3y">${data.ageGroups["1y-3y"]}</option>
      <option value="4-6y">${data.ageGroups["4-6y"]}</option>
    `;
    select.value = currentValue;
  }

  function renderQuestions(containerId, questions, className) {
    const data = getLangData(currentLang || "en");
    const responses = data.responses;
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = questions.map((q, index) => `
      <div class="question-block">
        <div class="question-title">${index + 1}. ${q}</div>
        <select class="${className}">
          <option value="0">${responses[0]}</option>
          <option value="1">${responses[1]}</option>
          <option value="2">${responses[2]}</option>
          <option value="3">${responses[3]}</option>
        </select>
      </div>
    `).join("");
  }

  function renderTriage() {
    renderQuestions("triageContainer", getTriageQuestions(currentLang || "en"), "triage-answer");
  }

  function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function switchStep(stepId) {
    ["step1", "step2", "step3", "step4", "step4b", "step5", "step6"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add("hidden");
    });
    const target = document.getElementById(stepId);
    if (target) target.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem("nm_lang", lang);
    applyDirection(lang);
    renderUI();
    renderAgeOptions();
    renderTriage();
    hideLanguageModal();
  }

  function startTest() {
    const data = getLangData(currentLang || "en");
    const childName = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const consent = document.getElementById("consent").checked;

    if (!childName) {
      alert(data.alerts.missingName);
      return;
    }

    if (!email) {
      alert(data.alerts.missingEmail);
      return;
    }

    if (!validateEmail(email)) {
      alert(data.alerts.invalidEmail);
      return;
    }

    if (!consent) {
      alert(data.alerts.missingConsent);
      return;
    }

    switchStep("step2");
  }

  function finishTriage() {
    triageAnswers = Array.from(document.querySelectorAll(".triage-answer")).map(el => parseInt(el.value, 10));

    const grouped = { ASD: 0, ADHD: 0, ANX: 0, DEP: 0, LEARN: 0 };

    triageAnswers.forEach((value, index) => {
      if (index >= 0 && index <= 1) grouped.ASD += value * 1.25;
      if (index >= 2 && index <= 3) grouped.ADHD += value * 1.2;
      if (index >= 4 && index <= 5) grouped.ANX += value * 1.2;
      if (index >= 6 && index <= 7) grouped.DEP += value * 1.2;
      if (index >= 8 && index <= 9) grouped.LEARN += value * 1.15;
    });

    selectedType = Object.keys(grouped).reduce((a, b) => grouped[a] > grouped[b] ? a : b);

    const data = getLangData(currentLang || "en");
    const recommendationText = document.getElementById("recommendationText");
    if (recommendationText) recommendationText.textContent = data.recommendations[selectedType];

    switchStep("step3");
  }

  function startSpecificTest() {
    const data = getLangData(currentLang || "en");
    const bank = getSpecificBank(currentLang || "en", selectedType);
    currentSpecificQuestionSet = shuffleArray(bank).slice(0, Math.min(10, bank.length));
    usedSpecificQuestionPool = [...currentSpecificQuestionSet];

    const specificTitle = document.getElementById("specificTitle");
    const specificIntro = document.getElementById("specificIntro");

    if (specificTitle) specificTitle.textContent = `${selectedType} – ${data.ui.specificTitleBase}`;
    if (specificIntro) specificIntro.textContent = data.specificIntro[selectedType];

    renderQuestions("specificContainer", currentSpecificQuestionSet, "specific-answer");
    switchStep("step4");
  }

  function finishSpecific() {
    specificAnswers = Array.from(document.querySelectorAll(".specific-answer")).map(el => parseInt(el.value, 10));
    preparePayment();
  }

  function finishExtraSpecific() {
    preparePayment();
  }

  function preparePayment() {
    const weightedScore = specificAnswers.reduce((sum, val) => sum + val, 0);
    const childName = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const ageGroup = document.getElementById("ageGroup").value;
    const data = getLangData(currentLang || "en");

    finalPayload = {
      email,
      name: childName,
      lang: currentLang || "en",
      payload: {
        childName,
        ageGroup,
        ageGroupLabel: data.ageGroups[ageGroup],
        type: selectedType,
        score: Math.round(weightedScore),
        triageAnswers,
        answers: specificAnswers,
        askedSpecificQuestions: usedSpecificQuestionPool,
        usedExtraQuestions: [],
        paymentConfirmed: true
      }
    };

    switchStep("step5");
  }

  async function startCheckout() {
    const data = getLangData(currentLang || "en");
    const paymentBox = document.getElementById("paymentStatus");
    if (!paymentBox) return;

    paymentBox.classList.remove("hidden");
    paymentBox.className = "status status-loading";
    paymentBox.innerText = data.ui.loadingCheckout;

    try {
      const response = await fetch(`${API_BASE_URL}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || data.alerts.checkoutError);
      }

      if (!result.checkoutUrl) {
        throw new Error(data.alerts.checkoutError);
      }

      paymentBox.innerText = data.ui.loadingRedirect;
      window.location.href = result.checkoutUrl;
    } catch (error) {
      paymentBox.className = "status status-error";
      paymentBox.innerText = `${data.ui.genericError}: ${error.message}`;
    }
  }

  function init() {
    function init() {
  const langSwitch = document.getElementById("langSwitch");
  if (langSwitch) {
    langSwitch.addEventListener("click", showLanguageModal);
  }

  window.selectLang = setLanguage;
  window.startTest = startTest;
  window.finishTriage = finishTriage;
  window.startSpecificTest = startSpecificTest;
  window.finishSpecific = finishSpecific;
  window.finishExtraSpecific = finishExtraSpecific;
  window.startCheckout = startCheckout;

  showLanguageModal();

  if (currentLang && SUPPORTED_LANGS.includes(currentLang)) {
    applyDirection(currentLang);
    renderUI();
    renderAgeOptions();
    renderTriage();
  }
}
  }

  return { init };
})();

if (document.readyState === "complete" || document.readyState === "interactive") {
  if (window.NeuroMapApp) {
    window.NeuroMapApp.init();
  }
} else {
  window.addEventListener("DOMContentLoaded", () => {
    if (window.NeuroMapApp) {
      window.NeuroMapApp.init();
    }
  });
}
