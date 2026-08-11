const TERM_DEFINITIONS = {
  academic_expression_output: ["Tanulmányi kifejezés és teljesítmény", "academic expression and output"],
  academic_performance: ["Tanulmányi teljesítmény", "academic performance"],
  anhedonia_interest_loss: ["Öröm- és érdeklődéscsökkenés", "anhedonia and interest loss"],
  appetite_body_change: ["Étvágy- és testi változások", "appetite and body change"],
  attention_focus: ["Figyelmi fókusz", "attention focus"],
  attention_regulation: ["Figyelemszabályozás", "attention regulation"],
  avoidance: ["Elkerülés", "avoidance"],
  avoidance_safety: ["Elkerülés és biztonságkeresés", "avoidance and safety seeking"],
  burdensomeness_dark_thoughts: ["Tehernek érzés és sötét gondolatok", "perceived burdensomeness and dark thoughts"],
  cognitive_flexibility: ["Gondolkodási rugalmasság", "cognitive flexibility"],
  comprehension_language: ["Nyelvi megértés", "language comprehension"],
  concentration_decision: ["Koncentráció és döntéshozatal", "concentration and decision-making"],
  concentration_sleep: ["Koncentráció és alvás", "concentration and sleep"],
  emotional: ["Érzelmi szabályozás", "emotional regulation"],
  emotional_regulation: ["Érzelmi szabályozás", "emotional regulation"],
  energy_fatigue: ["Energiaszint és fáradtság", "energy and fatigue"],
  energy_motivation: ["Energiaszint és motiváció", "energy and motivation"],
  environmental_regulation: ["Környezeti alkalmazkodás és önszabályozás", "environmental regulation"],
  executive: ["Végrehajtó működés", "executive functioning"],
  executive_function: ["Végrehajtó működés", "executive functioning"],
  flexibility: ["Rugalmas alkalmazkodás", "flexibility"],
  general_worry: ["Általános aggodalmaskodás", "general worry"],
  hopelessness_future: ["Reménytelenség és jövőkép", "hopelessness and future outlook"],
  hyperactivity: ["Fokozott aktivitás", "hyperactivity"],
  impulse_control: ["Impulzuskontroll", "impulse control"],
  impulsivity: ["Impulzivitás", "impulsivity"],
  inattention: ["Figyelmi nehézségek", "inattention"],
  instruction_understanding: ["Instrukciók megértése", "instruction understanding"],
  interest_loss: ["Érdeklődéscsökkenés", "interest loss"],
  intolerance_of_uncertainty: ["A bizonytalanság nehéz viselése", "intolerance of uncertainty"],
  learning_strategy: ["Tanulási stratégia", "learning strategy"],
  low_mood: ["Lehangoltság", "low mood"],
  math: ["Matematikai készségek", "mathematical skills"],
  meaning_motivation: ["Értelemadás és motiváció", "meaning and motivation"],
  motivation_persistence: ["Motiváció és kitartás", "motivation and persistence"],
  nonverbal_communication: ["Nem verbális kommunikáció", "nonverbal communication"],
  organization_time_management: ["Szervezés és időgazdálkodás", "organization and time management"],
  physical_arousal: ["Testi feszültségi reakciók", "physical arousal"],
  pragmatic_language: ["Társas nyelvhasználat", "pragmatic language"],
  processing_speed: ["Feldolgozási sebesség", "processing speed"],
  psychomotor_change: ["Pszichomotoros változások", "psychomotor change"],
  reading: ["Olvasási készségek", "reading skills"],
  reassurance_control: ["Megnyugtatásigény és kontrollkeresés", "reassurance seeking and control"],
  relationships: ["Kapcsolati készségek", "relationship skills"],
  restlessness_tension: ["Nyugtalanság és feszültség", "restlessness and tension"],
  restricted_patterns: ["Rugalmatlan vagy ismétlődő mintázatok", "restricted and repetitive patterns"],
  self_monitoring_error_awareness: ["Önellenőrzés és hibafelismerés", "self-monitoring and error awareness"],
  self_worth: ["Önértékelés", "self-worth"],
  self_worth_guilt: ["Önértékelés és bűntudat", "self-worth and guilt"],
  sensory_processing: ["Szenzoros feldolgozás", "sensory processing"],
  sleep_change: ["Alvásváltozások", "sleep change"],
  social_communication: ["Társas kommunikáció", "social communication"],
  social_evaluative_anxiety: ["Társas megítéléssel kapcsolatos szorongás", "social-evaluative anxiety"],
  social_reciprocity: ["Társas kölcsönösség", "social reciprocity"],
  task_completion: ["Feladatok befejezése", "task completion"],
  uncertainty_stress: ["Bizonytalansághoz kapcsolódó stressz", "uncertainty-related stress"],
  withdrawal_isolation: ["Visszahúzódás és elszigetelődés", "withdrawal and isolation"],
  working_memory: ["Munkamemória", "working memory"],
  writing: ["Írási készségek", "writing skills"]
};

