function makeId(prefix, n) {
  return `${prefix}_${String(n).padStart(4, "0")}`;
}

function makeQuestion(id, subdomain, text) {
  return {
    id,
    domain: "ASD",
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

const SOCIAL_COMMUNICATION_BASE = [
  {
    text: {
      hu: "nehezen kezdeményez kölcsönös társas kapcsolatot",
      en: "has difficulty initiating reciprocal social interaction",
      de: "Schwierigkeiten hat, wechselseitige soziale Kontakte zu beginnen",
      it: "ha difficoltà a iniziare interazioni sociali reciproche",
      es: "tiene dificultad para iniciar interacciones sociales recíprocas",
      zh: "难以主动发起互相交流的社交互动",
      ja: "相互的な社会的やり取りを始めるのが難しい",
      ar: "يجد صعوبة في بدء التفاعل الاجتماعي المتبادل",
      pl: "ma trudność z inicjowaniem wzajemnych interakcji społecznych",
      pt: "tem dificuldade em iniciar interações sociais recíprocas",
      fr: "a du mal à initier des interactions sociales réciproques"
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
  },
  {
    text: {
      hu: "nehézséget mutat a társas helyzetek kölcsönösségének fenntartásában",
      en: "shows difficulty maintaining reciprocity in social situations",
      de: "Schwierigkeiten zeigt, Gegenseitigkeit in sozialen Situationen aufrechtzuerhalten",
      it: "mostra difficoltà nel mantenere reciprocità nelle situazioni sociali",
      es: "muestra dificultad para mantener la reciprocidad en situaciones sociales",
      zh: "在社交情境中难以维持互动的相互性",
      ja: "社会的場面で相互性を保つことに難しさがある",
      ar: "يُظهر صعوبة في الحفاظ على التبادلية في المواقف الاجتماعية",
      pl: "ma trudność z utrzymaniem wzajemności w sytuacjach społecznych",
      pt: "mostra dificuldade em manter reciprocidade em situações sociais",
      fr: "montre une difficulté à maintenir la réciprocité dans les situations sociales"
    }
  },
  {
    text: {
      hu: "beszélgetésekben nehezen hangolódik rá mások nézőpontjára",
      en: "has difficulty tuning into others' perspectives during conversations",
      de: "sich in Gesprächen schwer auf die Perspektive anderer einstellt",
      it: "ha difficoltà a sintonizzarsi sul punto di vista degli altri durante le conversazioni",
      es: "le cuesta conectar con la perspectiva de los demás durante las conversaciones",
      zh: "在对话中难以体会他人的视角",
      ja: "会話の中で相手の視点に合わせるのが難しい",
      ar: "يجد صعوبة في فهم منظور الآخرين أثناء المحادثات",
      pl: "ma trudność z dostrojeniem się do perspektywy innych podczas rozmowy",
      pt: "tem dificuldade em perceber a perspectiva dos outros durante conversas",
      fr: "a du mal à s'ajuster au point de vue des autres pendant les conversations"
    }
  },
  {
    text: {
      hu: "társas helyzetekben kevésbé keresi a spontán kapcsolódást",
      en: "shows reduced spontaneous social engagement",
      de: "in sozialen Situationen weniger spontane Kontaktaufnahme zeigt",
      it: "mostra una ridotta partecipazione sociale spontanea",
      es: "muestra menor vinculación social espontánea",
      zh: "在社交情境中较少自发地寻求互动",
      ja: "社会的場面で自発的な関わりが少ない",
      ar: "يُظهر تفاعلًا اجتماعيًا عفويًا أقل",
      pl: "wykazuje mniejsze spontaniczne zaangażowanie społeczne",
      pt: "apresenta menor envolvimento social espontâneo",
      fr: "montre moins d'engagement social spontané"
    }
  }
];

const NONVERBAL_BASE = [
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
      hu: "nehezen értelmezi mások mimikáját vagy testbeszédét",
      en: "has difficulty interpreting others' facial expressions or body language",
      de: "Schwierigkeiten hat, Mimik oder Körpersprache anderer zu deuten",
      it: "ha difficoltà a interpretare espressioni facciali o linguaggio del corpo degli altri",
      es: "tiene dificultad para interpretar expresiones faciales o lenguaje corporal de los demás",
      zh: "难以理解他人的表情或肢体语言",
      ja: "他者の表情やボディランゲージを読み取るのが難しい",
      ar: "يجد صعوبة في تفسير تعابير الوجه أو لغة الجسد لدى الآخرين",
      pl: "ma trudność z interpretowaniem mimiki lub mowy ciała innych osób",
      pt: "tem dificuldade em interpretar expressões faciais ou linguagem corporal dos outros",
      fr: "a du mal à interpréter les expressions faciales ou le langage corporel des autres"
    }
  },
  {
    text: {
      hu: "saját nonverbális jelzései kevésbé illeszkednek a helyzethez",
      en: "shows nonverbal signals that are less fitted to the situation",
      de: "nonverbale Signale zeigt, die weniger zur Situation passen",
      it: "mostra segnali non verbali meno adeguati alla situazione",
      es: "muestra señales no verbales menos ajustadas a la situación",
      zh: "自己的非语言表达与情境的匹配度较低",
      ja: "自分の非言語サインが状況に合いにくいことがある",
      ar: "تكون إشاراته غير اللفظية أقل ملاءمة للموقف",
      pl: "jego niewerbalne sygnały są mniej dopasowane do sytuacji",
      pt: "apresenta sinais não verbais menos adequados à situação",
      fr: "montre des signaux non verbaux moins adaptés à la situation"
    }
  },
  {
    text: {
      hu: "gesztusai vagy arckifejezései korlátozottabbnak tűnnek",
      en: "shows more limited gestures or facial expressions",
      de: "begrenztere Gestik oder Mimik zeigt",
      it: "mostra gesti o espressioni facciali più limitati",
      es: "muestra gestos o expresiones faciales más limitados",
      zh: "手势或面部表情显得较少或较局限",
      ja: "身振りや表情がやや限られているように見える",
      ar: "تبدو إيماءاته أو تعابير وجهه أكثر محدودية",
      pl: "jego gesty lub mimika wydają się bardziej ograniczone",
      pt: "apresenta gestos ou expressões faciais mais limitados",
      fr: "montre des gestes ou expressions faciales plus limités"
    }
  },
  {
    text: {
      hu: "nehézséget mutat a szemkontaktus, gesztusok és beszéd összehangolásában",
      en: "shows difficulty coordinating eye contact, gestures, and speech",
      de: "Schwierigkeiten bei der Abstimmung von Blickkontakt, Gestik und Sprache zeigt",
      it: "mostra difficoltà nel coordinare contatto visivo, gesti e linguaggio",
      es: "muestra dificultad para coordinar contacto visual, gestos y habla",
      zh: "难以协调眼神、手势和语言表达",
      ja: "視線、ジェスチャー、発話をうまく組み合わせるのが難しい",
      ar: "يُظهر صعوبة في تنسيق التواصل البصري والإيماءات والكلام",
      pl: "ma trudność z koordynacją kontaktu wzrokowego, gestów i mowy",
      pt: "mostra dificuldade em coordenar contato visual, gestos e fala",
      fr: "montre une difficulté à coordonner regard, gestes et parole"
    }
  }
];

const FLEXIBILITY_BASE = [
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
      hu: "váratlan változások erős feszültséget okoznak nála",
      en: "unexpected changes create marked tension",
      de: "unerwartete Veränderungen starke Anspannung auslösen",
      it: "i cambiamenti inattesi generano forte tensione",
      es: "los cambios inesperados generan mucha tensión",
      zh: "突发变化会引发明显紧张",
      ja: "予期しない変化で強い緊張が生じる",
      ar: "تسبب التغييرات غير المتوقعة توترًا واضحًا",
      pl: "nieoczekiwane zmiany powodują u niego silne napięcie",
      pt: "mudanças inesperadas geram forte tensão",
      fr: "les changements imprévus provoquent une forte tension"
    }
  },
  {
    text: {
      hu: "nehezen vált egyik tevékenységről a másikra",
      en: "has difficulty shifting from one activity to another",
      de: "Schwierigkeiten hat, von einer Tätigkeit zur anderen zu wechseln",
      it: "ha difficoltà a passare da un'attività all'altra",
      es: "tiene dificultad para pasar de una actividad a otra",
      zh: "难以从一项活动切换到另一项活动",
      ja: "一つの活動から別の活動へ切り替えるのが難しい",
      ar: "يجد صعوبة في الانتقال من نشاط إلى آخر",
      pl: "ma trudność z przechodzeniem z jednej aktywności do drugiej",
      pt: "tem dificuldade em mudar de uma atividade para outra",
      fr: "a du mal à passer d'une activité à une autre"
    }
  },
  {
    text: {
      hu: "erősen igényli, hogy a dolgok megszokott módon történjenek",
      en: "strongly needs things to happen in familiar ways",
      de: "stark darauf angewiesen ist, dass Dinge auf vertraute Weise ablaufen",
      it: "ha un forte bisogno che le cose avvengano in modi familiari",
      es: "necesita mucho que las cosas ocurran de forma conocida",
      zh: "强烈需要事情按熟悉的方式发生",
      ja: "物事が慣れたやり方で進むことを強く求める",
      ar: "يحتاج بشدة إلى أن تسير الأمور بطريقة مألوفة",
      pl: "silnie potrzebuje, aby rzeczy działy się w znany sposób",
      pt: "tem forte necessidade de que as coisas aconteçam de formas familiares",
      fr: "a fortement besoin que les choses se passent de manière familière"
    }
  },
  {
    text: {
      hu: "rugalmatlanabbnak tűnik, amikor a helyzet eltér a várttól",
      en: "seems less flexible when situations differ from expectations",
      de: "weniger flexibel wirkt, wenn Situationen von den Erwartungen abweichen",
      it: "sembra meno flessibile quando le situazioni differiscono dalle aspettative",
      es: "parece menos flexible cuando las situaciones difieren de lo esperado",
      zh: "当情境与预期不同时显得不够灵活",
      ja: "予想と違う状況になると柔軟に対応しにくい",
      ar: "يبدو أقل مرونة عندما تختلف المواقف عن التوقعات",
      pl: "wydaje się mniej elastyczny, gdy sytuacje odbiegają od oczekiwań",
      pt: "parece menos flexível quando as situações diferem do esperado",
      fr: "semble moins flexible quand les situations diffèrent des attentes"
    }
  }
];

