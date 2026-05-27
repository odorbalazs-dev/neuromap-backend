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

function getReportSignals(payload = {}) {
  const profile = payload?.specificProfile || {};
  const scoring = payload?.specificScoring || {};
  const summary = payload?.resultSummary || {};

  const detectedRisk =
    payload?.detectedRisk ||
    profile?.kind ||
    summary?.kind ||
    "UNKNOWN";

  const secondaryRisk =
    payload?.secondaryRisk ||
    summary?.secondaryRisk ||
    null;

  const severity =
    profile?.severity ||
    summary?.signal?.key ||
    "unknown";

  const subdomainSource =
    summary?.topSubdomains ||
    Object.entries(scoring?.subdomains || profile?.subdomains || {}).map(([key, value]) => ({
      key,
      average: Number(value?.average || 0),
      itemCount: Number(value?.itemCount || 0)
    }));

  const topSubdomains = (Array.isArray(subdomainSource) ? subdomainSource : [])
    .map((item) => ({
      key: String(item?.key || "").trim(),
      average: Number(item?.average || 0),
      itemCount: Number(item?.itemCount || 0)
    }))
    .filter((item) => item.key)
    .sort((a, b) => b.average - a.average)
    .slice(0, 3);

  return {
    detectedRisk,
    secondaryRisk,
    severity,
    topSubdomains
  };
}

function getActionCopy(lang = "en") {
  const hu = {
    ADHD: {
      title: "Kovetkezo 7 nap: figyelmi es feladattartasi tamogatas",
      items: [
        "Valassz ki egyetlen visszatero rutint, es bontsd 3-5 lathato lepesre.",
        "Adj rovid instrukciot, majd kerj visszamondast: mi az elso kovetkezo lepes?",
        "Figyeld, hogy a nehezseg inkabb inditasnal, fenntartasnal, valtasnal vagy befejezesnel jelenik meg."
      ]
    },
    ASD: {
      title: "Kovetkezo 7 nap: kiszamithatosag es tarsas-szenzoros terheles",
      items: [
        "Jelolj ki egy nehez atmenetet, es adj elore lathato jelzest a valtas elott.",
        "Figyeld, hogy a reakciohoz tarsas bizonytalansag, szenzoros terheles vagy rutinvaltozas kapcsolodik-e.",
        "Hasznalj konkret, rovid mondatokat, es hagyj tobb feldolgozasi idot valasz vagy valtas elott."
      ]
    },
    ANXIETY: {
      title: "Kovetkezo 7 nap: aggodalom es elkerules finom kovetese",
      items: [
        "Jegyezd fel, mely helyzetekben no meg a feszultseg, es mi segit visszarendezodni.",
        "A megnyugtatas mellett probalj kis, biztonsagos lepest adni az elkerult helyzet fele.",
        "Figyeld a testi jeleket is: alvas, hasfajas, fejfajas, feszultseg vagy visszahuzodas."
      ]
    },
    DEPRESSION: {
      title: "Kovetkezo 7 nap: hangulat, energia es kapcsolodas",
      items: [
        "Naponta egyszer figyeld meg az energiaszintet, erdeklodest es kedvet egy rovid skalan.",
        "Tervezz be egy alacsony terhelesu, kapcsolodo tevekenyseget, ahol nem a teljesitmeny a cel.",
        "Ha a lehangoltsag, visszahuzodas vagy onertekelesi romlas erosodik, kerj szakmai segitseget."
      ]
    },
    LEARNING: {
      title: "Kovetkezo 7 nap: tanulasi helyzetek pontos szetvalasztasa",
      items: [
        "Valassz ki egy konkret feladattipust, ahol gyakran elakadas van: olvasas, iras, matek vagy instrukcio.",
        "Nezd meg, hogy a gond a megertesnel, emlekezetben tartasnal, tempoban vagy kivitelezesben jelenik meg.",
        "Kerj konkret pedagogusi peldat arrol, milyen formatum segit: rovidebb utasitas, vizualis minta vagy tobb ido."
      ]
    },
    UNKNOWN: {
      title: "Kovetkezo 7 nap: egyetlen minta tisztazasa",
      items: [
        "Valassz egy visszatero helyzetet, ahol a nehezseg jol megfigyelheto.",
        "Figyeld, mi tortenik elotte, mi tartja fenn, es mi segit visszarendezodni.",
        "A kovetkezo lepes legyen kicsi, merheto es eletkorhoz igazitott."
      ]
    }
  };

  const en = {
    ADHD: {
      title: "Next 7 days: support attention and task persistence",
      items: [
        "Choose one recurring routine and break it into 3-5 visible steps.",
        "Give a short instruction, then ask the child to repeat the first next step.",
        "Observe whether the difficulty appears most during starting, staying with, switching, or finishing a task."
      ]
    },
    ASD: {
      title: "Next 7 days: predictability and social-sensory load",
      items: [
        "Choose one difficult transition and give a visible warning before the change.",
        "Observe whether reactions are linked to social uncertainty, sensory load, or routine change.",
        "Use concrete short sentences and allow more processing time before a response or transition."
      ]
    },
    ANXIETY: {
      title: "Next 7 days: track worry and avoidance gently",
      items: [
        "Note which situations increase tension and what helps the child settle again.",
        "Alongside reassurance, offer one small safe step toward the avoided situation.",
        "Watch body signals too: sleep, stomachaches, headaches, tension, or withdrawal."
      ]
    },
    DEPRESSION: {
      title: "Next 7 days: mood, energy, and connection",
      items: [
        "Once a day, briefly track energy, interest, and mood on a simple scale.",
        "Plan one low-pressure connecting activity where performance is not the goal.",
        "If low mood, withdrawal, or negative self-view increases, seek qualified support."
      ]
    },
    LEARNING: {
      title: "Next 7 days: separate learning situations clearly",
      items: [
        "Choose one task type where the child often gets stuck: reading, writing, math, or instructions.",
        "Check whether the difficulty is in understanding, holding information, pace, or output.",
        "Ask educators for concrete examples of what helps: shorter instructions, visual models, or more time."
      ]
    },
    UNKNOWN: {
      title: "Next 7 days: clarify one recurring pattern",
      items: [
        "Choose one recurring situation where the difficulty is easy to observe.",
        "Watch what happens before it, what keeps it going, and what helps the child settle.",
        "Make the next step small, measurable, and age-appropriate."
      ]
    }
  };

  return lang === "hu" ? hu : en;
}

