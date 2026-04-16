function makeId(prefix, n) {
  return `${prefix}_${String(n).padStart(4, "0")}`;
}

function makeQuestion(id, tags, text) {
  return {
    id,
    tags,
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

const ADHD_BASE = [
  {
    text: {
      hu: "gyakran elterelődik a figyelme",
      en: "often gets distracted",
      de: "sich häufig leicht ablenken lässt",
      it: "si distrae spesso",
      es: "se distrae con frecuencia",
      zh: "经常容易分心",
      ja: "気が散りやすい",
      ar: "يتشتت انتباهه كثيرًا",
      pl: "często łatwo się rozprasza",
      pt: "se distrai com frequência",
      fr: "se laisse souvent distraire"
    }
  },
  {
    text: {
      hu: "nehezen tartja fenn a figyelmét egy feladaton",
      en: "has difficulty sustaining attention on a task",
      de: "Schwierigkeiten hat, die Aufmerksamkeit bei einer Aufgabe aufrechtzuerhalten",
      it: "ha difficoltà a mantenere l'attenzione su un compito",
      es: "tiene dificultad para mantener la atención en una tarea",
      zh: "难以在任务上持续保持注意力",
      ja: "課題に注意を向け続けるのが難しい",
      ar: "يجد صعوبة في الحفاظ على الانتباه أثناء المهمة",
      pl: "ma trudność z utrzymaniem uwagi na zadaniu",
      pt: "tem dificuldade em manter a atenção em uma tarefa",
      fr: "a du mal à maintenir son attention sur une tâche"
    }
  },
  {
    text: {
      hu: "gyakran félbehagyja a megkezdett tevékenységeket",
      en: "often leaves started activities unfinished",
      de: "begonnene Aktivitäten oft nicht zu Ende führt",
      it: "lascia spesso incomplete le attività iniziate",
      es: "a menudo deja sin terminar las actividades iniciadas",
      zh: "经常把开始的活动做到一半就停下",
      ja: "始めた活動を最後まで終えないことが多い",
      ar: "غالبًا ما يترك الأنشطة التي بدأها دون إكمال",
      pl: "często nie kończy rozpoczętych aktywności",
      pt: "frequentemente deixa inacabadas atividades que começou",
      fr: "laisse souvent inachevées les activités commencées"
    }
  },
  {
    text: {
      hu: "impulzívan reagál, mielőtt végiggondolná a helyzetet",
      en: "reacts impulsively before thinking through the situation",
      de: "impulsiv reagiert, bevor die Situation durchdacht ist",
      it: "reagisce impulsivamente prima di riflettere sulla situazione",
      es: "reacciona impulsivamente antes de pensar la situación",
      zh: "常常在没想清楚前就冲动反应",
      ja: "状況を考える前に衝動的に反応する",
      ar: "يتصرف باندفاع قبل التفكير في الموقف",
      pl: "reaguje impulsywnie, zanim przemyśli sytuację",
      pt: "reage impulsivamente antes de pensar na situação",
      fr: "réagit impulsivement avant d'avoir réfléchi à la situation"
    }
  },
  {
    text: {
      hu: "nehezen várja ki a sorát vagy a megfelelő pillanatot",
      en: "has difficulty waiting for their turn or the right moment",
      de: "Schwierigkeiten hat, auf die eigene Reihe oder den richtigen Moment zu warten",
      it: "ha difficoltà ad aspettare il proprio turno o il momento giusto",
      es: "le cuesta esperar su turno o el momento adecuado",
      zh: "难以等待轮到自己或等待合适时机",
      ja: "順番や適切なタイミングを待つのが難しい",
      ar: "يجد صعوبة في انتظار دوره أو اللحظة المناسبة",
      pl: "ma trudność z czekaniem na swoją kolej lub odpowiedni moment",
      pt: "tem dificuldade em esperar sua vez ou o momento certo",
      fr: "a du mal à attendre son tour ou le bon moment"
    }
  }
];

const ASD_BASE = [
  {
    text: {
      hu: "kerüli vagy ritkán keresi a szemkontaktust",
      en: "avoids or rarely seeks eye contact",
      de: "Blickkontakt vermeidet oder selten sucht",
      it: "evita o cerca raramente il contatto visivo",
      es: "evita o rara vez busca contacto visual",
      zh: "回避或很少主动进行眼神交流",
      ja: "視線を合わせることを避ける、またはあまり求めない",
      ar: "يتجنب التواصل البصري أو نادرًا ما يسعى إليه",
      pl: "unika kontaktu wzrokowego lub rzadko go nawiązuje",
      pt: "evita ou raramente busca contato visual",
      fr: "évite ou recherche rarement le contact visuel"
    }
  },
  {
    text: {
      hu: "nehezen értelmezi mások nonverbális jelzéseit",
      en: "has difficulty interpreting others' nonverbal cues",
      de: "Schwierigkeiten hat, nonverbale Signale anderer zu deuten",
      it: "ha difficoltà a interpretare i segnali non verbali degli altri",
      es: "tiene dificultad para interpretar las señales no verbales de los demás",
      zh: "难以理解他人的非语言信号",
      ja: "他者の非言語的なサインを読み取るのが難しい",
      ar: "يجد صعوبة في تفسير الإشارات غير اللفظية لدى الآخرين",
      pl: "ma trudność z interpretacją niewerbalnych sygnałów innych osób",
      pt: "tem dificuldade em interpretar sinais não verbais dos outros",
      fr: "a du mal à interpréter les signaux non verbaux des autres"
    }
  },
  {
    text: {
      hu: "erősen ragaszkodik a megszokott rutinokhoz",
      en: "strongly relies on familiar routines",
      de: "stark an vertrauten Routinen festhält",
      it: "si affida fortemente a routine familiari",
      es: "se apoya mucho en rutinas conocidas",
      zh: "强烈依赖熟悉的固定惯例",
      ja: "慣れたルーティンに強くこだわる",
      ar: "يتمسك بشدة بالروتينات المألوفة",
      pl: "silnie trzyma się znanych rutyn",
      pt: "depende fortemente de rotinas familiares",
      fr: "s'appuie fortement sur des routines familières"
    }
  },
  {
    text: {
      hu: "szűk, intenzív érdeklődést mutat bizonyos témák iránt",
      en: "shows narrow and intense interests in certain topics",
      de: "enge und intensive Interessen an bestimmten Themen zeigt",
      it: "mostra interessi ristretti e intensi per certi temi",
      es: "muestra intereses estrechos e intensos por ciertos temas",
      zh: "对某些主题表现出狭窄而强烈的兴趣",
      ja: "特定のテーマに狭く強い関心を示す",
      ar: "يُظهر اهتمامات ضيقة ومكثفة تجاه مواضيع معينة",
      pl: "wykazuje wąskie i intensywne zainteresowania określonymi tematami",
      pt: "mostra interesses restritos e intensos por certos temas",
      fr: "montre des intérêts étroits et intenses pour certains sujets"
    }
  },
  {
    text: {
      hu: "nehezen oszt meg örömöt, érdeklődést vagy élményt másokkal",
      en: "has difficulty sharing joy, interest, or experiences with others",
      de: "Schwierigkeiten hat, Freude, Interesse oder Erlebnisse mit anderen zu teilen",
      it: "ha difficoltà a condividere gioia, interesse o esperienze con gli altri",
      es: "tiene dificultad para compartir alegría, interés o experiencias con los demás",
      zh: "难以与他人分享快乐、兴趣或经历",
      ja: "喜びや興味、経験を他者と共有するのが難しい",
      ar: "يجد صعوبة في مشاركة الفرح أو الاهتمام أو الخبرات مع الآخرين",
      pl: "ma trudność z dzieleniem się radością, zainteresowaniem lub doświadczeniami z innymi",
      pt: "tem dificuldade em compartilhar alegria, interesse ou experiências com os outros",
      fr: "a du mal à partager la joie, l'intérêt ou les expériences avec les autres"
    }
  }
];

const ANXIETY_BASE = [
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
      hu: "új helyzetekben vagy ismeretlen környezetben könnyen feszültté válik",
      en: "becomes tense in new or unfamiliar situations",
      de: "in neuen oder ungewohnten Situationen angespannt wird",
      it: "diventa teso in situazioni nuove o non familiari",
      es: "se pone tenso en situaciones nuevas o desconocidas",
      zh: "在新环境或陌生情境中容易紧张",
      ja: "新しい状況や慣れない環境で緊張しやすい",
      ar: "يتوتر بسهولة في المواقف الجديدة أو غير المألوفة",
      pl: "łatwo się napina w nowych lub nieznanych sytuacjach",
      pt: "fica tenso em situações novas ou desconhecidas",
      fr: "devient tendu dans des situations nouvelles ou inconnues"
    }
  },
  {
    text: {
      hu: "gyakran kér ismételt megnyugtatást",
      en: "frequently seeks repeated reassurance",
      de: "häufig wiederholt Beruhigung sucht",
      it: "cerca spesso rassicurazione ripetuta",
      es: "busca con frecuencia tranquilidad repetida",
      zh: "经常反复寻求安慰和确认",
      ja: "繰り返し安心させてもらおうとすることが多い",
      ar: "يطلب الطمأنة بشكل متكرر",
      pl: "często potrzebuje wielokrotnego uspokajania",
      pt: "procura repetidamente por tranquilização",
      fr: "cherche fréquemment des réassurances répétées"
    }
  },
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
  }
];

