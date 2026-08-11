import {
  formatProfessionalTerm,
  formatReportDomain
} from "../utils/report-terminology.js";

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
  },
  de: {
    unknown: ["Altersgruppe nicht angegeben", "Das Alter wurde nicht angegeben, daher wird das Muster in einem allgemeinen entwicklungsbezogenen und familiären Rahmen eingeordnet."],
    under_three: ["Unter 3 Jahren", "In diesem Alter entwickeln sich Aufmerksamkeit, Regulation, Übergänge und Kommunikation noch sehr schnell."],
    preschool: ["Vorschulalter", "Im Vorschulalter können Aufmerksamkeit, Flexibilität, soziale Signale und Emotionsregulation noch stark von der Situation abhängen."],
    early_school: ["Frühes Schulalter", "Im frühen Schulalter werden Ausdauer bei Aufgaben, Regeln, Lernbelastung und Situationen mit Gleichaltrigen deutlicher sichtbar."],
    middle_school: ["Mittlere Schulzeit / frühe Adoleszenz", "Planung, Umgang mit Belastung, Beziehungen zu Gleichaltrigen, Selbstwert und Leistungsdruck werden wichtiger."],
    teen: ["Adoleszenz", "In der Adoleszenz zeigen sich Muster oft als innere Anspannung, Erschöpfung, Vermeidung oder Leistungsabfall."],
    older: ["Ältere Jugendliche / junge Erwachsene", "In diesem Alter sollte das Muster vor allem über Selbstständigkeit, Lern- oder Arbeitsorganisation, Beziehungen und mentale Belastung verstanden werden."]
  },
  it: {
    unknown: ["Fascia d'età non indicata", "L'età non è stata indicata, quindi il profilo viene interpretato in un quadro generale di sviluppo e funzionamento familiare."],
    under_three: ["Meno di 3 anni", "A questa età attenzione, regolazione, passaggi da un'attività all'altra e comunicazione sono ancora in rapido sviluppo."],
    preschool: ["Età prescolare", "In età prescolare attenzione, flessibilità, segnali sociali e regolazione emotiva possono variare molto a seconda della situazione."],
    early_school: ["Primi anni di scuola", "Nei primi anni di scuola, persistenza nel compito, regole, carico di apprendimento e situazioni con i pari rendono i pattern più visibili."],
    middle_school: ["Scuola media / prima adolescenza", "Pianificazione, gestione del carico, relazioni con i pari, autostima e pressione prestazionale diventano più rilevanti."],
    teen: ["Adolescenza", "In adolescenza i pattern possono emergere come tensione interna, stanchezza, evitamento o calo del rendimento."],
    older: ["Tarda adolescenza / giovane adulto", "A questa età il pattern si comprende meglio attraverso autonomia, organizzazione dello studio o del lavoro, relazioni e carico mentale."]
  },
  es: {
    unknown: ["Grupo de edad no indicado", "No se indicó la edad, por lo que el patrón se interpreta dentro de un marco general de desarrollo y funcionamiento familiar."],
    under_three: ["Menores de 3 años", "A esta edad, la atención, la regulación, las transiciones y la comunicación todavía se desarrollan con rapidez."],
    preschool: ["Edad preescolar", "En edad preescolar, la atención, la flexibilidad, las señales sociales y la regulación emocional pueden variar mucho según la situación."],
    early_school: ["Primeros años escolares", "En los primeros años escolares, la persistencia en tareas, las reglas, la carga de aprendizaje y las situaciones con pares hacen más visibles los patrones."],
    middle_school: ["Edad escolar media / inicio de adolescencia", "La planificación, el manejo de la carga, las relaciones con pares, la autoestima y la presión por el rendimiento cobran más importancia."],
    teen: ["Adolescencia", "En la adolescencia, los patrones pueden aparecer como tensión interna, agotamiento, evitación o descenso del rendimiento."],
    older: ["Adolescente mayor / adulto joven", "A esta edad, conviene interpretar el patrón desde la autonomía, la organización del estudio o trabajo, las relaciones y la carga mental."]
  },
  zh: {
    unknown: ["未提供年龄段", "未提供孩子年龄，因此会在一般发展与家庭功能框架下理解这些模式。"],
    under_three: ["3岁以下", "在这个年龄，注意力、情绪调节、转换适应和沟通能力仍在快速发展。"],
    preschool: ["学龄前阶段", "学龄前儿童的注意力、灵活性、社交信号理解和情绪调节仍可能明显受情境影响。"],
    early_school: ["小学低年级阶段", "在小学低年级，任务坚持、规则、学习负荷和同伴情境会让模式更容易被观察到。"],
    middle_school: ["小学高年级 / 青春期早期", "计划能力、压力管理、同伴关系、自我评价和表现压力会变得更重要。"],
    teen: ["青春期阶段", "青春期的模式可能表现为内在紧张、疲惫、回避或学习表现下降。"],
    older: ["青春期后期 / 年轻成人", "在这个年龄，应从独立性、学习或工作组织、人际关系和心理负荷角度理解这些模式。"]
  },
  ja: {
    unknown: ["年齢段階が未入力", "年齢が入力されていないため、一般的な発達と家庭での様子を踏まえて解釈します。"],
    under_three: ["3歳未満", "この年齢では、注意、調整、切り替え、コミュニケーションがまだ急速に発達しています。"],
    preschool: ["未就学段階", "未就学の時期は、注意、柔軟性、社会的なサイン、感情調整が場面によって大きく変わることがあります。"],
    early_school: ["小学校低学年", "小学校低学年では、課題への取り組み、ルール、学習負荷、友人関係の中でパターンが見えやすくなります。"],
    middle_school: ["小学校高学年 / 思春期初期", "計画、負荷の調整、友人関係、自己評価、成績へのプレッシャーがより重要になります。"],
    teen: ["思春期", "思春期には、内面的な緊張、疲れ、回避、成績低下としてパターンが表れることがあります。"],
    older: ["思春期後期 / 若年成人", "この年齢では、自立、学習や仕事の整理、人間関係、精神的負荷の観点から理解すると役立ちます。"]
  },
  ar: {
    unknown: ["لم تُذكر المرحلة العمرية", "لم يتم إدخال عمر الطفل، لذلك يتم تفسير النمط ضمن إطار عام للنمو ووظائف الأسرة."],
    under_three: ["أقل من 3 سنوات", "في هذا العمر ما زالت مهارات الانتباه والتنظيم والانتقال بين الأنشطة والتواصل تتطور بسرعة."],
    preschool: ["مرحلة ما قبل المدرسة", "في مرحلة ما قبل المدرسة قد يختلف الانتباه والمرونة وفهم الإشارات الاجتماعية وتنظيم المشاعر كثيرًا حسب الموقف."],
    early_school: ["السنوات المدرسية الأولى", "في السنوات المدرسية الأولى تصبح المثابرة على المهمة والقواعد وعبء التعلم ومواقف الأقران أكثر وضوحًا."],
    middle_school: ["المرحلة المدرسية المتوسطة / بداية المراهقة", "يصبح التخطيط وإدارة العبء والعلاقات مع الأقران وتقدير الذات وضغط الأداء أكثر أهمية."],
    teen: ["مرحلة المراهقة", "في المراهقة قد تظهر الأنماط كتوتّر داخلي أو إنهاك أو تجنّب أو تراجع في الأداء."],
    older: ["مراهق أكبر سنًا / شاب بالغ", "في هذا العمر من الأفضل فهم النمط من خلال الاستقلالية وتنظيم الدراسة أو العمل والعلاقات والعبء النفسي."]
  },
  pl: {
    unknown: ["Nie podano grupy wiekowej", "Wiek dziecka nie został podany, dlatego wzorzec interpretujemy w ogólnych ramach rozwojowych i rodzinnych."],
    under_three: ["Poniżej 3 lat", "W tym wieku uwaga, regulacja, przejścia między aktywnościami i komunikacja nadal rozwijają się bardzo szybko."],
    preschool: ["Wiek przedszkolny", "W wieku przedszkolnym uwaga, elastyczność, sygnały społeczne i regulacja emocji mogą jeszcze silnie zależeć od sytuacji."],
    early_school: ["Wczesny wiek szkolny", "We wczesnym wieku szkolnym wytrwałość w zadaniu, zasady, obciążenie nauką i sytuacje rówieśnicze wyraźniej pokazują wzorce."],
    middle_school: ["Starsza szkoła podstawowa / wczesna adolescencja", "Planowanie, radzenie sobie z obciążeniem, relacje rówieśnicze, samoocena i presja wyników stają się ważniejsze."],
    teen: ["Adolescencja", "W adolescencji wzorce mogą pojawiać się jako napięcie wewnętrzne, wyczerpanie, unikanie lub spadek wyników."],
    older: ["Starszy nastolatek / młody dorosły", "W tym wieku warto interpretować wzorzec przez samodzielność, organizację nauki lub pracy, relacje i obciążenie psychiczne."]
  },
  pt: {
    unknown: ["Faixa etária não indicada", "A idade da criança não foi informada, por isso o padrão é interpretado num enquadramento geral de desenvolvimento e funcionamento familiar."],
    under_three: ["Menos de 3 anos", "Nesta idade, atenção, regulação, transições e comunicação ainda estão em desenvolvimento rápido."],
    preschool: ["Idade pré-escolar", "Na idade pré-escolar, atenção, flexibilidade, sinais sociais e regulação emocional ainda podem variar muito conforme a situação."],
    early_school: ["Primeiros anos escolares", "Nos primeiros anos escolares, persistência na tarefa, regras, carga de aprendizagem e situações com colegas tornam os padrões mais visíveis."],
    middle_school: ["Ensino básico intermédio / início da adolescência", "Planeamento, gestão da carga, relações com colegas, autoestima e pressão de desempenho tornam-se mais importantes."],
    teen: ["Adolescência", "Na adolescência, os padrões podem aparecer como tensão interna, exaustão, evitamento ou queda no desempenho."],
    older: ["Adolescente mais velho / jovem adulto", "Nesta idade, o padrão é melhor interpretado através da autonomia, organização do estudo ou trabalho, relações e carga mental."]
  },
  fr: {
    unknown: ["Tranche d'âge non indiquée", "L'âge de l'enfant n'a pas été indiqué, le profil est donc interprété dans un cadre développemental et familial général."],
    under_three: ["Moins de 3 ans", "À cet âge, l'attention, la régulation, les transitions et la communication se développent encore très rapidement."],
    preschool: ["Âge préscolaire", "À l'âge préscolaire, l'attention, la flexibilité, les signaux sociaux et la régulation émotionnelle peuvent encore beaucoup varier selon la situation."],
    early_school: ["Début de scolarité", "Au début de la scolarité, la persévérance dans les tâches, les règles, la charge d'apprentissage et les situations avec les pairs rendent les schémas plus visibles."],
    middle_school: ["Fin d'école primaire / début d'adolescence", "La planification, la gestion de la charge, les relations avec les pairs, l'estime de soi et la pression de performance deviennent plus importantes."],
    teen: ["Adolescence", "À l'adolescence, les schémas peuvent apparaître comme une tension interne, de l'épuisement, de l'évitement ou une baisse des performances."],
    older: ["Grand adolescent / jeune adulte", "À cet âge, il est utile d'interpréter le schéma à travers l'autonomie, l'organisation des études ou du travail, les relations et la charge mentale."]
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
  },
  de: {
    ADHD: ["Nächste 7 Tage: Aufmerksamkeit und Aufgaben-Ausdauer unterstützen", ["Teile eine wiederkehrende Routine in 3-5 sichtbare Schritte.", "Gib eine kurze Anweisung und lass den ersten nächsten Schritt wiederholen.", "Beobachte, ob die Schwierigkeit beim Starten, Dranbleiben, Wechseln oder Beenden am stärksten ist."]],
    ASD: ["Nächste 7 Tage: Vorhersagbarkeit und sozial-sensorische Belastung", ["Kündige einen schwierigen Übergang sichtbar vorher an.", "Beobachte, ob soziale Unsicherheit, sensorische Belastung oder Routineänderung damit zusammenhängen.", "Nutze kurze, konkrete Sätze und gib mehr Verarbeitungszeit."]],
    ANXIETY: ["Nächste 7 Tage: Sorgen und Vermeidung behutsam beobachten", ["Notiere, wann die Anspannung zunimmt.", "Biete neben Beruhigung einen kleinen sicheren Schritt in Richtung der vermiedenen Situation an.", "Achte auch auf Körpersignale: Schlaf, Bauchweh, Kopfschmerzen oder Rückzug."]],
    DEPRESSION: ["Nächste 7 Tage: Stimmung, Energie und Verbindung", ["Beobachte einmal täglich kurz Energie, Interesse und Stimmung.", "Plane eine verbindende Aktivität mit wenig Druck.", "Wenn Niedergeschlagenheit oder Rückzug zunehmen, suche qualifizierte Unterstützung."]],
    LEARNING: ["Nächste 7 Tage: Lernsituationen klar trennen", ["Wähle einen Aufgabentyp: Lesen, Schreiben, Mathematik oder Anweisungen.", "Prüfe, ob die Schwierigkeit im Verstehen, Tempo oder in der Ausführung liegt.", "Bitte Lehrkräfte um konkrete Beispiele, welche Unterstützung hilft."]],
    UNKNOWN: ["Nächste 7 Tage: ein wiederkehrendes Muster klären", ["Wähle eine wiederkehrende Situation.", "Beobachte, was davor passiert, was es aufrechterhält und was hilft.", "Der nächste Schritt sollte klein, messbar und altersgerecht sein."]]
  },
  it: {
    ADHD: ["Prossimi 7 giorni: sostenere attenzione e persistenza nel compito", ["Dividi una routine ricorrente in 3-5 passaggi visibili.", "Dai un'istruzione breve e chiedi quale sia il primo passo successivo.", "Osserva se la difficoltà è più forte nell'iniziare, mantenere, cambiare o concludere."]],
    ASD: ["Prossimi 7 giorni: prevedibilità e carico sociale-sensoriale", ["Prepara in modo visibile una transizione difficile.", "Osserva se sono collegati incertezza sociale, carico sensoriale o cambiamenti di routine.", "Usa frasi brevi e concrete e concedi più tempo di elaborazione."]],
    ANXIETY: ["Prossimi 7 giorni: osservare con delicatezza preoccupazione ed evitamento", ["Annota quando aumenta la tensione.", "Oltre alla rassicurazione, proponi un piccolo passo sicuro verso la situazione evitata.", "Osserva anche i segnali corporei: sonno, mal di pancia, mal di testa o ritiro."]],
    DEPRESSION: ["Prossimi 7 giorni: umore, energia e connessione", ["Una volta al giorno osserva brevemente energia, interesse e umore.", "Programma un'attività di connessione a bassa pressione.", "Se umore basso o ritiro aumentano, cerca supporto qualificato."]],
    LEARNING: ["Prossimi 7 giorni: distinguere chiaramente le situazioni di apprendimento", ["Scegli un tipo di compito: lettura, scrittura, matematica o istruzioni.", "Verifica se la difficoltà riguarda comprensione, ritmo o produzione.", "Chiedi agli insegnanti esempi concreti di ciò che aiuta."]],
    UNKNOWN: ["Prossimi 7 giorni: chiarire un pattern ricorrente", ["Scegli una situazione ricorrente.", "Osserva cosa accade prima, cosa la mantiene e cosa aiuta.", "Il prossimo passo dovrebbe essere piccolo, misurabile e adatto all'età."]]
  },
  es: {
    ADHD: ["Próximos 7 días: apoyar la atención y la persistencia en tareas", ["Divide una rutina recurrente en 3-5 pasos visibles.", "Da una instrucción breve y pide que diga el primer paso siguiente.", "Observa si la dificultad aparece más al empezar, mantener, cambiar o terminar."]],
    ASD: ["Próximos 7 días: previsibilidad y carga social-sensorial", ["Anticipa de forma visible una transición difícil.", "Observa si se relaciona con incertidumbre social, carga sensorial o cambio de rutina.", "Usa frases breves y concretas, y deja más tiempo para procesar."]],
    ANXIETY: ["Próximos 7 días: seguir con calma la preocupación y la evitación", ["Anota cuándo aumenta la tensión.", "Además de tranquilizar, ofrece un pequeño paso seguro hacia la situación evitada.", "Observa también señales corporales: sueño, dolor de barriga, dolor de cabeza o retraimiento."]],
    DEPRESSION: ["Próximos 7 días: ánimo, energía y conexión", ["Una vez al día observa brevemente energía, interés y estado de ánimo.", "Planifica una actividad de conexión con poca presión.", "Si aumentan el bajo ánimo o el retraimiento, busca apoyo cualificado."]],
    LEARNING: ["Próximos 7 días: separar claramente las situaciones de aprendizaje", ["Elige un tipo de tarea: lectura, escritura, matemáticas o instrucciones.", "Comprueba si la dificultad está en la comprensión, el ritmo o la ejecución.", "Pide al profesorado ejemplos concretos de qué ayuda."]],
    UNKNOWN: ["Próximos 7 días: aclarar un patrón recurrente", ["Elige una situación recurrente.", "Observa qué ocurre antes, qué lo mantiene y qué ayuda.", "El siguiente paso debe ser pequeño, medible y adecuado a la edad."]]
  },
  zh: {
    ADHD: ["接下来7天：支持注意力和任务坚持", ["把一个反复出现的日常流程拆成3-5个可见步骤。", "给出简短指令，然后请孩子说出下一步。", "观察困难最明显是在开始、保持、切换还是结束时。"]],
    ASD: ["接下来7天：可预测性与社交-感官负荷", ["在一个困难转换前给出可见提示。", "观察是否与社交不确定、感官负荷或日常变化有关。", "使用简短具体的句子，并给更多处理时间。"]],
    ANXIETY: ["接下来7天：温和观察担忧和回避", ["记录紧张何时升高。", "在安抚之外，提供一个小而安全的步骤，慢慢接近被回避的情境。", "也观察身体信号：睡眠、腹痛、头痛或退缩。"]],
    DEPRESSION: ["接下来7天：情绪、能量和连接", ["每天简短观察一次能量、兴趣和情绪。", "安排一个低压力的连接活动。", "如果低落或退缩加重，请寻求专业支持。"]],
    LEARNING: ["接下来7天：清楚区分学习情境", ["选择一种任务类型：阅读、书写、数学或指令理解。", "判断困难主要在理解、速度还是输出。", "向老师询问具体哪些支持方式有帮助。"]],
    UNKNOWN: ["接下来7天：澄清一个反复出现的模式", ["选择一个反复出现的情境。", "观察之前发生什么、什么维持了它、什么有帮助。", "下一步应小、可观察，并符合年龄。"]]
  },
  ja: {
    ADHD: ["今後7日間：注意と課題継続を支える", ["繰り返し起こる流れを3-5個の見えるステップに分けます。", "短い指示を出し、次の最初の一歩を確認します。", "始める時、続ける時、切り替える時、終える時のどこで困りやすいかを見ます。"]],
    ASD: ["今後7日間：見通しと社会・感覚負荷", ["難しい切り替えの前に、見える形で予告します。", "社会的な不確実さ、感覚負荷、ルーティン変更が関係しているかを見ます。", "短く具体的な言葉を使い、処理する時間を多めに取ります。"]],
    ANXIETY: ["今後7日間：不安と回避をやさしく観察する", ["緊張が高まる場面を記録します。", "安心づけに加えて、避けている場面に向けた小さく安全な一歩を用意します。", "睡眠、腹痛、頭痛、引きこもりなど身体のサインも見ます。"]],
    DEPRESSION: ["今後7日間：気分、エネルギー、つながり", ["1日1回、エネルギー、興味、気分を短く観察します。", "負担の少ないつながりの活動を一つ計画します。", "気分の落ち込みや引きこもりが強まる場合は、専門的な支援を検討してください。"]],
    LEARNING: ["今後7日間：学習場面を明確に分ける", ["読む、書く、算数、指示理解のどれか一つを選びます。", "困りごとが理解、速度、出力のどこにあるかを確認します。", "先生に、どんな支援が役立つか具体例を聞きます。"]],
    UNKNOWN: ["今後7日間：繰り返すパターンを一つ整理する", ["繰り返し起こる場面を一つ選びます。", "その前に何があり、何が続けさせ、何が助けになるかを見ます。", "次の一歩は小さく、測りやすく、年齢に合ったものにします。"]]
  },
  ar: {
    ADHD: ["الأيام السبعة القادمة: دعم الانتباه والمثابرة على المهمة", ["قسّم روتينًا متكررًا إلى 3-5 خطوات مرئية.", "أعطِ تعليمة قصيرة ثم اطلب ذكر الخطوة التالية الأولى.", "لاحظ هل تكون الصعوبة أقوى عند البدء أو الاستمرار أو الانتقال أو الإنهاء."]],
    ASD: ["الأيام السبعة القادمة: قابلية التوقع والعبء الاجتماعي-الحسي", ["قدّم تنبيهًا مرئيًا قبل انتقال صعب.", "لاحظ هل يرتبط الأمر بعدم اليقين الاجتماعي أو العبء الحسي أو تغيير الروتين.", "استخدم جملًا قصيرة ومحددة وامنح وقتًا أطول للمعالجة."]],
    ANXIETY: ["الأيام السبعة القادمة: متابعة القلق والتجنّب بلطف", ["دوّن متى يزداد التوتر.", "إلى جانب الطمأنة، قدّم خطوة صغيرة وآمنة نحو الموقف الذي يتم تجنّبه.", "انتبه أيضًا لإشارات الجسم: النوم أو ألم البطن أو الصداع أو الانسحاب."]],
    DEPRESSION: ["الأيام السبعة القادمة: المزاج والطاقة والتواصل", ["مرة يوميًا، راقب باختصار مستوى الطاقة والاهتمام والمزاج.", "خطط لنشاط تواصلي منخفض الضغط.", "إذا ازداد انخفاض المزاج أو الانسحاب، فاطلب دعمًا مؤهلًا."]],
    LEARNING: ["الأيام السبعة القادمة: فصل مواقف التعلم بوضوح", ["اختر نوع مهمة واحدًا: القراءة أو الكتابة أو الرياضيات أو التعليمات.", "تحقق هل تكمن الصعوبة في الفهم أو السرعة أو التنفيذ.", "اطلب من المعلمين أمثلة محددة لما يساعد."]],
    UNKNOWN: ["الأيام السبعة القادمة: توضيح نمط متكرر واحد", ["اختر موقفًا متكررًا واحدًا.", "راقب ما يحدث قبله، وما يبقيه مستمرًا، وما يساعد.", "اجعل الخطوة التالية صغيرة وقابلة للملاحظة ومناسبة للعمر."]]
  },
  pl: {
    ADHD: ["Najbliższe 7 dni: wspieranie uwagi i wytrwałości w zadaniu", ["Podziel jedną powtarzającą się rutynę na 3-5 widocznych kroków.", "Podaj krótką instrukcję, a potem poproś o wskazanie pierwszego następnego kroku.", "Obserwuj, czy trudność jest największa przy rozpoczęciu, utrzymaniu, zmianie czy kończeniu."]],
    ASD: ["Najbliższe 7 dni: przewidywalność i obciążenie społeczne-sensoryczne", ["Zapowiedz widocznie jedno trudne przejście.", "Obserwuj, czy wiąże się to z niepewnością społeczną, obciążeniem sensorycznym lub zmianą rutyny.", "Używaj krótkich, konkretnych zdań i daj więcej czasu na przetworzenie."]],
    ANXIETY: ["Najbliższe 7 dni: łagodne śledzenie lęku i unikania", ["Zapisuj, kiedy napięcie rośnie.", "Obok uspokojenia zaproponuj jeden mały, bezpieczny krok w stronę unikanej sytuacji.", "Obserwuj też sygnały z ciała: sen, bóle brzucha, bóle głowy lub wycofanie."]],
    DEPRESSION: ["Najbliższe 7 dni: nastrój, energia i kontakt", ["Raz dziennie krótko obserwuj energię, zainteresowanie i nastrój.", "Zaplanuj jedną mało obciążającą aktywność budującą kontakt.", "Jeśli obniżony nastrój lub wycofanie narastają, poszukaj kwalifikowanego wsparcia."]],
    LEARNING: ["Najbliższe 7 dni: jasne rozdzielenie sytuacji uczenia się", ["Wybierz jeden typ zadania: czytanie, pisanie, matematyka lub instrukcje.", "Sprawdź, czy trudność dotyczy rozumienia, tempa czy wykonania.", "Poproś nauczycieli o konkretne przykłady tego, co pomaga."]],
    UNKNOWN: ["Najbliższe 7 dni: doprecyzowanie jednego powtarzalnego wzorca", ["Wybierz jedną powtarzającą się sytuację.", "Obserwuj, co dzieje się wcześniej, co ją podtrzymuje i co pomaga.", "Kolejny krok powinien być mały, mierzalny i dopasowany do wieku."]]
  },
  pt: {
    ADHD: ["Próximos 7 dias: apoiar atenção e persistência na tarefa", ["Divida uma rotina recorrente em 3-5 passos visíveis.", "Dê uma instrução curta e peça qual é o primeiro passo seguinte.", "Observe se a dificuldade é maior ao começar, manter, mudar ou terminar."]],
    ASD: ["Próximos 7 dias: previsibilidade e carga social-sensorial", ["Avise visualmente antes de uma transição difícil.", "Observe se incerteza social, carga sensorial ou mudança de rotina estão ligadas.", "Use frases curtas e concretas e dê mais tempo de processamento."]],
    ANXIETY: ["Próximos 7 dias: acompanhar preocupação e evitamento com cuidado", ["Anote quando a tensão aumenta.", "Além de tranquilizar, ofereça um pequeno passo seguro em direção à situação evitada.", "Observe também sinais físicos: sono, dores de barriga, dores de cabeça ou retraimento."]],
    DEPRESSION: ["Próximos 7 dias: humor, energia e ligação", ["Uma vez por dia, observe brevemente energia, interesse e humor.", "Planeie uma atividade de ligação com pouca pressão.", "Se o humor baixo ou o retraimento aumentarem, procure apoio qualificado."]],
    LEARNING: ["Próximos 7 dias: separar claramente as situações de aprendizagem", ["Escolha um tipo de tarefa: leitura, escrita, matemática ou instruções.", "Veja se a dificuldade está na compreensão, no ritmo ou na execução.", "Peça aos educadores exemplos concretos do que ajuda."]],
    UNKNOWN: ["Próximos 7 dias: clarificar um padrão recorrente", ["Escolha uma situação recorrente.", "Observe o que acontece antes, o que mantém a situação e o que ajuda.", "O próximo passo deve ser pequeno, mensurável e adequado à idade."]]
  },
  fr: {
    ADHD: ["7 prochains jours : soutenir l'attention et la persévérance", ["Découpez une routine récurrente en 3-5 étapes visibles.", "Donnez une consigne courte, puis demandez le premier pas à faire.", "Observez si la difficulté est plus forte au démarrage, au maintien, au changement ou à la fin."]],
    ASD: ["7 prochains jours : prévisibilité et charge sociale-sensorielle", ["Annoncez visiblement une transition difficile.", "Observez si l'incertitude sociale, la charge sensorielle ou le changement de routine est lié.", "Utilisez des phrases courtes et concrètes, et laissez plus de temps de traitement."]],
    ANXIETY: ["7 prochains jours : observer doucement l'inquiétude et l'évitement", ["Notez quand la tension augmente.", "En plus de rassurer, proposez un petit pas sûr vers la situation évitée.", "Observez aussi les signaux corporels : sommeil, maux de ventre, maux de tête ou retrait."]],
    DEPRESSION: ["7 prochains jours : humeur, énergie et lien", ["Une fois par jour, observez brièvement l'énergie, l'intérêt et l'humeur.", "Prévoyez une activité de lien avec peu de pression.", "Si la baisse d'humeur ou le retrait augmente, demandez un soutien qualifié."]],
    LEARNING: ["7 prochains jours : distinguer clairement les situations d'apprentissage", ["Choisissez un type de tâche : lecture, écriture, mathématiques ou consignes.", "Vérifiez si la difficulté concerne la compréhension, le rythme ou la production.", "Demandez aux enseignants des exemples concrets de ce qui aide."]],
    UNKNOWN: ["7 prochains jours : clarifier un schéma récurrent", ["Choisissez une situation récurrente.", "Observez ce qui arrive avant, ce qui maintient la difficulté et ce qui aide.", "La prochaine étape doit être petite, observable et adaptée à l'âge."]]
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

function getFocusDisplayLabel(value = "", lang = "en") {
  const fallback = formatFocusLabel(value);
  return lang === "hu"
    ? formatProfessionalTerm(value, lang, fallback)
    : fallback;
}

function getDomainDisplayLabel(value = "", lang = "en") {
  const fallback = formatFocusLabel(value);
  return lang === "hu"
    ? formatReportDomain(value, lang, fallback)
    : fallback;
}

function buildObservationFocus(signals, lang = "en") {
  const copy = getLangCopy(lang);
  const areas = (signals.topSubdomains || [])
    .map((item) => getFocusDisplayLabel(item.key, lang))
    .filter(Boolean);

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
  const focusSubdomains = signals.topSubdomains.map((item) => ({
    ...item,
    label: getFocusDisplayLabel(item.key, lang)
  }));

  return {
    version: "structured_report_v2",
    ageYears,
    ageBand,
    ageBandLabel: ageCopy.label,
    hasAge: ageYears !== null,
    interpretation: ageCopy.interpretation,
    recommendations: ageCopy.recommendations,
    primaryFocus: signals.detectedRisk,
    primaryFocusLabel: getDomainDisplayLabel(signals.detectedRisk, lang),
    secondaryFocus: signals.secondaryRisk,
    secondaryFocusLabel: signals.secondaryRisk
      ? getDomainDisplayLabel(signals.secondaryRisk, lang)
      : null,
    severity: signals.severity,
    focusSubdomains,
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
