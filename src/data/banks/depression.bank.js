function makeId(prefix, n) {
  return `${prefix}_${String(n).padStart(4, "0")}`;
}

function makeQuestion(id, subdomain, text) {
  return {
    id,
    domain: "DEPRESSION",
    subdomain,
    weight: 1,
    text
  };
}

const CONTEXTS = [
  {
    key: "daily",
    text: {
      hu: "a mindennapi helyzetekben",
      en: "in everyday situations",
      de: "in alltäglichen Situationen",
      it: "nelle situazioni quotidiane",
      es: "en situaciones cotidianas",
      zh: "在日常情境中",
      ja: "日常の場面で",
      ar: "في المواقف اليومية",
      pl: "w codziennych sytuacjach",
      pt: "em situações do dia a dia",
      fr: "dans les situations quotidiennes"
    }
  },
  {
    key: "social",
    text: {
      hu: "társas helyzetekben",
      en: "in social situations",
      de: "in sozialen Situationen",
      it: "nelle situazioni sociali",
      es: "en situaciones sociales",
      zh: "在社交情境中",
      ja: "対人場面で",
      ar: "في المواقف الاجتماعية",
      pl: "w sytuacjach społecznych",
      pt: "em situações sociais",
      fr: "dans les situations sociales"
    }
  },
  {
    key: "school",
    text: {
      hu: "tanulási vagy iskolai helyzetekben",
      en: "during school or learning situations",
      de: "in schulischen Situationen",
      it: "nelle situazioni scolastiche",
      es: "en situaciones escolares",
      zh: "在学习或学校情境中",
      ja: "学校や学習場面で",
      ar: "في المواقف الدراسية",
      pl: "w sytuacjach szkolnych",
      pt: "em situações escolares",
      fr: "dans les situations scolaires"
    }
  },
  {
    key: "alone",
    text: {
      hu: "amikor egyedül van",
      en: "when alone",
      de: "wenn er/sie allein ist",
      it: "quando è da solo",
      es: "cuando está solo",
      zh: "独处时",
      ja: "一人でいるときに",
      ar: "عندما يكون بمفرده",
      pl: "kiedy jest sam",
      pt: "quando está sozinho",
      fr: "lorsqu'il est seul"
    }
  },
  {
    key: "stress",
    text: {
      hu: "megterhelő helyzetekben",
      en: "in stressful situations",
      de: "in belastenden Situationen",
      it: "in situazioni stressanti",
      es: "en situaciones estresantes",
      zh: "在压力情境中",
      ja: "ストレスのある場面で",
      ar: "في المواقف المجهدة",
      pl: "w sytuacjach stresowych",
      pt: "em situações estressantes",
      fr: "dans des situations stressantes"
    }
  }
];