const DEPRESSION_BASE = [
  {
    text: {
      hu: "gyakran szomorúnak, lehangoltnak vagy örömtelennek tűnik",
      en: "often seems sad, down, or joyless",
      de: "oft traurig, niedergeschlagen oder freudlos wirkt",
      it: "sembra spesso triste, giù o privo di gioia",
      es: "a menudo parece triste, decaído o sin alegría",
      zh: "经常显得悲伤、低落或缺乏愉快感",
      ja: "悲しそう、落ち込んでいる、または楽しさが少ないように見えることが多い",
      ar: "يبدو غالبًا حزينًا أو منخفض المزاج أو قليل الفرح",
      pl: "często wydaje się smutny, przygnębiony lub pozbawiony radości",
      pt: "frequentemente parece triste, abatido ou sem alegria",
      fr: "semble souvent triste, abattu ou sans joie"
    }
  },
  {
    text: {
      hu: "kevesebb érdeklődést mutat a korábban kedvelt tevékenységek iránt",
      en: "shows less interest in activities once enjoyed",
      de: "weniger Interesse an früher gern gemachten Aktivitäten zeigt",
      it: "mostra meno interesse per attività che prima piacevano",
      es: "muestra menos interés por actividades que antes disfrutaba",
      zh: "对以前喜欢的活动兴趣下降",
      ja: "以前楽しんでいた活動への関心が減っている",
      ar: "يُظهر اهتمامًا أقل بالأنشطة التي كان يستمتع بها سابقًا",
      pl: "wykazuje mniejsze zainteresowanie aktywnościami, które wcześniej lubił",
      pt: "mostra menos interesse por atividades de que antes gostava",
      fr: "montre moins d'intérêt pour des activités auparavant appréciées"
    }
  },
  {
    text: {
      hu: "gyakran negatívan beszél magáról",
      en: "often speaks negatively about self",
      de: "oft negativ über sich selbst spricht",
      it: "parla spesso in modo negativo di sé",
      es: "habla con frecuencia negativamente de sí mismo",
      zh: "经常对自己做负面评价",
      ja: "自分について否定的に話すことが多い",
      ar: "يتحدث عن نفسه بشكل سلبي كثيرًا",
      pl: "często mówi o sobie negatywnie",
      pt: "fala negativamente sobre si com frequência",
      fr: "parle souvent négativement de lui-même"
    }
  },
  {
    text: {
      hu: "könnyen elsírja magát vagy ingerlékennyé válik",
      en: "cries easily or becomes irritable",
      de: "leicht weint oder reizbar wird",
      it: "piange facilmente o diventa irritabile",
      es: "llora con facilidad o se irrita",
      zh: "容易哭泣或变得烦躁",
      ja: "泣きやすい、またはいら立ちやすい",
      ar: "يبكي بسهولة أو يصبح سريع الانفعال",
      pl: "łatwo płacze lub staje się drażliwy",
      pt: "chora facilmente ou fica irritadiço",
      fr: "pleure facilement ou devient irritable"
    }
  },
  {
    text: {
      hu: "fáradékonynak vagy motiválatlannak tűnik",
      en: "seems tired or unmotivated",
      de: "müde oder unmotiviert wirkt",
      it: "sembra stanco o demotivato",
      es: "parece cansado o desmotivado",
      zh: "显得疲惫或缺乏动力",
      ja: "疲れていたり意欲が低かったりするように見える",
      ar: "يبدو متعبًا أو يفتقر إلى الدافعية",
      pl: "wydaje się zmęczony lub pozbawiony motywacji",
      pt: "parece cansado ou desmotivado",
      fr: "semble fatigué ou démotivé"
    }
  }
];

