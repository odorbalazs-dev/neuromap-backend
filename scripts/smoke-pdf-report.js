import fs from "node:fs";
import path from "node:path";
import {
  generatePdfBuffer,
  polishHungarianReportWording
} from "../src/services/pdf.service.js";
import {
  REPORT_SUBDOMAIN_KEYS,
  formatProfessionalTerm,
  localizeHungarianReportTerminology
} from "../src/utils/report-terminology.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function countPdfPages(buffer) {
  const source = buffer.toString("latin1");
  return (source.match(/\/Type\s*\/Page\b/g) || []).length;
}

function buildSampleReportText() {
  const sections = [
    [
      "### 1. Rövid nyitó összefoglaló",
      "A válaszok alapján a legerősebb jelzés a figyelmi önszabályozás, a feladattartás és a végrehajtó viselkedés területén jelenik meg. Ez nem diagnosztikus megállapítás, hanem egy strukturált előszűrési kép, amely segít abban, hogy a szülő lássa, mely helyzetekben érdemes tovább figyelni a gyermek mindennapi működését."
    ],
    [
      "2. Fő megfigyelt mintázatok",
      "A profilban visszatérő elem, hogy a gyermek teljesítménye hullámzó lehet akkor is, amikor a feladatot alapvetően megérti. A nehézség gyakran nem a képesség hiányából, hanem a figyelmi terhelésből, a váltásokból, a frusztráció gyors emelkedéséből vagy a feladat befejezésének nehézségéből ered. Ez különösen akkor látható, amikor sok inger, időnyomás vagy több lépésből álló elvárás jelenik meg egyszerre."
    ],
    [
      "3. Mindennapi helyzetekben várható megjelenés",
      "Otthoni helyzetben ez gyakran úgy jelenhet meg, hogy a gyermek elkezd egy tevékenységet, de közben más inger elviszi a figyelmét. Tanulási vagy óvodai-iskolai helyzetben nagyobb lehet a különbség a rövid, egyértelmű feladatok és a hosszan fenntartott figyelmet igénylő feladatok között. A szülő számára fontos jelzés, hogy a nehézség nem minden pillanatban látszik egyformán, ezért a jó napok nem zárják ki a valós terhelést."
    ],
    [
      "4. Strengths and protective factors",
      "A Primary area of concern az executive_function és az emotional regulation területeihez kapcsolódik. A kérdőív mintázata alapján külön figyelmet érdemelnek azok a helyzetek, ahol a gyermek érdeklődése, mozgásigénye vagy vizuális támogatása segíti a jobb teljesítményt."
    ],
    [
      "5. Szülői támogatási irányok",
      "A legfontosabb támogatási irány nem a több figyelmeztetés, hanem a környezet okosabb struktúrája.\n- Hasznos lehet a rövid, egyértelmű instrukció.\n- A vizuális lista segítheti a feladatkezdést.\n- A befejezés előtt adott konkrét visszajelzés csökkentheti az elakadást.\nA cél az, hogy a gyermek ne csak hallja, mit kell tennie, hanem lássa és követni is tudja a folyamatot."
    ],
    [
      "6. Érzelmi és viselkedési következmények",
      "Ha a gyermek sokszor tapasztalja meg, hogy nem sikerül időben befejeznie vagy követnie a feladatot, másodlagosan frusztráció, elkerülés vagy önértékelési bizonytalanság is kialakulhat. Ezért érdemes a viselkedést nem pusztán engedetlenségként értelmezni, hanem azt is megnézni, milyen terhelés előzi meg a reakciót."
    ],
    [
      "7. Kommunikáció az óvodával vagy iskolával",
      "A pedagógusok felé érdemes konkrét helyzeteket megfogalmazni: mikor romlik a figyelem, mi segít, hogyan reagál a gyermek váltásnál, és milyen feladatformátumban teljesít jobban. A leghasznosabb visszajelzés nem általános címke, hanem megfigyelhető viselkedések listája."
    ],
    [
      "8. Mikor érdemes szakemberhez fordulni",
      "Ha a nehézségek több környezetben, tartósan és a mindennapi viselkedést érdemben befolyásolva jelennek meg, érdemes gyermekpszichológus, gyermekpszichiáter, gyógypedagógus vagy fejlesztő szakember bevonását megfontolni. Különösen fontos ez akkor, ha a gyermek önbizalma csökken, gyakori a konfliktus, vagy a családi élet jelentős terhelés alá kerül."
    ],
    [
      "9. Következő harminc nap javasolt fókusza",
      "A következő időszakban érdemes egyetlen, jól körülhatárolt célra fókuszálni. Például a reggeli készülődés, a házi feladat elkezdése vagy az esti rutin lehet olyan terület, ahol a struktúra mérhetően segíthet. A túl sok egyszerre bevezetett változtatás gyakran csökkenti a következetességet."
    ],
    [
      "10. Mit ne vonjunk le következtetésként",
      "A riport alapján nem mondható ki diagnózis, és nem következik belőle, hogy a gyermek képességei gyengék. A mintázat inkább arra utal, hogy bizonyos önszabályozási és figyelmi feltételek mellett a teljesítmény erősen változhat. Ez a különbség sokszor jól támogatható, ha a környezet megfelelően alkalmazkodik."
    ],
    [
      "11. Záró megjegyzés",
      "**Fontos:** ez az anyag tájékoztató jellegű. A pontos értelmezéshez a gyermek életkora, fejlődéstörténete, családi helyzete, óvodai vagy iskolai visszajelzései, valamint személyes szakemberi vizsgálat is szükséges. --- A riport célja, hogy a szülő rendezettebb képet kapjon, és magabiztosabban tudja megtenni a következő lépést."
    ]
  ];

  return sections.map(([title, body]) => `${title}\n\n${body}`).join("\n\n");
}

