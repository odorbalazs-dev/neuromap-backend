function makeId(prefix, n) {
  return `${prefix}_${String(n).padStart(4, "0")}`;
}

function makeQuestion(id, subdomain, text) {
  return {
    id,
    domain: "ANXIETY",
    subdomain,
    weight: 1,
    text
  };
}

const CONTEXTS = [
  {
    key: "home_morning",
    text: {
      hu: "reggeli otthoni helyzetekben",
      en: "during morning routines at home",
      de: "während der morgendlichen Abläufe zu Hause",
      it: "durante la routine del mattino a casa",
      es: "durante las rutinas matutinas en casa",
      zh: "在家里的晨间日常中",
      ja: "家庭での朝の場面で",
      ar: "أثناء الروتين الصباحي في المنزل",
      pl: "podczas porannych czynności w domu",
      pt: "durante a rotina da manhã em casa",
      fr: "pendant les routines du matin à la maison"
    }
  },
  {
    key: "home_evening",
    text: {
      hu: "esti otthoni helyzetekben",
      en: "during evening routines at home",
      de: "während der abendlichen Abläufe zu Hause",
      it: "durante la routine serale a casa",
      es: "durante las rutinas nocturnas en casa",
      zh: "在家里的晚间日常中",
      ja: "家庭での夕方の場面で",
      ar: "أثناء الروتين المسائي في المنزل",
      pl: "podczas wieczornych czynności w domu",
      pt: "durante a rotina da noite em casa",
      fr: "pendant les routines du soir à la maison"
    }
  },
  {
    key: "school_tasks",
    text: {
      hu: "iskolai vagy tanulási feladatoknál",
      en: "during school or learning tasks",
      de: "bei schulischen oder lernbezogenen Aufgaben",
      it: "durante i compiti scolastici o di apprendimento",
      es: "durante tareas escolares o de aprendizaje",
      zh: "在学校或学习任务中",
      ja: "学校や学習課題の場面で",
      ar: "أثناء المهام المدرسية أو التعليمية",
      pl: "podczas zadań szkolnych lub edukacyjnych",
      pt: "durante tarefas escolares ou de aprendizagem",
      fr: "pendant les tâches scolaires ou d'apprentissage"
    }
  },
  {
    key: "group_settings",
    text: {
      hu: "csoportos helyzetekben",
      en: "in group situations",
      de: "in Gruppensituationen",
      it: "nelle situazioni di gruppo",
      es: "en situaciones de grupo",
      zh: "在群体情境中",
      ja: "集団場面で",
      ar: "في المواقف الجماعية",
      pl: "w sytuacjach grupowych",
      pt: "em situações de grupo",
      fr: "dans les situations de groupe"
    }
  },
  {
    key: "with_peers",
    text: {
      hu: "kortársakkal együtt",
      en: "when interacting with peers",
      de: "im Umgang mit Gleichaltrigen",
      it: "quando è con i coetanei",
      es: "al interactuar con sus compañeros",
      zh: "与同龄人互动时",
      ja: "同年代の子どもと関わるときに",
      ar: "عند التفاعل مع الأقران",
      pl: "podczas kontaktu z rówieśnikami",
      pt: "ao interagir com colegas",
      fr: "lors des interactions avec les pairs"
    }
  },
  {
    key: "with_adults",
    text: {
      hu: "felnőttekkel való helyzetekben",
      en: "when interacting with adults",
      de: "im Umgang mit Erwachsenen",
      it: "quando interagisce con adulti",
      es: "al interactuar con adultos",
      zh: "与成年人互动时",
      ja: "大人と関わるときに",
      ar: "عند التفاعل مع البالغين",
      pl: "podczas kontaktu z dorosłymi",
      pt: "ao interagir com adultos",
      fr: "lors des interactions avec des adultes"
    }
  },
  {
    key: "under_stress",
    text: {
      hu: "stresszes vagy terhelt helyzetekben",
      en: "in stressful or demanding situations",
      de: "in stressigen oder belastenden Situationen",
      it: "in situazioni stressanti o impegnative",
      es: "en situaciones estresantes o exigentes",
      zh: "在有压力或要求较高的情境中",
      ja: "ストレスの高い場面で",
      ar: "في المواقف الضاغطة أو المجهدة",
      pl: "w stresujących lub wymagających sytuacjach",
      pt: "em situações estressantes ou exigentes",
      fr: "dans les situations stressantes ou exigeantes"
    }
  },
  {
    key: "during_transitions",
    text: {
      hu: "átmeneteknél vagy váltásoknál",
      en: "during transitions or changes",
      de: "bei Übergängen oder Veränderungen",
      it: "durante i cambiamenti o le transizioni",
      es: "durante transiciones o cambios",
      zh: "在过渡或变化时",
      ja: "切り替えや変化の場面で",
      ar: "أثناء الانتقالات أو التغييرات",
      pl: "podczas zmian i przejść",
      pt: "durante transições ou mudanças",
      fr: "lors des transitions ou changements"
    }
  },
  {
    key: "free_play",
    text: {
      hu: "szabad játék vagy kötetlen helyzetek során",
      en: "during free play or unstructured situations",
      de: "beim freien Spiel oder in unstrukturierten Situationen",
      it: "durante il gioco libero o situazioni poco strutturate",
      es: "durante el juego libre o situaciones poco estructuradas",
      zh: "在自由游戏或非结构化情境中",
      ja: "自由遊びや構造化されていない場面で",
      ar: "أثناء اللعب الحر أو المواقف غير المنظمة",
      pl: "podczas swobodnej zabawy lub nieustrukturyzowanych sytuacji",
      pt: "durante brincadeiras livres ou situações pouco estruturadas",
      fr: "pendant le jeu libre ou les situations peu structurées"
    }
  },
  {
    key: "daily_life",
    text: {
      hu: "a mindennapi élet különböző helyzeteiben",
      en: "across different everyday situations",
      de: "in verschiedenen Alltagssituationen",
      it: "in diverse situazioni quotidiane",
      es: "en diferentes situaciones cotidianas",
      zh: "在日常生活的不同情境中",
      ja: "日常生活のさまざまな場面で",
      ar: "في مواقف الحياة اليومية المختلفة",
      pl: "w różnych codziennych sytuacjach",
      pt: "em diferentes situações do dia a dia",
      fr: "dans différentes situations du quotidien"
    }
  }
];