const LEARNING_BASE = [
  {
    text: {
      hu: "nehezen boldogul az olvasási feladatokkal",
      en: "has difficulty with reading tasks",
      de: "Schwierigkeiten bei Leseaufgaben hat",
      it: "ha difficoltà con i compiti di lettura",
      es: "tiene dificultad con tareas de lectura",
      zh: "阅读任务有困难",
      ja: "読みの課題に困難がある",
      ar: "يجد صعوبة في مهام القراءة",
      pl: "ma trudności z zadaniami czytania",
      pt: "tem dificuldade com tarefas de leitura",
      fr: "a des difficultés avec les tâches de lecture"
    }
  },
  {
    text: {
      hu: "sok hibát vét írásban vagy másoláskor",
      en: "makes many mistakes in writing or copying",
      de: "viele Fehler beim Schreiben oder Abschreiben macht",
      it: "fa molti errori nella scrittura o nella copia",
      es: "comete muchos errores al escribir o copiar",
      zh: "书写或抄写时错误很多",
      ja: "書字や写し取りでミスが多い",
      ar: "يرتكب الكثير من الأخطاء في الكتابة أو النسخ",
      pl: "popełnia wiele błędów podczas pisania lub przepisywania",
      pt: "comete muitos erros ao escrever ou copiar",
      fr: "fait beaucoup d'erreurs en écrivant ou en recopiant"
    }
  },
  {
    text: {
      hu: "nehezen érti meg a feladatutasításokat",
      en: "has difficulty understanding task instructions",
      de: "Schwierigkeiten hat, Aufgabenanweisungen zu verstehen",
      it: "ha difficoltà a comprendere le istruzioni dei compiti",
      es: "tiene dificultad para entender las instrucciones de las tareas",
      zh: "难以理解任务说明",
      ja: "課題の指示を理解するのが難しい",
      ar: "يجد صعوبة في فهم تعليمات المهام",
      pl: "ma trudność ze zrozumieniem instrukcji do zadań",
      pt: "tem dificuldade em entender instruções de tarefas",
      fr: "a du mal à comprendre les consignes des tâches"
    }
  },
  {
    text: {
      hu: "bizonytalan az alapvető matematikai műveletekben",
      en: "shows uncertainty in basic math operations",
      de: "bei grundlegenden Rechenoperationen unsicher ist",
      it: "mostra incertezza nelle operazioni matematiche di base",
      es: "muestra inseguridad en operaciones matemáticas básicas",
      zh: "对基础数学运算不够稳定",
      ja: "基本的な計算に不安定さがある",
      ar: "يُظهر ترددًا في العمليات الحسابية الأساسية",
      pl: "jest niepewny przy podstawowych działaniach matematycznych",
      pt: "mostra insegurança em operações matemáticas básicas",
      fr: "montre des hésitations dans les opérations mathématiques de base"
    }
  },
  {
    text: {
      hu: "teljesítménye feltűnően elmarad az életkorától elvárttól",
      en: "performs noticeably below age expectations",
      de: "leistungsmäßig deutlich unter den altersbezogenen Erwartungen liegt",
      it: "ha prestazioni notevolmente inferiori rispetto alle aspettative per l'età",
      es: "su rendimiento está claramente por debajo de lo esperado para su edad",
      zh: "表现明显低于同龄预期",
      ja: "年齢相応の期待より明らかに低い成績が見られる",
      ar: "أداؤه أقل بوضوح من المتوقع لعمره",
      pl: "wyniki są wyraźnie poniżej oczekiwań dla wieku",
      pt: "o desempenho está visivelmente abaixo do esperado para a idade",
      fr: "les performances sont nettement en dessous de ce qui est attendu pour l'âge"
    }
  }
];

function buildDomainQuestions(prefix, tag, baseItems, startIndex) {
  const out = [];
  let n = startIndex;

  baseItems.forEach((base) => {
    CONTEXTS.forEach((context) => {
      out.push(
        makeQuestion(
          makeId(prefix, n++),
          [tag],
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

const ADHD_QUESTIONS = buildDomainQuestions("triage", "ADHD", ADHD_BASE, 1);          // 50
const ASD_QUESTIONS = buildDomainQuestions("triage", "ASD", ASD_BASE, 51);            // 50
const ANXIETY_QUESTIONS = buildDomainQuestions("triage", "ANXIETY", ANXIETY_BASE, 101); // 50
const DEPRESSION_QUESTIONS = buildDomainQuestions("triage", "DEPRESSION", DEPRESSION_BASE, 151); // 50
const LEARNING_QUESTIONS = buildDomainQuestions("triage", "LEARNING", LEARNING_BASE, 201); // 50

export const TRIAGE_BANK = [
  ...ADHD_QUESTIONS,
  ...ASD_QUESTIONS,
  ...ANXIETY_QUESTIONS,
  ...DEPRESSION_QUESTIONS,
  ...LEARNING_QUESTIONS
];