export const REPORT_PROFESSIONAL_TERMS = Object.freeze(
  Object.fromEntries(
    Object.entries(TERM_DEFINITIONS).map(([key, [hu, en]]) => [
      key,
      Object.freeze({ hu, en })
    ])
  )
);

export const REPORT_SUBDOMAIN_KEYS = Object.freeze(Object.keys(REPORT_PROFESSIONAL_TERMS));

const DOMAIN_TERMS = Object.freeze({
  ADHD: {
    hu: "Figyelmi és aktivitásszabályozási terület",
    en: "ADHD-related attention and activity regulation"
  },
  ASD: {
    hu: "Autizmus spektrumhoz kapcsolódó terület",
    en: "autism spectrum-related area"
  },
  ANXIETY: {
    hu: "Szorongásos terület",
    en: "anxiety-related area"
  },
  DEPRESSION: {
    hu: "Hangulati és motivációs terület",
    en: "mood and motivation area"
  },
  LEARNING: {
    hu: "Tanulási profil",
    en: "learning profile"
  }
});

const HEADING_TRANSLATIONS = Object.freeze([
  ["Short opening summary", "Rövid nyitó összefoglaló", "short opening summary"],
  ["Main observed patterns", "Fő megfigyelt mintázatok", "main observed patterns"],
  ["Primary area of concern", "Elsődleges figyelmet igénylő terület", "primary area of concern"],
  ["Secondary or overlapping signals", "Másodlagos vagy átfedő jelzések", "secondary or overlapping signals"],
  ["Possible impact on everyday life", "Lehetséges hatás a mindennapi életre", "possible impact on everyday life"],
  ["Developmental, age-group, and contextual interpretation", "Fejlődési, korosztályi és kontextuális értelmezés", "developmental, age-group, and contextual interpretation"],
  ["Strengths and protective factors", "Erősségek és védő tényezők", "strengths and protective factors"],
  ["Practical recommendations for parents", "Gyakorlati javaslatok szülőknek", "practical recommendations for parents"],
  ["Suggested next 30 days", "Javasolt következő 30 nap", "suggested next 30 days"],
  ["When professional support may be useful", "Mikor lehet hasznos szakember támogatása?", "when professional support may be useful"],
  ["Important limitation and disclaimer", "Fontos korlátok és tájékoztatás", "important limitation and disclaimer"],
  ["Protective factors", "Védő tényezők", "protective factors"],
  ["Areas of concern", "Figyelmet igénylő területek", "areas of concern"],
  ["Areas of strength", "Erősségterületek", "areas of strength"],
  ["Main strengths", "Fő erősségek", "main strengths"],
  ["Main difficulties", "Fő nehézségek", "main difficulties"]
]);