function buildStressReportText() {
  const longParagraph = Array.from({ length: 26 }, (_, index) => {
    const step = index + 1;
    return `Stresszbekezdés ${step}: a riportnak akkor is kulturáltan kell oldalt törni, ha egy szakmai magyarázat hosszan folytatódik, több példát, szülői javaslatot, óvodai vagy iskolai megfigyelést és következő lépéseket sorol fel egyetlen nagyobb gondolati egységben.`;
  }).join(" ");

  const longBullets = Array.from({ length: 7 }, (_, index) => {
    const step = index + 1;
    return `- Hosszú javaslat ${step}: válassz egy konkrét, hétköznapi helyzetet, figyeld meg a kiváltókat, rögzítsd, mi segít, és csak egyetlen kis változtatást vezess be, hogy a szülő és a gyermek számára is követhető maradjon a folyamat.`;
  }).join("\n");

  return [
    "1. Hosszú szakmai összefoglaló",
    longParagraph,
    "2. Hosszú szülői javaslatlista",
    longBullets,
    "3. Hosszú megfigyelési keret",
    longParagraph,
    "4. Hosszú zárás",
    longParagraph
  ].join("\n\n");
}

function buildSamplePayload() {
  const subdomains = {
    executive: {
      rawSum: 12,
      weightedSum: 13.2,
      totalWeight: 6,
      itemCount: 6,
      average: 2.2
    },
    inattention: {
      rawSum: 10,
      weightedSum: 10.5,
      totalWeight: 6,
      itemCount: 6,
      average: 1.75
    },
    impulsivity: {
      rawSum: 8,
      weightedSum: 8.4,
      totalWeight: 6,
      itemCount: 6,
      average: 1.4
    },
    emotional_regulation: {
      rawSum: 7,
      weightedSum: 7.2,
      totalWeight: 6,
      itemCount: 6,
      average: 1.2
    },
    task_completion: {
      rawSum: 6,
      weightedSum: 6.3,
      totalWeight: 6,
      itemCount: 6,
      average: 1.05
    }
  };

  return {
    childAge: 7,
    detectedRisk: "ADHD",
    secondaryRisk: "ASD",
    triageScores: {
      ADHD: 12,
      ASD: 9,
      ANXIETY: 5,
      DEPRESSION: 3,
      LEARNING: 6
    },
    triageRanking: [
      { domain: "ADHD", weightedSignal: 2.18 },
      { domain: "ASD", weightedSignal: 1.72 },
      { domain: "LEARNING", weightedSignal: 1.12 }
    ],
    specificScoring: {
      totalWeightedScore: 45.6,
      totalWeight: 30,
      normalizedAverage: 1.52,
      subdomains
    },
    specificProfile: {
      kind: "ADHD",
      severity: "moderate",
      normalizedAverage: 1.52,
      subdomains
    },
    resultSummary: {
      kind: "ADHD",
      normalizedAverage: 1.52,
      signal: {
        key: "moderate",
        hu: "közepes jelzésszint",
        en: "moderate signal level"
      },
      topSubdomains: Object.entries(subdomains).map(([key, value]) => ({
        key,
        average: value.average,
        itemCount: value.itemCount
      })),
      secondaryRisk: "ASD",
      triageScores: {
        ADHD: 12,
        ASD: 9,
        ANXIETY: 5,
        DEPRESSION: 3,
        LEARNING: 6
      },
      summaryText: {
        hu: "A legerősebb minta a figyelmi és végrehajtó viselkedéshez kapcsolódik.",
        en: "The strongest pattern relates to attention and executive functioning."
      }
    },
    questionnaireVersion: "pdf-smoke-v1"
  };
}