const GENERAL_WORRY_BASE = [
  {
    text: {
      hu: "sokat aggódik hétköznapi dolgok miatt",
      en: "worries a lot about everyday things",
      de: "sich viele Sorgen über alltägliche Dinge macht",
      it: "si preoccupa molto per le cose quotidiane",
      es: "se preocupa mucho por cosas cotidianas",
      zh: "经常为日常事情过度担心",
      ja: "日常のことについて強く心配することが多い",
      ar: "يقلق كثيرًا بشأن الأمور اليومية",
      pl: "bardzo martwi się codziennymi sprawami",
      pt: "preocupa-se muito com coisas do dia a dia",
      fr: "s'inquiète beaucoup pour des choses du quotidien"
    }
  },
  {
    text: {
      hu: "nehezen engedi el a nyugtalanító gondolatokat",
      en: "has difficulty letting go of worrying thoughts",
      de: "Schwierigkeiten hat, beunruhigende Gedanken loszulassen",
      it: "ha difficoltà a lasciar andare pensieri preoccupanti",
      es: "tiene dificultad para soltar pensamientos preocupantes",
      zh: "难以放下令人担忧的想法",
      ja: "不安な考えを手放すのが難しい",
      ar: "يجد صعوبة في التخلص من الأفكار المقلقة",
      pl: "ma trudność z odpuszczeniem niepokojących myśli",
      pt: "tem dificuldade em deixar de lado pensamentos preocupantes",
      fr: "a du mal à se détacher de pensées inquiétantes"
    }
  },
  {
    text: {
      hu: "akkor is számol lehetséges problémákkal, amikor erre kevés ok van",
      en: "expects possible problems even when there is little reason",
      de: "mit möglichen Problemen rechnet, auch wenn es wenig Anlass dafür gibt",
      it: "si aspetta possibili problemi anche quando ci sono pochi motivi",
      es: "anticipa posibles problemas incluso cuando hay poca razón para ello",
      zh: "即使理由不多也会预想可能出现问题",
      ja: "大きな理由がなくても問題を予想しやすい",
      ar: "يتوقع مشكلات محتملة حتى عندما لا يوجد سبب كبير لذلك",
      pl: "spodziewa się problemów nawet wtedy, gdy jest ku temu niewiele powodów",
      pt: "espera possíveis problemas mesmo quando há pouco motivo",
      fr: "anticipe des problèmes possibles même quand il y a peu de raisons de le faire"
    }
  },
  {
    text: {
      hu: "sokszor nehezen nyugszik meg, ha valami bizonytalan",
      en: "has trouble calming down when something feels uncertain",
      de: "sich schwer beruhigt, wenn etwas ungewiss erscheint",
      it: "fa fatica a calmarsi quando qualcosa appare incerto",
      es: "le cuesta calmarse cuando algo se siente incierto",
      zh: "当事情不确定时很难平静下来",
      ja: "何かが不確かだと落ち着くのが難しい",
      ar: "يجد صعوبة في الهدوء عندما يكون هناك أمر غير مؤكد",
      pl: "ma trudność z uspokojeniem się, gdy coś jest niepewne",
      pt: "tem dificuldade em se acalmar quando algo parece incerto",
      fr: "a du mal à se calmer quand quelque chose semble incertain"
    }
  },
  {
    text: {
      hu: "könnyen ráfókuszál a veszély vagy kudarc lehetőségére",
      en: "easily focuses on the possibility of danger or failure",
      de: "sich leicht auf die Möglichkeit von Gefahr oder Misserfolg fokussiert",
      it: "si concentra facilmente sulla possibilità di pericolo o fallimento",
      es: "se enfoca fácilmente en la posibilidad de peligro o fracaso",
      zh: "容易把注意力放在危险或失败的可能性上",
      ja: "危険や失敗の可能性に注意が向きやすい",
      ar: "يركز بسهولة على احتمال الخطر أو الفشل",
      pl: "łatwo koncentruje się na możliwości zagrożenia lub porażki",
      pt: "foca facilmente na possibilidade de perigo ou fracasso",
      fr: "se focalise facilement sur la possibilité de danger ou d'échec"
    }
  }
];

