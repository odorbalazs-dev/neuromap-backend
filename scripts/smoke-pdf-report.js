import { generatePdfBuffer } from "../src/services/pdf.service.js";

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
      "### 1. Rovid nyito osszefoglalo",
      "A valaszok alapjan a legerosebb jelzes a figyelmi onszabalyozas, a feladattartas es a vegrehajto mukodes teruleten jelenik meg. Ez nem diagnosztikus megallapitas, hanem egy strukturalt eloszuresi kep, amely segit abban, hogy a szulo lassa, mely helyzetekben erdemes tovabb figyelni a gyermek mindennapi mukodeset."
    ],
    [
      "2. Fo megfigyelt mintazatok",
      "A profilban visszatero elem, hogy a gyermek teljesitmenye hullamzo lehet akkor is, amikor a feladatot alapvetoen megerti. A nehezseg gyakran nem a kepesseg hianyabol, hanem a figyelmi terhelesbol, a valtasokbol, a frusztracio gyors emelkedesebol vagy a feladat befejezesenek nehezsegebol ered. Ez kulonosen akkor lathato, amikor sok inger, idonyomas vagy tobb lepesbol allo elvaras jelenik meg egyszerre."
    ],
    [
      "3. Mindennapi helyzetekben varhato megjelenes",
      "Otthoni helyzetben ez gyakran ugy jelenhet meg, hogy a gyermek elkezd egy tevekenyseget, de kozben mas inger elviszi a figyelmet. Tanulasi vagy ovodai-iskolai helyzetben nagyobb lehet a kulonbseg a rovid, egyertelmu feladatok es a hosszan fenntartott figyelmet igenylo feladatok kozott. A szulo szamara fontos jelzes, hogy a nehezseg nem minden pillanatban latszik egyforman, ezert a jo napok nem zarjak ki a valos terhelest."
    ],
    [
      "4. Erossegek es vedo tenyezok",
      "A kerdoiv mintazata alapjan kulon figyelmet erdemelnek azok a helyzetek, ahol a gyermek erdeklodese, mozgasigenye vagy vizualis tamogatasa segiti a jobb teljesitmenyt. Ha a feladat rovidebb lepesekre bonthato, ha elore lathato a kovetkezo lepes, es ha a gyermek kap eleg idot a valtasra, a mukodes gyakran rendezettebb lehet."
    ],
    [
      "5. Szuloi tamogatasi iranyok",
      "A legfontosabb tamogatasi irany nem a tobb figyelmeztetes, hanem a kornyezet okosabb strukturaja.\n- Hasznos lehet a rovid, egyertelmu instrukcio.\n- A vizualis lista segitheti a feladatkezdest.\n- A befejezes elott adott konkret visszajelzes csokkentheti az elakadast.\nA cel az, hogy a gyermek ne csak hallja, mit kell tennie, hanem lassa es kovetni is tudja a folyamatot."
    ],
    [
      "6. Erzelmi es viselkedesi kovetkezmenyek",
      "Ha a gyermek sokszor tapasztalja meg, hogy nem sikerul idoben befejeznie vagy kovetnie a feladatot, masodlagosan frusztracio, elkerules vagy onertekelesi bizonytalansag is kialakulhat. Ezert erdemes a viselkedest nem pusztan engedetlensegkent ertelmezni, hanem azt is megnezni, milyen terheles elozi meg a reakciot."
    ],
    [
      "7. Kommunikacio az ovodaval vagy iskolaval",
      "A pedagogusok fele erdemes konkret helyzeteket megfogalmazni: mikor romlik a figyelem, mi segit, hogyan reagal a gyermek valtasnal, es milyen feladatformatumban teljesit jobban. A leghasznosabb visszajelzes nem altalanos cimke, hanem megfigyelheto viselkedesek listaja."
    ],
    [
      "8. Mikor erdemes szakemberhez fordulni",
      "Ha a nehezsegek tobb kornyezetben, tartosan es a mindennapi mukodest erdemben befolyasolva jelennek meg, erdemes gyermekpszichologus, gyermekpszichiater, gyogypedagogus vagy fejleszto szakember bevonasat megfontolni. Kulonosen fontos ez akkor, ha a gyermek onbizalma csokken, gyakori a konfliktus, vagy a csaladi elet jelentos terheles ala kerul."
    ],
    [
      "9. Kovetkezo harminc nap javasolt fokusza",
      "A kovetkezo idoszakban erdemes egyetlen, jol korulhatarolt celra fokuszalni. Peldaul a reggeli keszulodes, a hazi feladat elkezdese vagy az esti rutin lehet olyan terulet, ahol a struktura merhetoen segithet. A tul sok egyszerre bevezetett valtoztatas gyakran csokkenti a kovetkezetesseget."
    ],
    [
      "10. Mit ne vonjunk le kovetkezteteskent",
      "A riport alapjan nem mondhato ki diagnozis, es nem kovetkezik belole, hogy a gyermek kepessegei gyengek. A mintazat inkabb arra utal, hogy bizonyos onszabalyozasi es figyelmi feltetelek mellett a teljesitmeny erosen valtozhat. Ez a kulonbseg sokszor jol tamogathato, ha a kornyezet megfeleloen alkalmazkodik."
    ],
    [
      "11. Zaro megjegyzes",
      "**Fontos:** ez az anyag tajekoztato jellegu. A pontos ertelmezeshez a gyermek eletkora, fejlodestortenete, csaladi helyzete, ovodai vagy iskolai visszajelzesei, valamint szemelyes szakemberi vizsgalat is szukseges. --- A riport celja, hogy a szulo rendezettebb kepet kapjon, es magabiztosabban tudja megtenni a kovetkezo lepest."
    ]
  ];

  return sections.map(([title, body]) => `${title}\n\n${body}`).join("\n\n");
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
        hu: "kozepes jelzesszint",
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
        hu: "A legerosebb minta a figyelmi es vegrehajto mukodeshez kapcsolodik.",
        en: "The strongest pattern relates to attention and executive functioning."
      }
    },
    questionnaireVersion: "pdf-smoke-v1"
  };
}

async function main() {
  console.log("\n=== PDF REPORT SMOKE ===");

  const pdf = await generatePdfBuffer({
    name: "Teszt Szulo",
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

  console.log("PDF report smoke passed.", {
    bytes: pdf.length,
    pages
  });
}

main().catch((error) => {
  console.error("PDF report smoke failed:", error.message);
  process.exit(1);
});