const MOOD_BASE = [
  {
    text: {
      hu: "gyakran lehangoltnak vagy szomorúnak tűnik",
      en: "often appears sad or low in mood",
      de: "wirkt häufig traurig oder niedergeschlagen",
      it: "sembra spesso triste o giù di morale",
      es: "a menudo parece triste o desanimado",
      zh: "经常显得情绪低落或悲伤",
      ja: "気分が落ち込んでいるように見えることが多い",
      ar: "يبدو غالبًا حزينًا أو منخفض المزاج",
      pl: "często wydaje się smutny lub przygnębiony",
      pt: "frequentemente parece triste ou desanimado",
      fr: "semble souvent triste ou abattu"
    }
  },
  {
    text: {
      hu: "hangulata tartósan negatív irányba tolódik",
      en: "shows persistently negative mood",
      de: "zeigt anhaltend negative Stimmung",
      it: "mostra un umore negativamente persistente",
      es: "muestra un estado de ánimo persistentemente negativo",
      zh: "情绪持续偏向消极",
      ja: "気分が長くネガティブな状態に傾く",
      ar: "يُظهر مزاجًا سلبيًا مستمرًا",
      pl: "wykazuje utrzymujący się negatywny nastrój",
      pt: "apresenta humor persistentemente negativo",
      fr: "présente une humeur négative persistante"
    }
  },
  {
    text: {
      hu: "nehezen él meg örömöt vagy pozitív érzelmeket",
      en: "has difficulty experiencing positive emotions",
      de: "hat Schwierigkeiten, positive Gefühle zu erleben",
      it: "ha difficoltà a provare emozioni positive",
      es: "tiene dificultad para experimentar emociones positivas",
      zh: "难以体验积极情绪",
      ja: "ポジティブな感情を感じにくい",
      ar: "يجد صعوبة في الشعور بالمشاعر الإيجابية",
      pl: "ma trudność z odczuwaniem pozytywnych emocji",
      pt: "tem dificuldade em sentir emoções positivas",
      fr: "a du mal à ressentir des émotions positives"
    }
  },
  {
    text: {
      hu: "gyakran sírósabb vagy érzékenyebb a megszokottnál",
      en: "is more tearful or emotionally sensitive than usual",
      de: "ist weinerlicher oder empfindlicher als üblich",
      it: "è più incline al pianto o sensibile del solito",
      es: "es más lloroso o sensible de lo habitual",
      zh: "比平时更容易哭或更敏感",
      ja: "普段より涙もろく敏感になる",
      ar: "يكون أكثر بكاءً أو حساسية من المعتاد",
      pl: "jest bardziej płaczliwy lub wrażliwy niż zwykle",
      pt: "está mais choroso ou sensível que o habitual",
      fr: "est plus enclin à pleurer ou plus sensible que d'habitude"
    }
  },
  {
    text: {
      hu: "hangulata nehezen javul még pozitív helyzetekben is",
      en: "mood does not improve easily even in positive situations",
      de: "die Stimmung verbessert sich auch in positiven Situationen nur schwer",
      it: "l'umore non migliora facilmente anche in situazioni positive",
      es: "el estado de ánimo no mejora fácilmente incluso en situaciones positivas",
      zh: "即使在积极情境中情绪也难以改善",
      ja: "良い状況でも気分がなかなか上向かない",
      ar: "لا يتحسن مزاجه بسهولة حتى في المواقف الإيجابية",
      pl: "nastrój nie poprawia się łatwo nawet w pozytywnych sytuacjach",
      pt: "o humor não melhora facilmente mesmo em situações positivas",
      fr: "l'humeur ne s'améliore pas facilement même dans des situations positives"
    }
  }
];

const INTEREST_BASE = [
  {
    text: {
      hu: "elveszíti érdeklődését korábban kedvelt tevékenységek iránt",
      en: "loses interest in previously enjoyed activities",
      de: "verliert das Interesse an zuvor beliebten Aktivitäten",
      it: "perde interesse per attività precedentemente piacevoli",
      es: "pierde interés en actividades que antes disfrutaba",
      zh: "对以前喜欢的活动失去兴趣",
      ja: "以前好きだった活動に興味を失う",
      ar: "يفقد الاهتمام بالأنشطة التي كان يستمتع بها سابقًا",
      pl: "traci zainteresowanie wcześniej lubianymi aktywnościami",
      pt: "perde interesse em atividades que antes gostava",
      fr: "perd l'intérêt pour des activités auparavant appréciées"
    }
  },
  {
    text: {
      hu: "kevésbé lelkesedik olyan dolgokért, amelyek korábban örömet okoztak",
      en: "shows reduced enthusiasm for previously enjoyable things",
      de: "zeigt weniger Begeisterung für Dinge, die früher Freude bereitet haben",
      it: "mostra meno entusiasmo per attività prima piacevoli",
      es: "muestra menos entusiasmo por cosas que antes le gustaban",
      zh: "对以前带来快乐的事物热情减少",
      ja: "以前楽しんでいたことへの意欲が低下する",
      ar: "يُظهر حماسًا أقل للأشياء التي كانت ممتعة سابقًا",
      pl: "wykazuje mniejszy entuzjazm wobec rzeczy, które wcześniej sprawiały radość",
      pt: "mostra menos entusiasmo por coisas que antes gostava",
      fr: "montre moins d'enthousiasme pour des choses auparavant agréables"
    }
  },
  {
    text: {
      hu: "nehezen motiválható játékra vagy aktivitásra",
      en: "is difficult to motivate for play or activities",
      de: "lässt sich schwer zu Spiel oder Aktivitäten motivieren",
      it: "è difficile da motivare al gioco o alle attività",
      es: "es difícil de motivar para jugar o realizar actividades",
      zh: "难以被激发去参与游戏或活动",
      ja: "遊びや活動への動機づけが難しい",
      ar: "يصعب تحفيزه للعب أو الأنشطة",
      pl: "trudno go zmotywować do zabawy lub aktywności",
      pt: "é difícil de motivar para brincar ou realizar atividades",
      fr: "est difficile à motiver pour jouer ou faire des activités"
    }
  },
  {
    text: {
      hu: "inkább passzív, mint aktív a mindennapokban",
      en: "is more passive than active in daily life",
      de: "ist im Alltag eher passiv als aktiv",
      it: "è più passivo che attivo nella vita quotidiana",
      es: "es más pasivo que activo en la vida diaria",
      zh: "在日常生活中更偏向被动",
      ja: "日常生活で受け身になりがち",
      ar: "يميل إلى أن يكون سلبيًا أكثر من كونه نشطًا في الحياة اليومية",
      pl: "jest bardziej bierny niż aktywny na co dzień",
      pt: "é mais passivo do que ativo no dia a dia",
      fr: "est plus passif qu'actif dans la vie quotidienne"
    }
  },
  {
    text: {
      hu: "ritkábban kezdeményez tevékenységeket önállóan",
      en: "rarely initiates activities independently",
      de: "initiiert selten eigenständig Aktivitäten",
      it: "inizia raramente attività in modo autonomo",
      es: "rara vez inicia actividades por sí mismo",
      zh: "很少主动发起活动",
      ja: "自分から活動を始めることが少ない",
      ar: "نادرًا ما يبادر بالأنشطة بنفسه",
      pl: "rzadko inicjuje działania samodzielnie",
      pt: "raramente inicia atividades por conta própria",
      fr: "initie rarement des activités de lui-même"
    }
  }
];

