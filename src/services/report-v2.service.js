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

const LANG_COPY = {
  hu: {
    emailTitle: "Korosztályi értelmezés",
    emailRecommendationTitle: "Korosztályi javaslatok",
    promptWithAge:
      "A korosztályi mezőt használd a 6. rész és a gyakorlati javaslatok finomítására. Ne állíts túlzott korosztályi pontosságot.",
    promptWithoutAge:
      "Az életkor hiányzik. Ne következtess pontos életkorra; röviden jelezd a korosztályi bizonytalanságot, és adaptálható tanácsokat adj.",
    observationEmpty:
      "A következő héten azt érdemes figyelni, hogy a nehézség mely helyzetekben erősödik, és mi segít a visszarendeződésben.",
    observationWithAreas:
      "A következő héten külön figyeld ezeket a területeket: {areas}. A cél nem címkézés, hanem annak tisztázása, milyen helyzetben és milyen támogatással változik a minta.",
    escalationHigh:
      "Ha a jelzés erős, több környezetben tartós, romló önértékelést, visszahúzódást, erős szorongást vagy biztonsági aggodalmat érint, ne csak megfigyelésben gondolkodj: érdemes szakemberrel egyeztetni.",
    escalationDefault:
      "Ha a nehézség több környezetben tartósan fennáll, a családi vagy iskolai működést érdemben terheli, vagy a gyermek önbizalma csökken, szakember bevonása segíthet pontosabb képet adni."
  },
  en: {
    emailTitle: "Age-group interpretation",
    emailRecommendationTitle: "Age-aware recommendations",
    promptWithAge:
      "Use this age band to make section 6 and the practical recommendations developmentally specific. Do not overstate age precision.",
    promptWithoutAge:
      "Age is missing. Do not infer exact age. Include a short age-missing caveat and keep developmental advice adaptable.",
    observationEmpty:
      "Over the next week, observe where the difficulty becomes stronger and what helps the child settle or re-engage.",
    observationWithAreas:
      "Over the next week, pay special attention to these areas: {areas}. The goal is not labeling, but understanding where the pattern changes and which supports help.",
    escalationHigh:
      "If the signal is strong, persistent across settings, or linked with declining confidence, withdrawal, intense anxiety, or safety concerns, do not rely on observation alone: consider qualified support.",
    escalationDefault:
      "If the difficulty persists across settings, meaningfully affects family or school functioning, or the child's confidence declines, qualified support can help clarify the picture."
  },
  de: {
    emailTitle: "Altersbezogene Einordnung",
    emailRecommendationTitle: "Altersgerechte Empfehlungen",
    promptWithAge:
      "Nutze die Altersgruppe, um Abschnitt 6 und die praktischen Empfehlungen entwicklungsbezogen zu formulieren.",
    promptWithoutAge:
      "Das Alter fehlt. Leite kein genaues Alter ab und formuliere die Empfehlungen flexibel.",
    observationEmpty:
      "Beobachte in der nächsten Woche, in welchen Situationen die Schwierigkeit stärker wird und was beim Beruhigen oder Wiedereinstieg hilft.",
    observationWithAreas:
      "Achte in der nächsten Woche besonders auf diese Bereiche: {areas}. Ziel ist nicht eine Etikettierung, sondern ein besseres Verständnis hilfreicher Unterstützung.",
    escalationHigh:
      "Wenn das Signal stark, anhaltend oder mit Rückzug, sinkendem Selbstwert, starker Angst oder Sicherheitsbedenken verbunden ist, sollte fachliche Unterstützung einbezogen werden.",
    escalationDefault:
      "Wenn die Schwierigkeit mehrere Lebensbereiche belastet oder das Selbstvertrauen sinkt, kann fachliche Beratung helfen."
  },
  it: {
    emailTitle: "Interpretazione per fascia d'età",
    emailRecommendationTitle: "Suggerimenti adatti all'età",
    promptWithAge:
      "Usa la fascia d'età per rendere più mirate la sezione 6 e le raccomandazioni pratiche.",
    promptWithoutAge:
      "L'età manca. Non dedurre un'età precisa e mantieni i consigli adattabili.",
    observationEmpty:
      "Nella prossima settimana osserva dove la difficoltà aumenta e cosa aiuta il bambino a calmarsi o riprendere.",
    observationWithAreas:
      "Nella prossima settimana presta attenzione a queste aree: {areas}. L'obiettivo non è etichettare, ma capire quali sostegni aiutano.",
    escalationHigh:
      "Se il segnale è forte, persistente o legato a ritiro, ansia intensa, calo dell'autostima o preoccupazioni di sicurezza, valuta un supporto qualificato.",
    escalationDefault:
      "Se la difficoltà persiste in più contesti o pesa sulla vita familiare o scolastica, un confronto professionale può chiarire il quadro."
  },
  es: {
    emailTitle: "Interpretación por edad",
    emailRecommendationTitle: "Recomendaciones ajustadas a la edad",
    promptWithAge:
      "Usa la franja de edad para hacer más específicas la sección 6 y las recomendaciones prácticas.",
    promptWithoutAge:
      "Falta la edad. No infieras una edad exacta y mantén las recomendaciones adaptables.",
    observationEmpty:
      "Durante la próxima semana observa en qué situaciones aumenta la dificultad y qué ayuda al niño a regularse.",
    observationWithAreas:
      "Durante la próxima semana presta atención a estas áreas: {areas}. El objetivo no es etiquetar, sino entender qué apoyos ayudan.",
    escalationHigh:
      "Si la señal es fuerte, persistente o se relaciona con retraimiento, baja autoestima, ansiedad intensa o dudas de seguridad, conviene consultar a un profesional.",
    escalationDefault:
      "Si la dificultad persiste en varios contextos o afecta la vida familiar o escolar, una consulta profesional puede aportar claridad."
  },
  zh: {
    emailTitle: "按年龄阶段解读",
    emailRecommendationTitle: "符合年龄特点的建议",
    promptWithAge:
      "请根据年龄阶段，让第 6 部分和实践建议更符合儿童的发展水平。",
    promptWithoutAge:
      "未提供年龄。不要推断具体年龄，建议应保持可调整。",
    observationEmpty:
      "接下来一周，观察哪些情境会让困难加重，以及什么能帮助孩子重新稳定下来。",
    observationWithAreas:
      "接下来一周，请特别留意这些方面：{areas}。目标不是贴标签，而是理解哪些支持真正有帮助。",
    escalationHigh:
      "如果信号强烈、持续存在，或伴随退缩、自信下降、明显焦虑或安全担忧，建议寻求专业支持。",
    escalationDefault:
      "如果困难在多个情境中持续影响家庭或学校生活，专业咨询可以帮助更清楚地理解情况。"
  },
  ja: {
    emailTitle: "年齢段階に合わせた理解",
    emailRecommendationTitle: "年齢に配慮した提案",
    promptWithAge:
      "年齢段階を使って、第6章と実践的な提案を発達段階に合わせて具体化してください。",
    promptWithoutAge:
      "年齢がありません。正確な年齢を推測せず、調整しやすい助言にしてください。",
    observationEmpty:
      "次の1週間は、どの場面で困りごとが強くなり、何が落ち着く助けになるかを観察してください。",
    observationWithAreas:
      "次の1週間は、特に次の領域を見てください：{areas}。目的はラベル付けではなく、どの支援が役立つかを理解することです。",
    escalationHigh:
      "サインが強い、長く続く、引きこもり、自信の低下、強い不安、安全面の心配がある場合は、専門家への相談を検討してください。",
    escalationDefault:
      "困りごとが複数の場面で続き、家庭や学校生活に影響する場合、専門家との相談が役立ちます。"
  },
  ar: {
    emailTitle: "تفسير بحسب المرحلة العمرية",
    emailRecommendationTitle: "توصيات مناسبة للعمر",
    promptWithAge:
      "استخدم المرحلة العمرية لجعل القسم السادس والتوصيات العملية أكثر ملاءمة للنمو.",
    promptWithoutAge:
      "العمر غير متوفر. لا تستنتج عمرًا دقيقًا، واجعل النصائح قابلة للتكييف.",
    observationEmpty:
      "خلال الأسبوع القادم، لاحظ المواقف التي تزداد فيها الصعوبة وما الذي يساعد الطفل على الهدوء أو العودة للنشاط.",
    observationWithAreas:
      "خلال الأسبوع القادم، انتبه خصوصًا إلى هذه المجالات: {areas}. الهدف ليس وضع تسمية، بل فهم الدعم المفيد.",
    escalationHigh:
      "إذا كانت الإشارة قوية أو مستمرة أو مرتبطة بالانسحاب أو انخفاض الثقة أو قلق شديد أو مخاوف تتعلق بالسلامة، فاستشارة مختص خطوة مهمة.",
    escalationDefault:
      "إذا استمرت الصعوبة في أكثر من بيئة وأثرت في الحياة الأسرية أو المدرسية، فقد تساعد الاستشارة المتخصصة على توضيح الصورة."
  },
  pl: {
    emailTitle: "Interpretacja z uwzględnieniem wieku",
    emailRecommendationTitle: "Zalecenia dopasowane do wieku",
    promptWithAge:
      "Wykorzystaj grupę wiekową, aby doprecyzować część 6 i praktyczne zalecenia.",
    promptWithoutAge:
      "Brakuje wieku. Nie zgaduj dokładnego wieku i zostaw zalecenia elastyczne.",
    observationEmpty:
      "W kolejnym tygodniu obserwuj, w jakich sytuacjach trudność narasta i co pomaga dziecku wrócić do równowagi.",
    observationWithAreas:
      "W kolejnym tygodniu zwróć uwagę na te obszary: {areas}. Celem nie jest etykietowanie, lecz zrozumienie pomocnych form wsparcia.",
    escalationHigh:
      "Jeśli sygnał jest silny, utrzymuje się lub wiąże się z wycofaniem, spadkiem samooceny, silnym lękiem albo obawami o bezpieczeństwo, warto skonsultować się ze specjalistą.",
    escalationDefault:
      "Jeśli trudność utrzymuje się w kilku środowiskach i obciąża życie rodzinne lub szkolne, konsultacja specjalistyczna może pomóc."
  },
  pt: {
    emailTitle: "Interpretação por faixa etária",
    emailRecommendationTitle: "Recomendações adequadas à idade",
    promptWithAge:
      "Use a faixa etária para tornar a seção 6 e as recomendações práticas mais específicas ao desenvolvimento.",
    promptWithoutAge:
      "A idade está ausente. Não deduza uma idade exata e mantenha os conselhos adaptáveis.",
    observationEmpty:
      "Na próxima semana, observe em quais situações a dificuldade aumenta e o que ajuda a criança a se reorganizar.",
    observationWithAreas:
      "Na próxima semana, observe especialmente estas áreas: {areas}. O objetivo não é rotular, mas entender quais apoios ajudam.",
    escalationHigh:
      "Se o sinal for forte, persistente ou ligado a retraimento, queda de autoestima, ansiedade intensa ou preocupação de segurança, procure apoio qualificado.",
    escalationDefault:
      "Se a dificuldade persistir em vários contextos e afetar a família ou a escola, uma consulta profissional pode ajudar."
  },
  fr: {
    emailTitle: "Interprétation selon l'âge",
    emailRecommendationTitle: "Recommandations adaptées à l'âge",
    promptWithAge:
      "Utilise la tranche d'âge pour rendre la section 6 et les recommandations pratiques plus adaptées au développement.",
    promptWithoutAge:
      "L'âge manque. N'infère pas un âge précis et garde des conseils adaptables.",
    observationEmpty:
      "La semaine prochaine, observe dans quelles situations la difficulté augmente et ce qui aide l'enfant à se réorganiser.",
    observationWithAreas:
      "La semaine prochaine, observe surtout ces domaines : {areas}. Le but n'est pas d'étiqueter, mais de comprendre quels soutiens aident.",
    escalationHigh:
      "Si le signal est fort, persistant ou lié à un retrait, une baisse de confiance, une anxiété intense ou une inquiétude de sécurité, un soutien qualifié est recommandé.",
    escalationDefault:
      "Si la difficulté persiste dans plusieurs contextes et pèse sur la vie familiale ou scolaire, une consultation professionnelle peut aider."
  }
};

