const AGE_PATHS = [
  ["childAge"],
  ["child_age"],
  ["age"],
  ["ageYears"],
  ["age_years"],
  ["child", "age"],
  ["child", "ageYears"],
  ["child", "age_years"],
  ["profile", "age"],
  ["profile", "ageYears"],
  ["metadata", "age"],
  ["payload", "childAge"],
  ["payload", "age"]
];

const BIRTH_DATE_PATHS = [
  ["birthDate"],
  ["birth_date"],
  ["dateOfBirth"],
  ["date_of_birth"],
  ["dob"],
  ["child", "birthDate"],
  ["child", "dateOfBirth"],
  ["profile", "birthDate"],
  ["metadata", "birthDate"]
];

function readPath(source, path) {
  return path.reduce((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return current[key];
  }, source);
}

function normalizeAge(value) {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 && value < 25 ? value : null;
  }

  const text = String(value).trim().replace(",", ".");
  const match = text.match(/\d+(?:\.\d+)?/);
  if (!match) return null;

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) && parsed > 0 && parsed < 25 ? parsed : null;
}

function ageFromBirthDate(value, now = new Date()) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const diffMs = now.getTime() - date.getTime();
  if (diffMs <= 0) return null;

  const age = diffMs / (365.25 * 24 * 60 * 60 * 1000);
  return age > 0 && age < 25 ? Number(age.toFixed(1)) : null;
}

export function extractChildAgeYears(payload = {}) {
  for (const path of AGE_PATHS) {
    const age = normalizeAge(readPath(payload, path));
    if (age !== null) return age;
  }

  for (const path of BIRTH_DATE_PATHS) {
    const age = ageFromBirthDate(readPath(payload, path));
    if (age !== null) return age;
  }

  return null;
}

export function getAgeBand(ageYears) {
  const age = normalizeAge(ageYears);

  if (age === null) return "unknown";
  if (age < 3) return "under_three";
  if (age < 6) return "preschool";
  if (age < 9) return "early_school";
  if (age < 13) return "middle_school";
  if (age < 18) return "teen";
  return "older";
}