const SELF_WORTH_BASE = [
  {
    text: {
      hu: "negatívan beszél önmagáról",
      en: "speaks negatively about themselves",
      de: "spricht negativ über sich selbst",
      it: "parla negativamente di sé",
      es: "habla negativamente de sí mismo",
      zh: "经常负面评价自己",
      ja: "自分について否定的に話す",
      ar: "يتحدث عن نفسه بشكل سلبي",
      pl: "mówi o sobie w negatywny sposób",
      pt: "fala negativamente sobre si mesmo",
      fr: "parle négativement de lui-même"
    }
  },
  {
    text: {
      hu: "gyakran hibáztatja magát dolgokért",
      en: "often blames themselves for things",
      de: "gibt sich häufig selbst die Schuld",
      it: "si incolpa spesso per le cose",
      es: "a menudo se culpa a sí mismo por las cosas",
      zh: "经常为事情责怪自己",
      ja: "物事について自分を責めることが多い",
      ar: "يلوم نفسه كثيرًا على الأمور",
      pl: "często obwinia siebie za różne rzeczy",
      pt: "frequentemente se culpa pelas coisas",
      fr: "se blâme souvent pour les choses"
    }
  },
  {
    text: {
      hu: "alacsonyabb önértékelést mutat",
      en: "shows low self-esteem",
      de: "zeigt ein geringes Selbstwertgefühl",
      it: "mostra bassa autostima",
      es: "muestra baja autoestima",
      zh: "表现出较低的自尊",
      ja: "自己評価が低い傾向がある",
      ar: "يُظهر تقديرًا منخفضًا للذات",
      pl: "ma niską samoocenę",
      pt: "apresenta baixa autoestima",
      fr: "présente une faible estime de soi"
    }
  },
  {
    text: {
      hu: "könnyen érzi magát értéktelennek vagy sikertelennek",
      en: "easily feels worthless or unsuccessful",
      de: "fühlt sich leicht wertlos oder erfolglos",
      it: "si sente facilmente inutile o fallito",
      es: "se siente fácilmente inútil o fracasado",
      zh: "容易觉得自己没有价值或失败",
      ja: "自分には価値がない、うまくいっていないと感じやすい",
      ar: "يشعر بسهولة بأنه عديم القيمة أو غير ناجح",
      pl: "łatwo czuje się bezwartościowy lub nieudany",
      pt: "sente-se facilmente sem valor ou fracassado",
      fr: "se sent facilement sans valeur ou en échec"
    }
  },
  {
    text: {
      hu: "túlzott bűntudatot él meg kisebb dolgok miatt is",
      en: "experiences excessive guilt over minor issues",
      de: "empfindet übermäßige Schuldgefühle auch bei kleinen Dingen",
      it: "prova sensi di colpa eccessivi anche per cose minori",
      es: "experimenta culpa excesiva por cosas pequeñas",
      zh: "会因小事产生过度内疚",
      ja: "些細なことでも強い罪悪感を感じやすい",
      ar: "يشعر بالذنب المفرط حتى تجاه أمور بسيطة",
      pl: "odczuwa nadmierne poczucie winy nawet za drobne sprawy",
      pt: "sente culpa excessiva por questões pequenas",
      fr: "ressent une culpabilité excessive pour des choses mineures"
    }
  }
];