const RESTRICTED_INTERESTS_BASE = [
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
      hu: "hosszan és részletesen foglalkozik kevés számú témával",
      en: "spends extended time focused on a small number of topics",
      de: "sich lange und intensiv mit wenigen Themen beschäftigt",
      it: "si concentra a lungo su un numero limitato di temi",
      es: "dedica mucho tiempo a un número reducido de temas",
      zh: "长时间专注于少数几个主题",
      ja: "少数のテーマに長く深く集中する",
      ar: "يقضي وقتًا طويلًا في التركيز على عدد قليل من المواضيع",
      pl: "spędza dużo czasu, koncentrując się na niewielu tematach",
      pt: "passa longos períodos focado em poucos temas",
      fr: "passe beaucoup de temps centré sur un petit nombre de sujets"
    }
  },
  {
    text: {
      hu: "nehezen tér át más érdeklődési területekre",
      en: "has difficulty shifting to other interests",
      de: "Schwierigkeiten hat, zu anderen Interessengebieten zu wechseln",
      it: "ha difficoltà a passare ad altri interessi",
      es: "tiene dificultad para pasar a otros intereses",
      zh: "难以转向其他兴趣领域",
      ja: "他の興味へ移るのが難しい",
      ar: "يجد صعوبة في الانتقال إلى اهتمامات أخرى",
      pl: "ma trudność z przechodzeniem do innych zainteresowań",
      pt: "tem dificuldade em mudar para outros interesses",
      fr: "a du mal à passer à d'autres centres d'intérêt"
    }
  },
  {
    text: {
      hu: "bizonyos témák vagy tárgyak aránytalanul lekötik",
      en: "is disproportionately absorbed by certain topics or objects",
      de: "von bestimmten Themen oder Objekten übermäßig in Anspruch genommen ist",
      it: "è assorbito in modo sproporzionato da certi temi o oggetti",
      es: "queda absorbido de forma desproporcionada por ciertos temas u objetos",
      zh: "对某些主题或物体投入程度明显过高",
      ja: "特定のテーマや物に過度に没頭する",
      ar: "ينشغل بشكل غير متناسب بمواضيع أو أشياء معينة",
      pl: "jest nieproporcjonalnie pochłonięty określonymi tematami lub przedmiotami",
      pt: "fica desproporcionalmente absorvido por certos temas ou objetos",
      fr: "est absorbé de manière disproportionnée par certains sujets ou objets"
    }
  },
  {
    text: {
      hu: "kevésbé érdeklődik a kortársak tipikus témái iránt",
      en: "shows less interest in topics typical for peers",
      de: "weniger Interesse an für Gleichaltrige typischen Themen zeigt",
      it: "mostra meno interesse per temi tipici dei coetanei",
      es: "muestra menos interés por temas típicos de sus compañeros",
      zh: "对同龄人常见的话题兴趣较低",
      ja: "同年代の子どもに一般的な話題への関心が少ない",
      ar: "يُظهر اهتمامًا أقل بالموضوعات المعتادة لدى الأقران",
      pl: "wykazuje mniejsze zainteresowanie tematami typowymi dla rówieśników",
      pt: "mostra menos interesse por temas típicos dos colegas",
      fr: "montre moins d'intérêt pour les sujets typiques des pairs"
    }
  }
];