function getCopy(lang = "en") {
  const hu = {
    unknown: {
      label: "Korosztaly nincs megadva",
      interpretation:
        "A gyermek eletkora nincs kulon megadva, ezert a riport a valaszok mintazatat altalanos fejlodesi es csaladi mukodesi keretben ertelmezi.",
      recommendations: [
        "A javaslatokat az eletkornak megfelelo elvarasokhoz erdemes igazitani.",
        "Figyeld, hogy a nehezseg tobb helyzetben is megjelenik-e, vagy inkabb egy adott rutin, terheles vagy kornyezet valtja ki.",
        "Ha kesobb bekerul a gyermek eletkora, a riport pontosabb korosztalyi hangsulyokat tud adni."
      ]
    },
    under_three: {
      label: "3 ev alatti korosztaly",
      interpretation:
        "Ebben az eletkorban a figyelem, erzelemszabalyozas, valtasokhoz valo alkalmazkodas es kommunikacio meg gyorsan fejlodik, ezert a mintazatot kulonosen ovatosan kell ertelmezni.",
      recommendations: [
        "Rovid, kiszamithato rutinokat es sok erzelmi megnyugtatast erdemes hasznalni.",
        "A nagyobb kovetelmenyek helyett a ritmust, alvast, atmeneteket es szenzoros terhelest figyeld.",
        "Tartos, eros vagy tobb teruletet erinto aggodalom eseten gyermekorvosi vagy korai fejlesztesi konzultacio lehet hasznos."
      ]
    },
    preschool: {
      label: "Ovoda elotti/ovodas korosztaly",
      interpretation:
        "Ovoda korul a figyelem, impulzuskontroll, rugalmassag, tarsas jelzesek es erzelmi szabalyzas meg erosen helyzetfuggo lehet. Fontos kulonbseget tenni az eletkori eretlenseg es a tartos, tobb helyzetben is visszatero minta kozott.",
      recommendations: [
        "A legjobban a rovid instrukcio, vizualis rutin, elore jelzett valtas es nyugodt felnott szabalyzas segithet.",
        "Ertekes megfigyelni, hogy a nehezseg jatekban, etkezesnel, oltozesnel, elvalasnal vagy csoporthelyzetben erosebb-e.",
        "Az ovodai visszajelzest konkret helyzetekrol erdemes kerni, nem altalanos cimkekrol."
      ]
    },
    early_school: {
      label: "Kisiskolas korosztaly",
      interpretation:
        "Kisiskolas korban a feladattartas, szabalykovetes, kortars helyzetek, tanulasi terheles es onallosodo rutinok jobban lathatova teszik a mintazatokat.",
      recommendations: [
        "A feladatokat rovid, lathato lepesekre erdemes bontani, es ellenorizni, hogy a gyermek tenyleg ertette-e a kovetkezo lepest.",
        "Hasznos lehet kulon figyelni a reggeli rutinra, hazifeladatra, iskolai atmenetekre es kortars helyzetekre.",
        "A tanitoval konkret tamogatasrol erdemes egyeztetni: instrukcio roviditese, vizualis lista, nyugodt hely, elore jelzett valtas."
      ]
    },
    middle_school: {
      label: "Felsos/korai serdulo korosztaly",
      interpretation:
        "Ebben a szakaszban a tervezes, terheleskezeles, kortars kapcsolatok, onertekeles es teljesitmenynyomas nagyobb szerepet kap, ezert a nehezsegek gyakran osszetettebben jelennek meg.",
      recommendations: [
        "A cel ne csak a tobb ellenorzes legyen, hanem kozos tervezes, priorizalas es terhelheto rutin kialakitasa.",
        "Figyeld, hogy a nehezseg inkabb szervezesben, teljesitmenyszorongasban, kortars helyzetekben vagy energiaszintben jelentkezik-e.",
        "A gyermeket erdemes bevonni a megoldasokba, mert ebben a korban az autonomiat tiszteletben tarto tamogatas hatekonyabb."
      ]
    },
    teen: {
      label: "Serdulo korosztaly",
      interpretation:
        "Serduloknel a mintazatok gyakran belso feszultsegben, kimerulesben, elkerulesben, teljesitmenyromlasban vagy kapcsolati terhelesben latszanak, nem mindig nyilt viselkedesben.",
      recommendations: [
        "A beszelgetes legyen partneri: kevesebb kioktatas, tobb kozos problemafeltaras es konkret tervezes.",
        "Fontos figyelni az alvasra, energiaszintre, onertekelesre, iskolai terhelesre es elkerulesre.",
        "Tartos hangulati romlas, eros szorongas, visszahuzodas vagy biztonsagi aggodalom eseten szakember bevonasa kulonosen fontos."
      ]
    },
    older: {
      label: "Idosebb serdulo/fiatal felnott korosztaly",
      interpretation:
        "Ebben az eletkorban a mindennapi onallosag, tanulasi vagy munkaszervezes, kapcsolatok es mentalis terheles szempontjabol erdemes ertelmezni a mintazatot.",
      recommendations: [
        "A tamogatas a sajat celokhoz, onmonitorozashoz es fenntarthato rutinokhoz kapcsolodjon.",
        "Ertekes lehet megfigyelni, mely helyzetekben romlik leginkabb a teljesitmeny vagy kozerzet.",
        "Ha a nehezseg tartosan rontja a mukodest, szakemberrel valo konzultacio segithet pontosabb keretet adni."
      ]
    }
  };

  const en = {
    unknown: {
      label: "Age group not provided",
      interpretation:
        "The child's age was not provided separately, so the report interprets the answer pattern within a general developmental and family-functioning frame.",
      recommendations: [
        "Adapt the recommendations to age-appropriate expectations.",
        "Observe whether the difficulty appears across several settings or mainly around one routine, load, or environment.",
        "If age is added later, the report can give more precise developmental emphasis."
      ]
    },
    under_three: {
      label: "Under 3 years",
      interpretation:
        "At this age, attention, regulation, transitions, and communication are still developing rapidly, so the pattern should be interpreted very cautiously.",
      recommendations: [
        "Use short predictable routines and frequent emotional co-regulation.",
        "Look first at rhythm, sleep, transitions, and sensory load rather than high expectations.",
        "If concerns are persistent or broad, pediatric or early-development consultation may be useful."
      ]
    },
    preschool: {
      label: "Preschool age",
      interpretation:
        "Around preschool age, attention, impulse control, flexibility, social signals, and emotion regulation may still vary strongly by situation.",
      recommendations: [
        "Use short instructions, visual routines, advance transition cues, and calm adult co-regulation.",
        "Observe whether the difficulty is strongest during play, meals, dressing, separation, or group settings.",
        "Ask daycare or preschool adults for concrete situation-based feedback, not broad labels."
      ]
    },
    early_school: {
      label: "Early school age",
      interpretation:
        "At early school age, task persistence, rules, peer situations, learning load, and more independent routines can make patterns more visible.",
      recommendations: [
        "Break tasks into short visible steps and check that the next step is truly understood.",
        "Pay attention to morning routines, homework, school transitions, and peer situations.",
        "Discuss concrete supports with teachers, such as shorter instructions, visual lists, calm placement, or transition warnings."
      ]
    },
    middle_school: {
      label: "Middle school / early adolescence",
      interpretation:
        "Planning, load management, peer relationships, self-esteem, and performance pressure become more important, so difficulties can look more layered.",
      recommendations: [
        "Aim for shared planning and prioritizing, not only more checking.",
        "Observe whether the difficulty is strongest in organization, performance pressure, peer situations, or energy level.",
        "Involve the child in choosing supports because autonomy-respecting help is usually more effective at this age."
      ]
    },
    teen: {
      label: "Adolescence",
      interpretation:
        "In adolescence, patterns may appear as internal tension, exhaustion, avoidance, performance decline, or relationship strain rather than obvious behavior.",
      recommendations: [
        "Use a collaborative tone: less lecturing, more joint problem-solving and concrete planning.",
        "Watch sleep, energy, self-view, school load, withdrawal, and avoidance.",
        "Persistent low mood, strong anxiety, withdrawal, or safety concerns should prompt qualified support."
      ]
    },
    older: {
      label: "Older teen / young adult",
      interpretation:
        "At this age, the pattern is best interpreted through daily independence, study or work organization, relationships, and mental load.",
      recommendations: [
        "Connect support to personal goals, self-monitoring, and sustainable routines.",
        "Observe which situations most affect performance or wellbeing.",
        "If functioning is persistently affected, professional consultation can help clarify the pattern."
      ]
    }
  };

  return lang === "hu" ? hu : en;
}

