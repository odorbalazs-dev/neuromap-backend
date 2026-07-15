export const LEGACY_DOMAINS = [
  "ADHD",
  "ASD",
  "ANXIETY",
  "DEPRESSION",
  "LEARNING"
];

export const FOCUS_CODES = {
  ADHD: "ATTENTION_SELF_REGULATION",
  ASD: "SOCIAL_COMMUNICATION_FLEXIBILITY",
  ANXIETY: "WORRY_STRESS_RESPONSES",
  DEPRESSION: "MOOD_ENERGY_INTEREST",
  LEARNING: "LEARNING_PROCESSES"
};

const LEGACY_BY_FOCUS = Object.fromEntries(
  Object.entries(FOCUS_CODES).map(([legacyDomain, focusCode]) => [focusCode, legacyDomain])
);

const LABELS = {
  ATTENTION_SELF_REGULATION: {
    hu: "Figyelem es onszabalyozas",
    en: "Attention and self-regulation",
    de: "Aufmerksamkeit und Selbstregulation",
    it: "Attenzione e autoregolazione",
    es: "Atencion y autorregulacion",
    fr: "Attention et autoregulation",
    pt: "Atencao e autorregulacao",
    pl: "Uwaga i samoregulacja",
    zh: "注意力与自我调节",
    ja: "注意と自己調整",
    ar: "الانتباه والتنظيم الذاتي"
  },
  SOCIAL_COMMUNICATION_FLEXIBILITY: {
    hu: "Tarsas kommunikacio es rugalmassag",
    en: "Social communication and flexibility",
    de: "Soziale Kommunikation und Flexibilitat",
    it: "Comunicazione sociale e flessibilita",
    es: "Comunicacion social y flexibilidad",
    fr: "Communication sociale et flexibilite",
    pt: "Comunicacao social e flexibilidade",
    pl: "Komunikacja spoleczna i elastycznosc",
    zh: "社交沟通与灵活性",
    ja: "社会的コミュニケーションと柔軟性",
    ar: "التواصل الاجتماعي والمرونة"
  },
  WORRY_STRESS_RESPONSES: {
    hu: "Aggodalom es stresszreakciok",
    en: "Worry and stress responses",
    de: "Sorgen und Stressreaktionen",
    it: "Preoccupazione e risposte allo stress",
    es: "Preocupacion y respuestas al estres",
    fr: "Inquietude et reactions au stress",
    pt: "Preocupacao e respostas ao estresse",
    pl: "Niepokoj i reakcje na stres",
    zh: "担忧与压力反应",
    ja: "心配とストレス反応",
    ar: "القلق واستجابات الضغط"
  },
  MOOD_ENERGY_INTEREST: {
    hu: "Hangulat, energia es erdeklodes",
    en: "Mood, energy, and interest",
    de: "Stimmung, Energie und Interesse",
    it: "Umore, energia e interesse",
    es: "Estado de animo, energia e interes",
    fr: "Humeur, energie et interet",
    pt: "Humor, energia e interesse",
    pl: "Nastroj, energia i zainteresowanie",
    zh: "情绪、精力与兴趣",
    ja: "気分・活力・関心",
    ar: "المزاج والطاقة والاهتمام"
  },
  LEARNING_PROCESSES: {
    hu: "Tanulasi folyamatok",
    en: "Learning processes",
    de: "Lernprozesse",
    it: "Processi di apprendimento",
    es: "Procesos de aprendizaje",
    fr: "Processus d'apprentissage",
    pt: "Processos de aprendizagem",
    pl: "Procesy uczenia sie",
    zh: "学习过程",
    ja: "学習プロセス",
    ar: "عمليات التعلم"
  }
};

export const OBSERVATION_BANDS = ["limited", "noticeable", "recurring", "prominent"];

const BAND_LABELS = {
  limited: { hu: "ritkan megfigyelt", en: "infrequently observed" },
  noticeable: { hu: "eszreveheto", en: "noticeable" },
  recurring: { hu: "visszatero", en: "recurring" },
  prominent: { hu: "gyakran megfigyelt", en: "frequently observed" }
};

export function toFocusCode(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (LEGACY_BY_FOCUS[normalized]) return normalized;
  return FOCUS_CODES[normalized] || null;
}

export function toLegacyDomain(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (FOCUS_CODES[normalized]) return normalized;
  return LEGACY_BY_FOCUS[normalized] || null;
}

export function getFunctionalFocusLabel(value, lang = "en") {
  const focusCode = toFocusCode(value);
  const labels = LABELS[focusCode] || {};
  return labels[lang] || labels.en || focusCode || "Functional observation area";
}

export function getObservationBand(score) {
  const value = Number(score || 0);
  if (value >= 2.2) return "prominent";
  if (value >= 1.4) return "recurring";
  if (value >= 0.8) return "noticeable";
  return "limited";
}

export function getObservationBandLabel(band, lang = "en") {
  const labels = BAND_LABELS[band] || {};
  return labels[lang] || labels.en || band || "";
}