const SENSORY_BASE = [
  {
    text: {
      hu: "bizonyos hangokra, fényekre vagy érintésekre szokatlanul érzékeny",
      en: "is unusually sensitive to certain sounds, lights, or touches",
      de: "ungewöhnlich empfindlich auf bestimmte Geräusche, Lichter oder Berührungen reagiert",
      it: "è insolitamente sensibile a certi suoni, luci o contatti",
      es: "es inusualmente sensible a ciertos sonidos, luces o contactos",
      zh: "对某些声音、光线或触碰异常敏感",
      ja: "特定の音、光、触覚刺激に対して非常に敏感である",
      ar: "يكون حساسًا بشكل غير معتاد لبعض الأصوات أو الأضواء أو اللمس",
      pl: "jest niezwykle wrażliwy na określone dźwięki, światła lub dotyk",
      pt: "é incomumente sensível a certos sons, luzes ou toques",
      fr: "est inhabituellement sensible à certains sons, lumières ou contacts"
    }
  },
  {
    text: {
      hu: "erősen reagál a szenzoros ingerek változásaira",
      en: "reacts strongly to changes in sensory input",
      de: "stark auf Veränderungen sensorischer Reize reagiert",
      it: "reagisce fortemente ai cambiamenti degli stimoli sensoriali",
      es: "reacciona fuertemente a cambios en estímulos sensoriales",
      zh: "对感觉刺激变化反应很强烈",
      ja: "感覚刺激の変化に強く反応する",
      ar: "يتفاعل بقوة مع التغيرات في المدخلات الحسية",
      pl: "silnie reaguje na zmiany bodźców sensorycznych",
      pt: "reage fortemente a mudanças em estímulos sensoriais",
      fr: "réagit fortement aux changements de stimulations sensorielles"
    }
  },
  {
    text: {
      hu: "bizonyos ruhák, ételek vagy textúrák fokozott ellenállást váltanak ki nála",
      en: "shows strong resistance to certain clothes, foods, or textures",
      de: "starke Ablehnung gegenüber bestimmten Kleidungsstücken, Speisen oder Oberflächen zeigt",
      it: "mostra forte resistenza verso certi vestiti, cibi o consistenze",
      es: "muestra fuerte rechazo hacia ciertas prendas, alimentos o texturas",
      zh: "对某些衣物、食物或质地表现出明显抗拒",
      ja: "特定の服、食べ物、触感に強い抵抗を示す",
      ar: "يُظهر مقاومة شديدة لبعض الملابس أو الأطعمة أو الملمس",
      pl: "wykazuje silny opór wobec niektórych ubrań, potraw lub faktur",
      pt: "apresenta forte resistência a certas roupas, alimentos ou texturas",
      fr: "montre une forte résistance à certains vêtements, aliments ou textures"
    }
  },
  {
    text: {
      hu: "keres vagy kerül bizonyos szenzoros élményeket",
      en: "actively seeks or avoids certain sensory experiences",
      de: "bestimmte sensorische Erfahrungen aktiv sucht oder meidet",
      it: "cerca o evita attivamente certe esperienze sensoriali",
      es: "busca o evita activamente ciertas experiencias sensoriales",
      zh: "会主动寻求或回避某些感觉体验",
      ja: "特定の感覚体験を求めたり避けたりする",
      ar: "يسعى أو يتجنب بشكل واضح بعض الخبرات الحسية",
      pl: "aktywnie poszukuje lub unika pewnych doznań sensorycznych",
      pt: "busca ou evita ativamente certas experiências sensoriais",
      fr: "recherche ou évite activement certaines expériences sensorielles"
    }
  },
  {
    text: {
      hu: "szenzoros terhelés hatására gyorsabban kibillen az egyensúlyából",
      en: "becomes dysregulated more quickly under sensory load",
      de: "unter sensorischer Belastung schneller aus dem Gleichgewicht gerät",
      it: "si destabilizza più rapidamente sotto carico sensoriale",
      es: "se desregula más rápidamente bajo carga sensorial",
      zh: "在感觉负荷下更容易失去平衡和稳定",
      ja: "感覚負荷が高いとより早く不安定になる",
      ar: "يفقد اتزانه بشكل أسرع تحت العبء الحسي",
      pl: "przy przeciążeniu sensorycznym szybciej traci równowagę",
      pt: "desregula-se mais rapidamente sob carga sensorial",
      fr: "se désorganise plus rapidement sous charge sensorielle"
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

const SOCIAL_COMMUNICATION_QUESTIONS = buildQuestions("asd", "social_communication", SOCIAL_COMMUNICATION_BASE, 1);   // 50
const NONVERBAL_QUESTIONS = buildQuestions("asd", "nonverbal_signals", NONVERBAL_BASE, 51);                         // 50
const FLEXIBILITY_QUESTIONS = buildQuestions("asd", "flexibility_routines", FLEXIBILITY_BASE, 101);                // 50
const RESTRICTED_INTERESTS_QUESTIONS = buildQuestions("asd", "restricted_interests", RESTRICTED_INTERESTS_BASE, 151); // 50
const SENSORY_QUESTIONS = buildQuestions("asd", "sensory_processing", SENSORY_BASE, 201);                          // 50

export const ASD_BANK = [
  ...SOCIAL_COMMUNICATION_QUESTIONS,
  ...NONVERBAL_QUESTIONS,
  ...FLEXIBILITY_QUESTIONS,
  ...RESTRICTED_INTERESTS_QUESTIONS,
  ...SENSORY_QUESTIONS
];