export function buildReportV2Context(payload = {}, lang = "en") {
  const ageYears = extractChildAgeYears(payload);
  const ageBand = getAgeBand(ageYears);
  const copy = getCopy(lang);
  const bandCopy = copy[ageBand] || copy.unknown;

  return {
    version: "structured_report_v2",
    ageYears,
    ageBand,
    ageBandLabel: bandCopy.label,
    hasAge: ageYears !== null,
    interpretation: bandCopy.interpretation,
    recommendations: bandCopy.recommendations
  };
}

export function buildReportV2PromptContext(payload = {}, lang = "en") {
  const context = buildReportV2Context(payload, lang);

  return {
    ...context,
    instruction:
      context.hasAge
        ? "Use this age band to make section 6 and the practical recommendations developmentally specific. Do not overstate age precision."
        : "Age is missing. Do not infer exact age. Include a short age-missing caveat and keep developmental advice adaptable."
  };
}

export function buildReportV2EmailContext(payload = {}, lang = "en") {
  const context = buildReportV2Context(payload, lang);

  return {
    ...context,
    title: lang === "hu" ? "Korosztalyi ertelmezes" : "Age-group interpretation",
    recommendationTitle: lang === "hu" ? "Korosztalyi javaslatok" : "Age-aware recommendations"
  };
}