const AGE_COPY = {
  hu: {
    unknown: ["Korosztály nincs megadva", "Az életkor nincs külön megadva, ezért a mintázatot általános fejlődési és családi keretben érdemes értelmezni."],
    under_three: ["3 év alatti korosztály", "Ebben az életkorban a figyelem, érzelemszabályozás, váltásokhoz való alkalmazkodás és kommunikáció gyorsan fejlődik."],
    preschool: ["Óvodás korosztály", "Óvodás korban a figyelem, rugalmasság, társas jelzések és érzelmi szabályozás még erősen helyzetfüggő lehet."],
    early_school: ["Kisiskolás korosztály", "Kisiskolás korban a feladattartás, szabálykövetés, tanulási terhelés és kortárs helyzetek jobban láthatóvá teszik a mintázatokat."],
    middle_school: ["Felsős / korai serdülő korosztály", "Ebben a szakaszban a tervezés, terheléskezelés, önértékelés és teljesítménynyomás nagyobb szerepet kap."],
    teen: ["Serdülő korosztály", "Serdülőknél a mintázatok gyakran belső feszültségben, kimerülésben, elkerülésben vagy teljesítményromlásban látszanak."],
    older: ["Idősebb serdülő / fiatal felnőtt korosztály", "Ebben az életkorban a mindennapi önállóság, tanulási vagy munkaszervezés és mentális terhelés felől érdemes értelmezni a mintázatot."]
  },
  en: {
    unknown: ["Age group not provided", "The child's age was not provided, so the pattern is interpreted within a general developmental and family-functioning frame."],
    under_three: ["Under 3 years", "At this age, attention, regulation, transitions, and communication are still developing rapidly."],
    preschool: ["Preschool age", "Around preschool age, attention, flexibility, social signals, and emotion regulation can still vary strongly by situation."],
    early_school: ["Early school age", "At early school age, task persistence, rules, learning load, and peer situations can make patterns more visible."],
    middle_school: ["Middle school / early adolescence", "Planning, load management, peer relationships, self-esteem, and performance pressure become more important."],
    teen: ["Adolescence", "In adolescence, patterns may appear as internal tension, exhaustion, avoidance, or performance decline."],
    older: ["Older teen / young adult", "At this age, the pattern is best interpreted through independence, study or work organization, relationships, and mental load."]
  }
};