const UNCERTAINTY_BASE = [
  {
    text: {
      hu: "új vagy kiszámíthatatlan helyzetekben gyorsan feszültté válik",
      en: "becomes tense quickly in new or unpredictable situations",
      de: "in neuen oder unvorhersehbaren Situationen schnell angespannt wird",
      it: "diventa rapidamente teso in situazioni nuove o imprevedibili",
      es: "se pone tenso rápidamente en situaciones nuevas o impredecibles",
      zh: "在新的或不可预测的情境中很快变得紧张",
      ja: "新しい、または予測しにくい状況で緊張しやすい",
      ar: "يتوتر بسرعة في المواقف الجديدة أو غير المتوقعة",
      pl: "szybko się napina w nowych lub nieprzewidywalnych sytuacjach",
      pt: "fica tenso rapidamente em situações novas ou imprevisíveis",
      fr: "devient rapidement tendu dans des situations nouvelles ou imprévisibles"
    }
  },
  {
    text: {
      hu: "nehezen viseli, ha nem tudja előre, mi fog történni",
      en: "struggles when not knowing in advance what will happen",
      de: "es schwer erträgt, nicht im Voraus zu wissen, was passieren wird",
      it: "fatica quando non sa in anticipo cosa accadrà",
      es: "le cuesta no saber de antemano qué va a pasar",
      zh: "当无法提前知道会发生什么时会很难受",
      ja: "何が起こるか前もってわからないとつらさが強い",
      ar: "يجد صعوبة عندما لا يعرف مسبقًا ما الذي سيحدث",
      pl: "trudno mu znieść brak wcześniejszej wiedzy o tym, co się wydarzy",
      pt: "tem dificuldade quando não sabe antecipadamente o que vai acontecer",
      fr: "supporte difficilement de ne pas savoir à l'avance ce qui va se passer"
    }
  },
  {
    text: {
      hu: "biztonságosabban érzi magát, ha mindent előre tisztázni tud",
      en: "feels safer when everything can be clarified in advance",
      de: "sich sicherer fühlt, wenn alles im Voraus geklärt werden kann",
      it: "si sente più al sicuro quando tutto può essere chiarito in anticipo",
      es: "se siente más seguro cuando todo puede aclararse de antemano",
      zh: "当一切都能提前讲清楚时会更有安全感",
      ja: "あらかじめすべてが明確だと安心しやすい",
      ar: "يشعر بأمان أكبر عندما يمكن توضيح كل شيء مسبقًا",
      pl: "czuje się bezpieczniej, gdy wszystko można wyjaśnić wcześniej",
      pt: "sente-se mais seguro quando tudo pode ser esclarecido com antecedência",
      fr: "se sent plus en sécurité quand tout peut être clarifié à l'avance"
    }
  },
  {
    text: {
      hu: "váratlan változások fokozott nyugtalanságot váltanak ki belőle",
      en: "unexpected changes trigger heightened unease",
      de: "unerwartete Veränderungen verstärkte Unruhe auslösen",
      it: "i cambiamenti inattesi provocano maggiore inquietudine",
      es: "los cambios inesperados desencadenan mayor inquietud",
      zh: "突发变化会引发更强的不安",
      ja: "予期しない変化で不安が強まりやすい",
      ar: "تثير التغييرات غير المتوقعة توترًا متزايدًا لديه",
      pl: "nieoczekiwane zmiany wywołują zwiększony niepokój",
      pt: "mudanças inesperadas desencadeiam maior inquietação",
      fr: "les changements imprévus déclenchent une inquiétude accrue"
    }
  },
  {
    text: {
      hu: "sok energiát fordít arra, hogy előre felkészüljön a bizonytalan helyzetekre",
      en: "puts a lot of energy into preparing for uncertain situations",
      de: "viel Energie darauf verwendet, sich auf ungewisse Situationen vorzubereiten",
      it: "impiega molta energia per prepararsi a situazioni incerte",
      es: "dedica mucha energía a prepararse para situaciones inciertas",
      zh: "会花很多精力为不确定情境做准备",
      ja: "不確かな状況に備えることに多くのエネルギーを使う",
      ar: "يبذل الكثير من الطاقة للاستعداد للمواقف غير المؤكدة",
      pl: "wkłada dużo energii w przygotowanie się do niepewnych sytuacji",
      pt: "gasta muita energia para se preparar para situações incertas",
      fr: "consacre beaucoup d'énergie à se préparer aux situations incertaines"
    }
  }
];