function formatFocusLabel(value = "") {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildObservationFocus(signals, lang = "en") {
  const areas = (signals.topSubdomains || [])
    .map((item) => formatFocusLabel(item.key))
    .filter(Boolean);

  if (lang === "hu") {
    if (!areas.length) {
      return "A kovetkezo heten azt erdemes figyelni, hogy a nehezseg mely helyzetekben erosodik, es mi segit a visszarendezodesben.";
    }

    return `A kovetkezo heten kulon figyeld ezeket a teruleteket: ${areas.join(", ")}. A cel nem cimkezes, hanem annak tisztazasa, milyen helyzetben es milyen tamogatassal valtozik a minta.`;
  }

  if (!areas.length) {
    return "Over the next week, observe where the difficulty becomes stronger and what helps the child settle or re-engage.";
  }

  return `Over the next week, pay special attention to these areas: ${areas.join(", ")}. The goal is not labeling, but understanding where the pattern changes and which supports help.`;
}

function buildEscalationNote(signals, lang = "en") {
  const severity = String(signals.severity || "").toLowerCase();
  const isHigh = severity === "high";
  const hasMoodRisk = signals.detectedRisk === "DEPRESSION" || signals.secondaryRisk === "DEPRESSION";

  if (lang === "hu") {
    if (isHigh || hasMoodRisk) {
      return "Ha a jelzes eros, tobb kornyezetben tartos, romlo onertekelest, visszahuzodast, eros szorongast vagy biztonsagi aggodalmat erint, ne csak megfigyelesben gondolkodj: erdemes szakemberrel egyeztetni.";
    }

    return "Ha a nehezseg tobb kornyezetben tartosan fennall, a csaladi vagy iskolai mukodest erdemben terheli, vagy a gyermek onbizalma csokken, szakember bevonasa segithet pontosabb kepet adni.";
  }

  if (isHigh || hasMoodRisk) {
    return "If the signal is strong, persistent across settings, or linked with declining confidence, withdrawal, intense anxiety, or safety concerns, do not rely on observation alone: consider qualified support.";
  }

  return "If the difficulty persists across settings, meaningfully affects family or school functioning, or the child's confidence declines, qualified support can help clarify the picture.";
}

export function buildReportV2Context(payload = {}, lang = "en") {
  const ageYears = extractChildAgeYears(payload);
  const ageBand = getAgeBand(ageYears);
  const copy = getCopy(lang);
  const bandCopy = copy[ageBand] || copy.unknown;
  const signals = getReportSignals(payload);
  const actionCopy = getActionCopy(lang);
  const domainAction = actionCopy[signals.detectedRisk] || actionCopy.UNKNOWN;

  return {
    version: "structured_report_v2",
    ageYears,
    ageBand,
    ageBandLabel: bandCopy.label,
    hasAge: ageYears !== null,
    interpretation: bandCopy.interpretation,
    recommendations: bandCopy.recommendations,
    primaryFocus: signals.detectedRisk,
    secondaryFocus: signals.secondaryRisk,
    severity: signals.severity,
    focusSubdomains: signals.topSubdomains,
    actionPlanTitle: domainAction.title,
    actionPlan: domainAction.items,
    observationFocus: buildObservationFocus(signals, lang),
    escalationNote: buildEscalationNote(signals, lang)
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