const DOMAIN_ACTIONS = {
  hu: {
    ADHD: ["Következő 7 nap: figyelmi és feladattartási támogatás", ["Bonts egy visszatérő rutint 3-5 látható lépésre.", "Adj rövid instrukciót, majd kérj visszamondást.", "Figyeld, hogy indításnál, fenntartásnál, váltásnál vagy befejezésnél erősebb-e a nehézség."]],
    ASD: ["Következő 7 nap: kiszámíthatóság és társas-szenzoros terhelés", ["Jelezz előre egy nehéz átmenetet.", "Figyeld, hogy társas bizonytalanság, szenzoros terhelés vagy rutinváltozás kapcsolódik-e hozzá.", "Használj rövid, konkrét mondatokat és több feldolgozási időt."]],
    ANXIETY: ["Következő 7 nap: aggodalom és elkerülés finom követése", ["Jegyezd fel, mikor nő a feszültség.", "A megnyugtatás mellett adj egy kicsi, biztonságos lépést az elkerült helyzet felé.", "Figyeld a testi jeleket is: alvás, hasfájás, fejfájás vagy visszahúzódás."]],
    DEPRESSION: ["Következő 7 nap: hangulat, energia és kapcsolódás", ["Naponta egyszer figyeld az energiaszintet, érdeklődést és kedvet.", "Tervezz egy alacsony nyomású, kapcsolódó tevékenységet.", "Erősödő lehangoltság vagy visszahúzódás esetén kérj szakmai segítséget."]],
    LEARNING: ["Következő 7 nap: tanulási helyzetek pontos szétválasztása", ["Válassz egy konkrét feladattípust: olvasás, írás, matek vagy instrukció.", "Nézd meg, hogy a gond megértésben, tempóban vagy kivitelezésben jelenik meg.", "Kérj pedagógustól konkrét példát arról, milyen támogatás segít."]],
    UNKNOWN: ["Következő 7 nap: egy minta tisztázása", ["Válassz egy visszatérő helyzetet.", "Figyeld, mi történik előtte, mi tartja fenn és mi segít.", "A következő lépés legyen kicsi, mérhető és életkorhoz igazított."]]
  },
  en: {
    ADHD: ["Next 7 days: support attention and task persistence", ["Break one recurring routine into 3-5 visible steps.", "Give a short instruction, then ask for the first next step.", "Observe whether the difficulty is strongest during starting, staying with, switching, or finishing."]],
    ASD: ["Next 7 days: predictability and social-sensory load", ["Give a visible warning before one difficult transition.", "Observe whether social uncertainty, sensory load, or routine change is linked.", "Use short concrete sentences and allow more processing time."]],
    ANXIETY: ["Next 7 days: track worry and avoidance gently", ["Note when tension increases.", "Alongside reassurance, offer one small safe step toward the avoided situation.", "Watch body signals too: sleep, stomachaches, headaches, or withdrawal."]],
    DEPRESSION: ["Next 7 days: mood, energy, and connection", ["Once a day, briefly track energy, interest, and mood.", "Plan one low-pressure connecting activity.", "If low mood or withdrawal increases, seek qualified support."]],
    LEARNING: ["Next 7 days: separate learning situations clearly", ["Choose one task type: reading, writing, math, or instructions.", "Check whether the difficulty is in understanding, pace, or output.", "Ask educators for concrete examples of what helps."]],
    UNKNOWN: ["Next 7 days: clarify one recurring pattern", ["Choose one recurring situation.", "Watch what happens before it, what keeps it going, and what helps.", "Make the next step small, measurable, and age-appropriate."]]
  }
};

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

  const match = String(value).trim().replace(",", ".").match(/\d+(?:\.\d+)?/);
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