const PHYSICAL_BASE = [
  {
    text: {
      hu: "stresszhelyzetekben testi panaszokat mutat",
      en: "shows physical complaints in stressful situations",
      de: "in Stresssituationen körperliche Beschwerden zeigt",
      it: "mostra disturbi fisici in situazioni stressanti",
      es: "presenta molestias físicas en situaciones estresantes",
      zh: "在压力情境下会出现身体不适",
      ja: "ストレス状況で身体症状が出やすい",
      ar: "تظهر عليه شكاوى جسدية في المواقف الضاغطة",
      pl: "w stresujących sytuacjach ma objawy somatyczne",
      pt: "apresenta queixas físicas em situações de estresse",
      fr: "présente des plaintes physiques en situation stressante"
    }
  },
  {
    text: {
      hu: "szorongáskor gyomor-, fej- vagy egyéb testi tünetei erősödnek",
      en: "shows stronger stomach, headache, or other bodily symptoms when anxious",
      de: "bei Angst verstärkte Magen-, Kopf- oder andere körperliche Symptome zeigt",
      it: "mostra sintomi fisici più forti quando è ansioso, come mal di stomaco o mal di testa",
      es: "muestra síntomas físicos más intensos al estar ansioso, como dolor de estómago o cabeza",
      zh: "焦虑时胃痛、头痛或其他身体症状会加重",
      ja: "不安が強いと腹痛や頭痛などの身体症状が強まる",
      ar: "تشتد لديه أعراض جسدية مثل ألم المعدة أو الرأس عند القلق",
      pl: "przy lęku nasilają się u niego bóle brzucha, głowy lub inne objawy somatyczne",
      pt: "apresenta sintomas físicos mais fortes quando ansioso, como dor de barriga ou de cabeça",
      fr: "présente des symptômes physiques plus marqués quand il est anxieux, comme des maux de ventre ou de tête"
    }
  },
  {
    text: {
      hu: "feszültség esetén nehezen lazul el testileg",
      en: "has difficulty relaxing physically when tense",
      de: "sich körperlich schwer entspannen kann, wenn Spannung da ist",
      it: "ha difficoltà a rilassarsi fisicamente quando è teso",
      es: "tiene dificultad para relajarse físicamente cuando está tenso",
      zh: "紧张时身体很难放松下来",
      ja: "緊張していると身体的にリラックスしにくい",
      ar: "يجد صعوبة في الاسترخاء الجسدي عند التوتر",
      pl: "ma trudność z fizycznym rozluźnieniem się, gdy jest spięty",
      pt: "tem dificuldade em relaxar fisicamente quando está tenso",
      fr: "a du mal à se détendre physiquement lorsqu'il est tendu"
    }
  },
  {
    text: {
      hu: "szorongáskor alvás, étvágy vagy testi komfort terén változások látszanak",
      en: "shows changes in sleep, appetite, or physical comfort when anxious",
      de: "bei Angst Veränderungen in Schlaf, Appetit oder körperlichem Wohlbefinden zeigt",
      it: "mostra cambiamenti nel sonno, appetito o benessere fisico quando è ansioso",
      es: "muestra cambios en sueño, apetito o bienestar físico cuando está ansioso",
      zh: "焦虑时睡眠、食欲或身体舒适感会发生变化",
      ja: "不安時に睡眠・食欲・身体の快適さに変化が見られる",
      ar: "تظهر تغيرات في النوم أو الشهية أو الراحة الجسدية عند القلق",
      pl: "przy lęku pojawiają się zmiany w śnie, apetycie lub komforcie fizycznym",
      pt: "apresenta mudanças no sono, apetite ou conforto físico quando ansioso",
      fr: "présente des changements de sommeil, d'appétit ou de confort physique lorsqu'il est anxieux"
    }
  },
  {
    text: {
      hu: "testileg is erősen reagál a megterhelő helyzetekre",
      en: "reacts strongly on a bodily level to demanding situations",
      de: "auch körperlich stark auf belastende Situationen reagiert",
      it: "reagisce fortemente a livello fisico alle situazioni impegnative",
      es: "reacciona con fuerza a nivel corporal ante situaciones exigentes",
      zh: "在高要求情境下身体反应也很强烈",
      ja: "負担の大きい状況に身体的にも強く反応する",
      ar: "يتفاعل جسديًا بقوة مع المواقف المجهدة",
      pl: "silnie reaguje fizycznie na obciążające sytuacje",
      pt: "reage fortemente no corpo a situações exigentes",
      fr: "réagit fortement au niveau corporel dans les situations exigeantes"
    }
  }
];