async function main() {
  console.log("\n=== PDF REPORT SMOKE ===");

  const polishedWording = polishHungarianReportWording(
    "A gyermek mindennapi m\u0171k\u00f6d\u00e9s\u00e9ben ez jelenhet meg. " +
      "A gyerek m\u0171k\u00f6d\u00e9se v\u00e1ltoz\u00f3. " +
      "A csal\u00e1di vagy iskolai m\u0171k\u00f6d\u00e9st \u00e9rdemben terheli. " +
      "A V\u00e9grehajt\u00f3 m\u0171k\u00f6d\u00e9s (executive functioning) szakmai kifejez\u00e9s.",
    "hu"
  );
  assert(
    !/gyermek mindennapi m\u0171k\u00f6d\u00e9s\u00e9ben/iu.test(polishedWording),
    `Child-facing wording should be localized: ${polishedWording}`
  );
  assert(
    !/gyerek m\u0171k\u00f6d\u00e9se/iu.test(polishedWording),
    `Colloquial child-facing wording should be localized: ${polishedWording}`
  );
  assert(
    polishedWording.includes("csal\u00e1di vagy iskolai mindennapokat \u00e9rdemben megnehez\u00edti"),
    `Everyday-impact wording should be natural: ${polishedWording}`
  );
  assert(
    !/v[e\u00e9]grehajt[o\u00f3] viselked[e\u00e9]s/iu.test(
      polishHungarianReportWording("A v\u00e9grehajt\u00f3 viselked\u00e9s ter\u00fclet\u00e9n.", "hu")
    ),
    "Executive functioning must retain its established professional term."
  );
  assert(
    /v\u00e9grehajt\u00f3 m\u0171k\u00f6d\u00e9s \(executive functioning\)/iu.test(polishedWording),
    `Established professional terms must remain unchanged: ${polishedWording}`
  );

  REPORT_SUBDOMAIN_KEYS.forEach((key) => {
    const label = formatProfessionalTerm(key, "hu", key);
    assert(label.includes("("), `Hungarian terminology should include English: ${key}.`);
    assert(!label.includes("_"), `Hungarian terminology must hide internal keys: ${key}.`);
  });

  const localizedTerminology = localizeHungarianReportTerminology(
    "Strengths and protective factors; executive_function; emotional regulation; Primary area of concern"
  );
  assert(
    localizedTerminology ===
      "Erősségek és védő tényezők (strengths and protective factors); " +
        "Végrehajtó működés (executive functioning); " +
        "Érzelmi szabályozás (emotional regulation); " +
        "Elsődleges figyelmet igénylő terület (primary area of concern)",
    `Terminology localization should be exact and non-nested: ${localizedTerminology}`
  );
  const localizedHungarianArticle = localizeHungarianReportTerminology(
    "A Primary area of concern több jelzéshez kapcsolódik."
  );
  assert(
    localizedHungarianArticle ===
      "Az elsődleges figyelmet igénylő terület (primary area of concern) több jelzéshez kapcsolódik.",
    `Hungarian article should agree with the localized phrase: ${localizedHungarianArticle}`
  );
  const localizedInlineTerms = localizeHungarianReportTerminology(
    "az executive_function és az emotional regulation területei"
  );
  assert(
    localizedInlineTerms ===
      "a végrehajtó működés (executive functioning) és az érzelmi szabályozás (emotional regulation) területei",
    `Inline Hungarian terminology should use natural articles and casing: ${localizedInlineTerms}`
  );

  const pdf = await generatePdfBuffer({
    name: "Teszt Szülő",
    reportText: buildSampleReportText(),
    lang: "hu",
    payload: buildSamplePayload()
  });

  assert(Buffer.isBuffer(pdf), "PDF output should be a Buffer.");
  assert(pdf.slice(0, 5).toString("latin1") === "%PDF-", "PDF should start with a PDF header.");
  assert(pdf.toString("latin1").includes("%%EOF"), "PDF should contain an EOF marker.");
  assert(pdf.length > 25000, `PDF output is unexpectedly small: ${pdf.length} bytes.`);

  const pages = countPdfPages(pdf);
  assert(pages >= 2, `PDF should contain at least 2 pages, found ${pages}.`);
  assert(pages <= 10, `PDF should not create excessive blank pages, found ${pages}.`);

  const stressPdf = await generatePdfBuffer({
    name: "Stressz Teszt",
    reportText: buildStressReportText(),
    lang: "hu",
    payload: buildSamplePayload()
  });

  const stressPages = countPdfPages(stressPdf);
  assert(Buffer.isBuffer(stressPdf), "Stress PDF output should be a Buffer.");
  assert(stressPdf.slice(0, 5).toString("latin1") === "%PDF-", "Stress PDF should start with a PDF header.");
  assert(stressPdf.toString("latin1").includes("%%EOF"), "Stress PDF should contain an EOF marker.");
  assert(stressPages >= pages, `Stress PDF should be at least as long as the base PDF, found ${stressPages} vs ${pages}.`);
  assert(stressPages <= 18, `Stress PDF should not create excessive blank pages, found ${stressPages}.`);

  const outputDir = String(process.env.PDF_SMOKE_OUTPUT_DIR || "").trim();
  if (outputDir) {
    const absoluteOutputDir = path.resolve(outputDir);
    fs.mkdirSync(absoluteOutputDir, { recursive: true });
    fs.writeFileSync(path.join(absoluteOutputDir, "sample-report.pdf"), pdf);
    fs.writeFileSync(path.join(absoluteOutputDir, "stress-report.pdf"), stressPdf);
    console.log("PDF smoke artifacts written.", { outputDir: absoluteOutputDir });
  }

  console.log("PDF report smoke passed.", {
    bytes: pdf.length,
    pages,
    stressBytes: stressPdf.length,
    stressPages
  });
}

main().catch((error) => {
  console.error("PDF report smoke failed:", error.message);
  process.exit(1);
});