const ENERGY_BASE = [
  {
    text: {
      hu: "gyakran fáradtnak vagy kimerültnek tűnik",
      en: "often appears tired or fatigued",
      de: "wirkt oft müde oder erschöpft",
      it: "sembra spesso stanco o affaticato",
      es: "a menudo parece cansado o fatigado",
      zh: "经常显得疲惫或精力不足",
      ja: "疲れているように見えることが多い",
      ar: "يبدو غالبًا متعبًا أو مرهقًا",
      pl: "często wygląda na zmęczonego lub wyczerpanego",
      pt: "frequentemente parece cansado ou fatigado",
      fr: "semble souvent fatigué ou épuisé"
    }
  },
  {
    text: {
      hu: "kevés energiát mutat a napi tevékenységekhez",
      en: "shows low energy for daily activities",
      de: "zeigt wenig Energie für tägliche Aktivitäten",
      it: "mostra poca energia per le attività quotidiane",
      es: "muestra poca energía para las actividades diarias",
      zh: "日常活动中精力较低",
      ja: "日常活動に対するエネルギーが低い",
      ar: "يُظهر طاقة منخفضة للأنشطة اليومية",
      pl: "ma mało energii do codziennych aktywności",
      pt: "apresenta pouca energia para atividades diárias",
      fr: "présente peu d'énergie pour les activités quotidiennes"
    }
  },
  {
    text: {
      hu: "lassabbnak vagy nehézkesebbnek tűnik a megszokottnál",
      en: "appears slower or more sluggish than usual",
      de: "wirkt langsamer oder träger als gewöhnlich",
      it: "appare più lento o rallentato del solito",
      es: "parece más lento o pesado de lo habitual",
      zh: "比平时更缓慢或迟钝",
      ja: "普段より動きが遅く感じられる",
      ar: "يبدو أبطأ أو أكثر خمولًا من المعتاد",
      pl: "wydaje się wolniejszy lub bardziej ociężały niż zwykle",
      pt: "parece mais lento ou letárgico que o normal",
      fr: "semble plus lent ou plus apathique que d'habitude"
    }
  },
  {
    text: {
      hu: "nehezen kezdi el vagy fejezi be a feladatokat",
      en: "has difficulty starting or completing tasks",
      de: "hat Schwierigkeiten, Aufgaben zu beginnen oder zu beenden",
      it: "ha difficoltà a iniziare o completare compiti",
      es: "tiene dificultad para iniciar o terminar tareas",
      zh: "难以开始或完成任务",
      ja: "課題を始めたり終えたりするのが難しい",
      ar: "يجد صعوبة في بدء أو إكمال المهام",
      pl: "ma trudność z rozpoczynaniem lub kończeniem zadań",
      pt: "tem dificuldade em iniciar ou concluir tarefas",
      fr: "a du mal à commencer ou terminer des tâches"
    }
  },
  {
    text: {
      hu: "motivációja jelentősen csökkent a megszokotthoz képest",
      en: "shows significantly reduced motivation compared to usual",
      de: "zeigt deutlich reduzierte Motivation im Vergleich zu früher",
      it: "mostra una motivazione significativamente ridotta rispetto al solito",
      es: "muestra una motivación significativamente reducida",
      zh: "动机明显下降",
      ja: "以前に比べて意欲が大きく低下している",
      ar: "يُظهر انخفاضًا ملحوظًا في الدافعية مقارنة بالمعتاد",
      pl: "wykazuje znacznie obniżoną motywację",
      pt: "apresenta motivação significativamente reduzida",
      fr: "présente une motivation nettement réduite"
    }
  }
];