const AVOIDANCE_BASE = [
  {
    text: {
      hu: "kerüli azokat a helyzeteket, ahol hibázhat vagy megítélhetik",
      en: "avoids situations where mistakes or judgment are possible",
      de: "Situationen vermeidet, in denen Fehler oder Bewertung möglich sind",
      it: "evita situazioni in cui potrebbe sbagliare o essere giudicato",
      es: "evita situaciones en las que podría equivocarse o ser juzgado",
      zh: "回避可能犯错或被评价的情境",
      ja: "失敗したり評価されたりする場面を避ける",
      ar: "يتجنب المواقف التي قد يخطئ فيها أو يتعرض فيها للتقييم",
      pl: "unika sytuacji, w których może popełnić błąd lub zostać oceniony",
      pt: "evita situações em que pode errar ou ser julgado",
      fr: "évite les situations dans lesquelles il pourrait se tromper ou être jugé"
    }
  },
  {
    text: {
      hu: "biztonságosabbnak érzi a helyzeteket, ha vannak megnyugtató kapaszkodói",
      en: "feels safer when there are reassuring supports or routines",
      de: "sich sicherer fühlt, wenn beruhigende Sicherheiten oder Routinen vorhanden sind",
      it: "si sente più al sicuro quando ci sono appigli rassicuranti o routine",
      es: "se siente más seguro cuando hay apoyos o rutinas tranquilizadoras",
      zh: "当有让人安心的依靠或固定做法时会更有安全感",
      ja: "安心できる手がかりや決まったやり方があると安全に感じやすい",
      ar: "يشعر بأمان أكبر عندما توجد عوامل أو روتينات مطمئنة",
      pl: "czuje się bezpieczniej, gdy ma uspokajające punkty odniesienia lub rutyny",
      pt: "sente-se mais seguro quando há apoios ou rotinas tranquilizadoras",
      fr: "se sent plus en sécurité lorsqu'il existe des repères ou routines rassurants"
    }
  },
  {
    text: {
      hu: "gyakran keres megerősítést vagy biztosítékot, mielőtt belekezd valamibe",
      en: "often seeks reassurance before starting something",
      de: "häufig Rückversicherung sucht, bevor etwas begonnen wird",
      it: "cerca spesso rassicurazione prima di iniziare qualcosa",
      es: "busca con frecuencia confirmación antes de empezar algo",
      zh: "在开始做事前经常需要反复确认或安慰",
      ja: "何かを始める前に安心材料を求めることが多い",
      ar: "غالبًا ما يطلب طمأنة قبل البدء بشيء ما",
      pl: "często szuka upewnienia, zanim coś zacznie",
      pt: "frequentemente procura confirmação antes de começar algo",
      fr: "cherche souvent à être rassuré avant de commencer quelque chose"
    }
  },
  {
    text: {
      hu: "inkább elkerül kihívást jelentő helyzeteket, mintsem megpróbálja kezelni őket",
      en: "is more likely to avoid challenging situations than face them",
      de: "herausfordernde Situationen eher meidet, als sich ihnen zu stellen",
      it: "tende più a evitare situazioni difficili che ad affrontarle",
      es: "tiende más a evitar situaciones desafiantes que a afrontarlas",
      zh: "相比面对挑战，更倾向于回避",
      ja: "難しい状況に向き合うより避ける傾向が強い",
      ar: "يميل إلى تجنب المواقف الصعبة بدلًا من مواجهتها",
      pl: "częściej unika trudnych sytuacji, niż próbuje im sprostać",
      pt: "tende a evitar situações desafiadoras em vez de enfrentá-las",
      fr: "a tendance à éviter les situations difficiles plutôt qu'à les affronter"
    }
  },
  {
    text: {
      hu: "láthatóan megkönnyebbül, ha ki tud kerülni egy szorongáskeltő helyzetből",
      en: "shows visible relief when able to avoid an anxiety-provoking situation",
      de: "sichtbar erleichtert ist, wenn eine angstauslösende Situation vermieden werden kann",
      it: "mostra sollievo evidente quando riesce a evitare una situazione ansiogena",
      es: "muestra alivio visible cuando logra evitar una situación que le genera ansiedad",
      zh: "当成功避开令人焦虑的情境时会明显松一口气",
      ja: "不安を引き起こす状況を避けられると明らかに安心する",
      ar: "يُظهر ارتياحًا واضحًا عندما يتمكن من تجنب موقف مثير للقلق",
      pl: "wyraźnie odczuwa ulgę, gdy uda mu się uniknąć sytuacji wywołującej lęk",
      pt: "mostra alívio visível quando consegue evitar uma situação ansiogênica",
      fr: "montre un soulagement visible lorsqu'il peut éviter une situation anxiogène"
    }
  }
];