function getLangCopy(lang = "en") {
  return LANG_COPY[lang] || LANG_COPY.en;
}

function getAgeCopy(lang = "en") {
  return AGE_COPY[lang] || AGE_COPY.en;
}

function getActionCopy(lang = "en") {
  return DOMAIN_ACTIONS[lang] || DOMAIN_ACTIONS.en;
}

function translateAgeCopy(lang, ageBand) {
  const fallback = getAgeCopy("en");
  const source = getAgeCopy(lang);
  const tuple = source[ageBand] || source.unknown || fallback[ageBand] || fallback.unknown;
  const fallbackTuple = fallback[ageBand] || fallback.unknown;

  const recommendations = {
    hu: [
      "A javaslatokat az életkornak megfelelő elvárásokhoz érdemes igazítani.",
      "Figyeld, hogy a nehézség több helyzetben is megjelenik-e, vagy inkább egy adott rutin váltja ki.",
      "Konkrét, nyugodt megfigyelésekkel könnyebb eldönteni, mi legyen a következő lépés."
    ],
    en: [
      "Adapt the recommendations to age-appropriate expectations.",
      "Observe whether the difficulty appears across several settings or mainly around one routine.",
      "Concrete calm observations make the next step easier to choose."
    ],
    de: [
      "Passe die Empfehlungen an altersgerechte Erwartungen an.",
      "Beobachte, ob die Schwierigkeit in mehreren Situationen oder vor allem in einer Routine erscheint.",
      "Konkrete ruhige Beobachtungen erleichtern den nächsten Schritt."
    ],
    it: [
      "Adatta le raccomandazioni alle aspettative legate all'età.",
      "Osserva se la difficoltà compare in più contesti o soprattutto in una routine.",
      "Osservazioni concrete aiutano a scegliere il passo successivo."
    ],
    es: [
      "Adapta las recomendaciones a expectativas adecuadas a la edad.",
      "Observa si la dificultad aparece en varios contextos o sobre todo en una rutina.",
      "Las observaciones concretas ayudan a elegir el siguiente paso."
    ],
    zh: [
      "请把建议调整到符合孩子年龄的发展期待。",
      "观察困难是否出现在多个情境，还是主要集中在某个固定流程。",
      "具体而平静的观察能帮助决定下一步。"
    ],
    ja: [
      "提案は年齢に合った期待に合わせて調整してください。",
      "困りごとが複数の場面で出るのか、特定の流れで強いのかを見てください。",
      "具体的で落ち着いた観察が次の一歩を選びやすくします。"
    ],
    ar: [
      "اجعل التوصيات مناسبة لتوقعات المرحلة العمرية.",
      "لاحظ هل تظهر الصعوبة في عدة مواقف أم في روتين محدد فقط.",
      "الملاحظات الهادئة والمحددة تساعد على اختيار الخطوة التالية."
    ],
    pl: [
      "Dopasuj zalecenia do oczekiwań odpowiednich dla wieku.",
      "Obserwuj, czy trudność pojawia się w kilku sytuacjach, czy głównie w jednej rutynie.",
      "Konkretne spokojne obserwacje ułatwiają wybór kolejnego kroku."
    ],
    pt: [
      "Adapte as recomendações às expectativas adequadas à idade.",
      "Observe se a dificuldade aparece em vários contextos ou principalmente em uma rotina.",
      "Observações concretas ajudam a escolher o próximo passo."
    ],
    fr: [
      "Adapte les recommandations aux attentes liées à l'âge.",
      "Observe si la difficulté apparaît dans plusieurs contextes ou surtout dans une routine.",
      "Des observations concrètes aident à choisir l'étape suivante."
    ]
  };

  return {
    label: tuple?.[0] || fallbackTuple[0],
    interpretation: tuple?.[1] || fallbackTuple[1],
    recommendations: recommendations[lang] || recommendations.en
  };
}