const COGNITIVE_BASE = [
  {
    text: {
      hu: "negatívabban látja a helyzeteket, mint mások",
      en: "interprets situations more negatively than others",
      de: "interpretiert Situationen negativer als andere",
      it: "interpreta le situazioni in modo più negativo rispetto agli altri",
      es: "interpreta las situaciones de forma más negativa que otros",
      zh: "比他人更容易负面解读情境",
      ja: "他の人より状況をネガティブに捉えやすい",
      ar: "يفسر المواقف بشكل أكثر سلبية من الآخرين",
      pl: "interpretuje sytuacje bardziej negatywnie niż inni",
      pt: "interpreta situações de forma mais negativa que os outros",
      fr: "interprète les situations de manière plus négative que les autres"
    }
  },
  {
    text: {
      hu: "könnyen a negatív kimenetekre fókuszál",
      en: "focuses more on negative outcomes",
      de: "konzentriert sich eher auf negative Ergebnisse",
      it: "si concentra maggiormente sugli esiti negativi",
      es: "se enfoca más en resultados negativos",
      zh: "更容易关注负面结果",
      ja: "結果の悪い面に意識が向きやすい",
      ar: "يركز بسهولة على النتائج السلبية",
      pl: "łatwo koncentruje się na negatywnych wynikach",
      pt: "foca mais em resultados negativos",
      fr: "se focalise sur les résultats négatifs"
    }
  },
  {
    text: {
      hu: "nehezen látja meg a pozitív oldalát egy helyzetnek",
      en: "has difficulty seeing the positive side of situations",
      de: "hat Schwierigkeiten, die positive Seite von Situationen zu sehen",
      it: "ha difficoltà a vedere il lato positivo delle situazioni",
      es: "tiene dificultad para ver el lado positivo de las situaciones",
      zh: "难以看到事情的积极一面",
      ja: "状況のポジティブな面を見るのが難しい",
      ar: "يجد صعوبة في رؤية الجانب الإيجابي للمواقف",
      pl: "ma trudność z dostrzeganiem pozytywnej strony sytuacji",
      pt: "tem dificuldade em ver o lado positivo das situações",
      fr: "a du mal à voir le côté positif des situations"
    }
  },
  {
    text: {
      hu: "könnyen általánosít negatív tapasztalatokból",
      en: "generalizes negative experiences easily",
      de: "verallgemeinert negative Erfahrungen leicht",
      it: "generalizza facilmente esperienze negative",
      es: "generaliza fácilmente experiencias negativas",
      zh: "容易从负面经验中做出泛化",
      ja: "ネガティブな経験を広く一般化しやすい",
      ar: "يعمم التجارب السلبية بسهولة",
      pl: "łatwo uogólnia negatywne doświadczenia",
      pt: "generaliza experiências negativas facilmente",
      fr: "généralise facilement les expériences négatives"
    }
  },
  {
    text: {
      hu: "gondolkodása gyakran pesszimista irányba tolódik",
      en: "thinking tends toward pessimism",
      de: "zeigt eine eher pessimistische Denkweise",
      it: "il pensiero tende verso il pessimismo",
      es: "su pensamiento tiende al pesimismo",
      zh: "思维倾向于悲观",
      ja: "考え方が悲観的になりやすい",
      ar: "يميل تفكيره إلى التشاؤم",
      pl: "jego myślenie ma tendencję do pesymizmu",
      pt: "o pensamento tende ao pessimismo",
      fr: "sa pensée tend vers le pessimisme"
    }
  }
];

function buildQuestions(prefix, subdomain, baseItems, startIndex) {
  const out = [];
  let n = startIndex;

  baseItems.forEach((base) => {
    CONTEXTS.forEach((context) => {
      out.push(
        makeQuestion(
          makeId(prefix, n++),
          subdomain,
          {
            hu: `${base.text.hu} ${context.text.hu}.`,
            en: `${base.text.en} ${context.text.en}.`,
            de: `${base.text.de} ${context.text.de}.`,
            it: `${base.text.it} ${context.text.it}.`,
            es: `${base.text.es} ${context.text.es}.`,
            zh: `${base.text.zh}${context.text.zh}。`,
            ja: `${base.text.ja}${context.text.ja}。`,
            ar: `${base.text.ar} ${context.text.ar}.`,
            pl: `${base.text.pl} ${context.text.pl}.`,
            pt: `${base.text.pt} ${context.text.pt}.`,
            fr: `${base.text.fr} ${context.text.fr}.`
          }
        )
      );
    });
  });

  return out;
}

const MOOD = buildQuestions("depr", "mood_affect", MOOD_BASE, 1);
const INTEREST = buildQuestions("depr", "loss_of_interest", INTEREST_BASE, 51);
const SELF = buildQuestions("depr", "self_worth_guilt", SELF_WORTH_BASE, 101);
const ENERGY = buildQuestions("depr", "energy_motivation", ENERGY_BASE, 151);
const COGNITIVE = buildQuestions("depr", "cognitive_negative_bias", COGNITIVE_BASE, 201);

export const DEPRESSION_BANK = [
  ...MOOD,
  ...INTEREST,
  ...SELF,
  ...ENERGY,
  ...COGNITIVE
];