const PERFORMANCE_BASE = [
  {
    text: {
      hu: "teljesítményhelyzetek előtt erősen szorongóvá válik",
      en: "becomes strongly anxious before performance situations",
      de: "vor Leistungssituationen stark ängstlich wird",
      it: "diventa molto ansioso prima di situazioni di prestazione",
      es: "se vuelve muy ansioso antes de situaciones de rendimiento",
      zh: "在需要表现的情境前会明显焦虑",
      ja: "評価や発表の場面の前に強く不安になる",
      ar: "يصبح قلقًا بشدة قبل مواقف الأداء أو التقييم",
      pl: "silnie się niepokoi przed sytuacjami oceny lub występu",
      pt: "fica muito ansioso antes de situações de desempenho",
      fr: "devient très anxieux avant les situations de performance"
    }
  },
  {
    text: {
      hu: "érzékeny arra, hogyan értékelik vagy mit gondolnak róla mások",
      en: "is highly sensitive to how others evaluate or think about them",
      de: "empfindlich darauf reagiert, wie andere ihn/sie bewerten oder über ihn/sie denken",
      it: "è molto sensibile a come gli altri lo valutano o lo percepiscono",
      es: "es muy sensible a cómo lo evalúan o qué piensan de él los demás",
      zh: "对他人如何评价自己非常敏感",
      ja: "他人がどう評価するか、どう思うかにとても敏感である",
      ar: "حساس جدًا لكيفية تقييم الآخرين له أو لما يعتقدونه عنه",
      pl: "jest bardzo wrażliwy na to, jak inni go oceniają lub co o nim myślą",
      pt: "é muito sensível a como os outros o avaliam ou pensam sobre ele",
      fr: "est très sensible à la façon dont les autres l'évaluent ou pensent à son sujet"
    }
  },
  {
    text: {
      hu: "csoportos vagy nyilvános helyzetekben könnyebben visszahúzódik",
      en: "withdraws more easily in group or public situations",
      de: "sich in Gruppen- oder öffentlichen Situationen leichter zurückzieht",
      it: "si ritira più facilmente in situazioni di gruppo o pubbliche",
      es: "se retrae con más facilidad en situaciones grupales o públicas",
      zh: "在群体或公开场合中更容易退缩",
      ja: "集団や人前の場面で引っ込みやすい",
      ar: "ينسحب بسهولة أكبر في المواقف الجماعية أو العلنية",
      pl: "łatwiej wycofuje się w sytuacjach grupowych lub publicznych",
      pt: "retrai-se mais facilmente em situações de grupo ou públicas",
      fr: "se retire plus facilement dans les situations de groupe ou en public"
    }
  },
  {
    text: {
      hu: "félhet attól, hogy hibázik vagy kellemetlen helyzetbe kerül mások előtt",
      en: "may fear making mistakes or feeling embarrassed in front of others",
      de: "Angst haben kann, Fehler zu machen oder sich vor anderen zu blamieren",
      it: "può temere di sbagliare o sentirsi in imbarazzo davanti agli altri",
      es: "puede temer equivocarse o sentirse avergonzado delante de otros",
      zh: "可能担心在别人面前出错或出丑",
      ja: "人前で失敗したり恥ずかしい思いをしたりすることを恐れることがある",
      ar: "قد يخاف من ارتكاب الأخطاء أو الشعور بالإحراج أمام الآخرين",
      pl: "może obawiać się popełnienia błędu lub zawstydzenia przy innych",
      pt: "pode ter medo de errar ou passar vergonha diante dos outros",
      fr: "peut craindre de faire des erreurs ou de se sentir gêné devant les autres"
    }
  },
  {
    text: {
      hu: "nehezen mutatja meg, mit tud, ha figyelik vagy értékelik",
      en: "has difficulty showing what they know when observed or evaluated",
      de: "Schwierigkeiten hat zu zeigen, was er/sie kann, wenn Beobachtung oder Bewertung stattfindet",
      it: "ha difficoltà a mostrare ciò che sa quando viene osservato o valutato",
      es: "le cuesta mostrar lo que sabe cuando lo observan o evalúan",
      zh: "在被观察或评价时难以展示自己的能力",
      ja: "見られたり評価されたりすると力を発揮しにくい",
      ar: "يجد صعوبة في إظهار ما يعرفه عندما يكون تحت الملاحظة أو التقييم",
      pl: "ma trudność z pokazaniem, co potrafi, gdy jest obserwowany lub oceniany",
      pt: "tem dificuldade em mostrar o que sabe quando está sendo observado ou avaliado",
      fr: "a du mal à montrer ce qu'il sait lorsqu'il est observé ou évalué"
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

const GENERAL_WORRY_QUESTIONS = buildQuestions("anxiety", "general_worry", GENERAL_WORRY_BASE, 1);           // 50
const UNCERTAINTY_QUESTIONS = buildQuestions("anxiety", "uncertainty_intolerance", UNCERTAINTY_BASE, 51);    // 50
const PHYSICAL_QUESTIONS = buildQuestions("anxiety", "physical_anxiety", PHYSICAL_BASE, 101);                // 50
const AVOIDANCE_QUESTIONS = buildQuestions("anxiety", "avoidance_safety", AVOIDANCE_BASE, 151);             // 50
const PERFORMANCE_QUESTIONS = buildQuestions("anxiety", "performance_social_anxiety", PERFORMANCE_BASE, 201); // 50

export const ANXIETY_BANK = [
  ...GENERAL_WORRY_QUESTIONS,
  ...UNCERTAINTY_QUESTIONS,
  ...PHYSICAL_QUESTIONS,
  ...AVOIDANCE_QUESTIONS,
  ...PERFORMANCE_QUESTIONS
];