function getReportSignals(payload = {}) {
  const profile = payload?.specificProfile || {};
  const scoring = payload?.specificScoring || {};
  const summary = payload?.resultSummary || {};
  const detectedRisk = payload?.detectedRisk || profile?.kind || summary?.kind || "UNKNOWN";
  const secondaryRisk = payload?.secondaryRisk || summary?.secondaryRisk || null;
  const severity = profile?.severity || summary?.signal?.key || "unknown";
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

function formatFocusLabel(value = "") {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildObservationFocus(signals, lang = "en") {
  const copy = getLangCopy(lang);
  const areas = (signals.topSubdomains || []).map((item) => formatFocusLabel(item.key)).filter(Boolean);

  if (!areas.length) return copy.observationEmpty;
  return copy.observationWithAreas.replace("{areas}", areas.join(", "));
}

function buildEscalationNote(signals, lang = "en") {
  const copy = getLangCopy(lang);
  const severity = String(signals.severity || "").toLowerCase();
  const hasMoodRisk = signals.detectedRisk === "DEPRESSION" || signals.secondaryRisk === "DEPRESSION";

  return severity === "high" || hasMoodRisk ? copy.escalationHigh : copy.escalationDefault;
}

export function buildReportV2Context(payload = {}, lang = "en") {
  const ageYears = extractChildAgeYears(payload);
  const ageBand = getAgeBand(ageYears);
  const ageCopy = translateAgeCopy(lang, ageBand);
  const signals = getReportSignals(payload);
  const actions = getActionCopy(lang);
  const domainAction = actions[signals.detectedRisk] || actions.UNKNOWN || getActionCopy("en").UNKNOWN;

  return {
    version: "structured_report_v2",
    ageYears,
    ageBand,
    ageBandLabel: ageCopy.label,
    hasAge: ageYears !== null,
    interpretation: ageCopy.interpretation,
    recommendations: ageCopy.recommendations,
    primaryFocus: signals.detectedRisk,
    secondaryFocus: signals.secondaryRisk,
    severity: signals.severity,
    focusSubdomains: signals.topSubdomains,
    actionPlanTitle: domainAction[0],
    actionPlan: domainAction[1],
    observationFocus: buildObservationFocus(signals, lang),
    escalationNote: buildEscalationNote(signals, lang)
  };
}

export function buildReportV2PromptContext(payload = {}, lang = "en") {
  const context = buildReportV2Context(payload, lang);
  const copy = getLangCopy(lang);

  return {
    ...context,
    instruction: context.hasAge ? copy.promptWithAge : copy.promptWithoutAge
  };
}

export function buildReportV2EmailContext(payload = {}, lang = "en") {
  const context = buildReportV2Context(payload, lang);
  const copy = getLangCopy(lang);

  return {
    ...context,
    title: copy.emailTitle,
    recommendationTitle: copy.emailRecommendationTitle
  };
}