const EXTRA_ENGLISH_ALIASES = Object.freeze({
  "executive function": "executive_function",
  "executive functioning": "executive_function",
  "attention difficulties": "inattention",
  "emotion regulation": "emotional_regulation",
  "emotional regulation": "emotional_regulation",
  "reassurance seeking": "reassurance_control",
  "restricted patterns": "restricted_patterns",
  "social evaluative anxiety": "social_evaluative_anxiety"
});

function normalizeKey(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function humanize(value = "") {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function bilingual(hu, en) {
  return `${hu} (${en})`;
}

function lowercaseFirstLetter(value = "") {
  return String(value).replace(/\p{L}/u, (letter) => letter.toLocaleLowerCase("hu"));
}

function normalizeHungarianArticleBeforeLabel(value, hu, en) {
  const label = bilingual(hu, en);
  const pattern = new RegExp(`\\b(a|az)\\s+${escapeRegExp(label)}`, "giu");
  const needsAz = /^[aáeéiíoóöőuúüű]/iu.test(hu);

  return value.replace(pattern, (match) => {
    const sentenceCaseArticle = match[0] === match[0].toLocaleUpperCase("hu");
    let article = needsAz ? "az" : "a";

    if (sentenceCaseArticle) {
      article = article[0].toLocaleUpperCase("hu") + article.slice(1);
    }

    return `${article} ${lowercaseFirstLetter(hu)} (${en})`;
  });
}

export function formatProfessionalTerm(key, lang = "en", fallback = "") {
  const normalized = normalizeKey(key);
  const term = REPORT_PROFESSIONAL_TERMS[normalized];

  if (term) {
    return lang === "hu" ? bilingual(term.hu, term.en) : term.en;
  }

  return humanize(fallback || key);
}

export function formatReportDomain(domain, lang = "en", fallback = "") {
  const normalized = String(domain || "").trim().toUpperCase();
  const term = DOMAIN_TERMS[normalized];

  if (term) {
    return lang === "hu" ? bilingual(term.hu, term.en) : term.en;
  }

  return humanize(fallback || domain);
}

function replaceEnglishPhrase(value, englishPhrase, replacement) {
  const regex = new RegExp(`\\b${escapeRegExp(englishPhrase)}\\b`, "giu");

  return value.replace(regex, (match, offset, source) => {
    const prefix = source.slice(0, offset);
    const insideParentheses = prefix.lastIndexOf("(") > prefix.lastIndexOf(")");
    return insideParentheses ? match : replacement;
  });
}

export function localizeHungarianReportTerminology(value = "") {
  let output = String(value || "");

  HEADING_TRANSLATIONS.forEach(([english, hu, canonicalEnglish]) => {
    output = replaceEnglishPhrase(output, english, bilingual(hu, canonicalEnglish));
  });

  const aliases = [
    ...Object.entries(EXTRA_ENGLISH_ALIASES),
    ...Object.entries(REPORT_PROFESSIONAL_TERMS).map(([key, term]) => [term.en, key])
  ].sort(([left], [right]) => right.length - left.length);

  aliases.forEach(([english, key]) => {
    const term = REPORT_PROFESSIONAL_TERMS[key];
    if (!term) return;
    output = replaceEnglishPhrase(output, english, bilingual(term.hu, term.en));
  });

  Object.entries(REPORT_PROFESSIONAL_TERMS)
    .sort(([left], [right]) => right.length - left.length)
    .forEach(([key, term]) => {
      output = replaceEnglishPhrase(output, key, bilingual(term.hu, term.en));
    });

  HEADING_TRANSLATIONS.forEach(([, hu, canonicalEnglish]) => {
    output = normalizeHungarianArticleBeforeLabel(output, hu, canonicalEnglish);
  });

  Object.values(REPORT_PROFESSIONAL_TERMS).forEach((term) => {
    output = normalizeHungarianArticleBeforeLabel(output, term.hu, term.en);
  });

  return output;
}
