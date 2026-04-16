function makeId(prefix, n) {
  return `${prefix}_${String(n).padStart(4, "0")}`;
}

function makeQuestion(id, subdomain, text) {
  return {
    id,
    domain: "ADHD",
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

const ATTENTION_BASE = [
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
      hu: "könnyen elveszíti a fonalat feladatvégzés közben",
      en: "easily loses track while working on a task",
      de: "beim Bearbeiten einer Aufgabe leicht den Faden verliert",
      it: "perde facilmente il filo durante un compito",
      es: "pierde fácilmente el hilo mientras realiza una tarea",
      zh: "做任务时很容易跟不上进度",
      ja: "課題中に流れを見失いやすい",
      ar: "يفقد تركيزه بسهولة أثناء أداء المهمة",
      pl: "łatwo gubi wątek podczas wykonywania zadania",
      pt: "perde facilmente o fio durante uma tarefa",
      fr: "perd facilement le fil pendant une tâche"
    }
  },
  {
    text: {
      hu: "nehezen veszi észre a lényeges részleteket",
      en: "has difficulty noticing important details",
      de: "Schwierigkeiten hat, wichtige Details zu bemerken",
      it: "ha difficoltà a notare i dettagli importanti",
      es: "tiene dificultad para notar detalles importantes",
      zh: "难以注意到重要细节",
      ja: "重要な細部に気づきにくい",
      ar: "يجد صعوبة في ملاحظة التفاصيل المهمة",
      pl: "ma trudność z zauważaniem ważnych szczegółów",
      pt: "tem dificuldade em notar detalhes importantes",
      fr: "a du mal à remarquer les détails importants"
    }
  },
  {
    text: {
      hu: "figyelme gyorsan elkalandozik, ha a helyzet kevésbé izgalmas",
      en: "attention quickly drifts when the situation is less stimulating",
      de: "dessen Aufmerksamkeit schnell abschweift, wenn die Situation weniger anregend ist",
      it: "la cui attenzione si sposta rapidamente quando la situazione è poco stimolante",
      es: "cuya atención se desvía rápidamente cuando la situación es poco estimulante",
      zh: "当情境不够有趣时注意力很快游离",
      ja: "刺激の少ない状況では注意がすぐ逸れる",
      ar: "ينصرف انتباهه بسرعة عندما يكون الموقف أقل إثارة",
      pl: "jego uwaga szybko odpływa, gdy sytuacja jest mniej angażująca",
      pt: "a atenção se dispersa rapidamente quando a situação é menos estimulante",
      fr: "dont l'attention dérive rapidement quand la situation est moins stimulante"
    }
  }
];

const IMPULSIVITY_BASE = [
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
      hu: "gyakran közbevág másoknak",
      en: "often interrupts others",
      de: "andere häufig unterbricht",
      it: "interrompe spesso gli altri",
      es: "interrumpe con frecuencia a los demás",
      zh: "经常打断别人",
      ja: "他人の話を遮ることが多い",
      ar: "غالبًا ما يقاطع الآخرين",
      pl: "często przerywa innym",
      pt: "frequentemente interrompe os outros",
      fr: "interrompt souvent les autres"
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
  },
  {
    text: {
      hu: "gyorsan belekezd dolgokba anélkül, hogy végiggondolná a következményeket",
      en: "starts things quickly without considering the consequences",
      de: "schnell Dinge beginnt, ohne über die Folgen nachzudenken",
      it: "inizia rapidamente le cose senza considerare le conseguenze",
      es: "empieza cosas rápidamente sin considerar las consecuencias",
      zh: "很快开始做事但不考虑后果",
      ja: "結果を考えずにすぐ行動を始める",
      ar: "يبدأ الأمور بسرعة دون التفكير في العواقب",
      pl: "szybko zaczyna działać bez myślenia o konsekwencjach",
      pt: "começa coisas rapidamente sem pensar nas consequências",
      fr: "commence rapidement des choses sans réfléchir aux conséquences"
    }
  },
  {
    text: {
      hu: "nehezen fékezi meg az azonnali késztetéseit",
      en: "has difficulty holding back immediate impulses",
      de: "Schwierigkeiten hat, unmittelbare Impulse zu bremsen",
      it: "ha difficoltà a trattenere gli impulsi immediati",
      es: "tiene dificultad para frenar impulsos inmediatos",
      zh: "难以抑制立即出现的冲动",
      ja: "その場の衝動を抑えるのが難しい",
      ar: "يجد صعوبة في كبح الاندفاعات الفورية",
      pl: "ma trudność z hamowaniem natychmiastowych impulsów",
      pt: "tem dificuldade em conter impulsos imediatos",
      fr: "a du mal à retenir ses impulsions immédiates"
    }
  }
];

const HYPERACTIVITY_BASE = [
  {
    text: {
      hu: "sokszor nyugtalanul mocorog vagy fészkelődik",
      en: "often fidgets or seems physically restless",
      de: "häufig zappelt oder körperlich unruhig wirkt",
      it: "si agita spesso o appare fisicamente irrequieto",
      es: "a menudo se mueve inquieto o parece físicamente intranquilo",
      zh: "经常坐立不安或身体显得躁动",
      ja: "そわそわしたり身体的に落ち着きがないことが多い",
      ar: "كثيرًا ما يتململ أو يبدو مضطربًا جسديًا",
      pl: "często wierci się lub wydaje się ruchliwy",
      pt: "frequentemente se remexe ou parece fisicamente inquieto",
      fr: "s'agite souvent ou semble physiquement agité"
    }
  },
  {
    text: {
      hu: "nehezen marad nyugodtan ülve, amikor ezt elvárják",
      en: "has difficulty staying seated calmly when expected",
      de: "Schwierigkeiten hat, ruhig sitzen zu bleiben, wenn dies erwartet wird",
      it: "ha difficoltà a rimanere seduto con calma quando è richiesto",
      es: "le cuesta permanecer sentado con calma cuando se espera de él",
      zh: "在需要安静坐着的时候很难保持坐定",
      ja: "座っていることが求められる場面で落ち着いて座り続けるのが難しい",
      ar: "يجد صعوبة في الجلوس بهدوء عندما يُتوقع ذلك",
      pl: "ma trudność z spokojnym siedzeniem, gdy się tego oczekuje",
      pt: "tem dificuldade em permanecer sentado calmamente quando isso é esperado",
      fr: "a du mal à rester assis calmement quand on l'attend de lui"
    }
  },
  {
    text: {
      hu: "mozgásigénye feltűnően magas",
      en: "shows a noticeably high need for movement",
      de: "einen auffallend hohen Bewegungsdrang zeigt",
      it: "mostra un bisogno di movimento notevolmente elevato",
      es: "muestra una necesidad de movimiento notablemente alta",
      zh: "表现出明显较高的活动需求",
      ja: "動きたい欲求がかなり強い",
      ar: "يُظهر حاجة مرتفعة بشكل ملحوظ إلى الحركة",
      pl: "wykazuje wyraźnie wysoką potrzebę ruchu",
      pt: "apresenta uma necessidade de movimento visivelmente alta",
      fr: "montre un besoin de mouvement nettement élevé"
    }
  },
  {
    text: {
      hu: "sokszor túl gyors tempóban működik másokhoz képest",
      en: "often operates at a faster pace than others",
      de: "häufig in einem schnelleren Tempo als andere agiert",
      it: "agisce spesso a un ritmo più veloce degli altri",
      es: "a menudo funciona a un ritmo más rápido que los demás",
      zh: "经常以比别人更快的节奏行动",
      ja: "他の人よりも速いペースで動くことが多い",
      ar: "غالبًا ما يتحرك بوتيرة أسرع من الآخرين",
      pl: "często działa w szybszym tempie niż inni",
      pt: "frequentemente funciona em um ritmo mais acelerado que os outros",
      fr: "fonctionne souvent à un rythme plus rapide que les autres"
    }
  },
  {
    text: {
      hu: "nehéz számára a testi nyugalom fenntartása",
      en: "has difficulty maintaining physical calmness",
      de: "Schwierigkeiten hat, körperliche Ruhe aufrechtzuerhalten",
      it: "ha difficoltà a mantenere la calma fisica",
      es: "tiene dificultad para mantener la calma física",
      zh: "难以保持身体上的安静和平稳",
      ja: "身体的な落ち着きを保つのが難しい",
      ar: "يجد صعوبة في الحفاظ على الهدوء الجسدي",
      pl: "ma trudność z utrzymaniem fizycznego spokoju",
      pt: "tem dificuldade em manter a calma física",
      fr: "a du mal à maintenir un calme physique"
    }
  }
];

const EXECUTIVE_BASE = [
  {
    text: {
      hu: "nehezen szervezi meg a feladatait vagy teendőit",
      en: "has difficulty organizing tasks or responsibilities",
      de: "Schwierigkeiten hat, Aufgaben oder Verpflichtungen zu organisieren",
      it: "ha difficoltà a organizzare compiti o responsabilità",
      es: "tiene dificultad para organizar tareas o responsabilidades",
      zh: "难以组织任务或安排事项",
      ja: "課題ややるべきことを整理するのが難しい",
      ar: "يجد صعوبة في تنظيم المهام أو المسؤوليات",
      pl: "ma trudność z organizacją zadań lub obowiązków",
      pt: "tem dificuldade em organizar tarefas ou responsabilidades",
      fr: "a du mal à organiser ses tâches ou responsabilités"
    }
  },
  {
    text: {
      hu: "könnyen elveszíti a szükséges eszközöket vagy tárgyakat",
      en: "easily loses necessary tools or belongings",
      de: "notwendige Dinge oder Gegenstände leicht verliert",
      it: "perde facilmente strumenti o oggetti necessari",
      es: "pierde fácilmente herramientas u objetos necesarios",
      zh: "容易弄丢必要的工具或物品",
      ja: "必要な道具や持ち物をなくしやすい",
      ar: "يفقد بسهولة الأدوات أو الأغراض الضرورية",
      pl: "łatwo gubi potrzebne narzędzia lub rzeczy",
      pt: "perde facilmente ferramentas ou objetos necessários",
      fr: "perd facilement les outils ou objets nécessaires"
    }
  },
  {
    text: {
      hu: "nehéz számára több lépésből álló feladatok követése",
      en: "has difficulty following multi-step tasks",
      de: "Schwierigkeiten hat, mehrschrittigen Aufgaben zu folgen",
      it: "ha difficoltà a seguire compiti in più fasi",
      es: "tiene dificultad para seguir tareas de varios pasos",
      zh: "难以完成多步骤任务",
      ja: "複数の手順がある課題を進めるのが難しい",
      ar: "يجد صعوبة في متابعة المهام متعددة الخطوات",
      pl: "ma trudność z wykonywaniem zadań wieloetapowych",
      pt: "tem dificuldade em seguir tarefas com várias etapas",
      fr: "a du mal à suivre des tâches en plusieurs étapes"
    }
  },
  {
    text: {
      hu: "halogatja vagy nehezen kezdi el a szükséges feladatokat",
      en: "delays or struggles to start necessary tasks",
      de: "notwendige Aufgaben aufschiebt oder schwer beginnt",
      it: "rimanda o fatica a iniziare i compiti necessari",
      es: "pospone o le cuesta empezar tareas necesarias",
      zh: "拖延或难以开始必要的任务",
      ja: "必要な課題を先延ばしにしたり始めにくかったりする",
      ar: "يؤجل أو يجد صعوبة في بدء المهام الضرورية",
      pl: "odkłada lub ma trudność z rozpoczęciem potrzebnych zadań",
      pt: "adia ou tem dificuldade para começar tarefas necessárias",
      fr: "repousse ou a du mal à commencer les tâches nécessaires"
    }
  },
  {
    text: {
      hu: "nehezen tartja fejben, mit kell éppen csinálnia",
      en: "has difficulty keeping in mind what needs to be done",
      de: "Schwierigkeiten hat, im Kopf zu behalten, was gerade zu tun ist",
      it: "ha difficoltà a tenere a mente ciò che deve fare",
      es: "tiene dificultad para recordar lo que debe hacer en ese momento",
      zh: "难以记住此刻该做什么",
      ja: "今やるべきことを頭に保っておくのが難しい",
      ar: "يجد صعوبة في تذكر ما ينبغي عليه فعله في اللحظة الحالية",
      pl: "ma trudność z pamiętaniem, co powinien właśnie zrobić",
      pt: "tem dificuldade em manter em mente o que precisa ser feito",
      fr: "a du mal à garder en tête ce qu'il faut faire"
    }
  }
];

const SCHOOL_BASE = [
  {
    text: {
      hu: "iskolai feladatoknál könnyen elveszíti a fonalat",
      en: "easily loses track during school tasks",
      de: "bei schulischen Aufgaben leicht den Faden verliert",
      it: "perde facilmente il filo durante i compiti scolastici",
      es: "pierde fácilmente el hilo durante las tareas escolares",
      zh: "在学校任务中容易跟不上",
      ja: "学習課題で流れを見失いやすい",
      ar: "يفقد تركيزه بسهولة أثناء المهام المدرسية",
      pl: "łatwo gubi wątek podczas zadań szkolnych",
      pt: "perde facilmente o fio durante tarefas escolares",
      fr: "perd facilement le fil pendant les tâches scolaires"
    }
  },
  {
    text: {
      hu: "teljesítménye ingadozó, még akkor is, ha képes lenne többre",
      en: "shows inconsistent performance even when capable of more",
      de: "eine schwankende Leistung zeigt, obwohl mehr möglich wäre",
      it: "mostra una prestazione incostante anche quando potrebbe fare di più",
      es: "muestra un rendimiento inconsistente incluso cuando podría hacer más",
      zh: "即使有能力做得更好，表现也常不稳定",
      ja: "もっとできる力があるのに成績や出来が安定しない",
      ar: "يُظهر أداءً متقلبًا رغم قدرته على الأفضل",
      pl: "osiąga nierówne wyniki, mimo że potrafi więcej",
      pt: "apresenta desempenho inconsistente mesmo podendo fazer melhor",
      fr: "montre des performances irrégulières alors qu'il pourrait faire mieux"
    }
  },
  {
    text: {
      hu: "könnyen elveszíti az érdeklődését hosszabb tanulási helyzetekben",
      en: "easily loses interest in longer learning situations",
      de: "in längeren Lernsituationen leicht das Interesse verliert",
      it: "perde facilmente interesse in situazioni di apprendimento più lunghe",
      es: "pierde fácilmente el interés en situaciones de aprendizaje prolongadas",
      zh: "在较长时间的学习情境中容易失去兴趣",
      ja: "長めの学習場面で興味を失いやすい",
      ar: "يفقد اهتمامه بسهولة في مواقف التعلم الطويلة",
      pl: "łatwo traci zainteresowanie w dłuższych sytuacjach edukacyjnych",
      pt: "perde facilmente o interesse em situações de aprendizagem mais longas",
      fr: "perd facilement l'intérêt dans des situations d'apprentissage prolongées"
    }
  },
  {
    text: {
      hu: "nehezen követi az instrukciókat végig",
      en: "has difficulty following instructions through to the end",
      de: "Schwierigkeiten hat, Anweisungen bis zum Ende zu befolgen",
      it: "ha difficoltà a seguire le istruzioni fino alla fine",
      es: "tiene dificultad para seguir instrucciones hasta el final",
      zh: "难以把指令从头到尾执行完",
      ja: "指示を最後まで追い続けるのが難しい",
      ar: "يجد صعوبة في اتباع التعليمات حتى النهاية",
      pl: "ma trudność z wykonaniem instrukcji do końca",
      pt: "tem dificuldade em seguir instruções até o fim",
      fr: "a du mal à suivre les consignes jusqu'au bout"
    }
  },
  {
    text: {
      hu: "sok támogatást igényel ahhoz, hogy feladathelyzetben maradjon",
      en: "needs a lot of support to stay engaged in task situations",
      de: "viel Unterstützung braucht, um in Aufgabensituationen dabeizubleiben",
      it: "ha bisogno di molto supporto per restare concentrato nei compiti",
      es: "necesita mucho apoyo para mantenerse en la tarea",
      zh: "需要大量支持才能持续投入任务",
      ja: "課題に取り組み続けるために多くの支援が必要である",
      ar: "يحتاج إلى الكثير من الدعم للبقاء منخرطًا في المهام",
      pl: "potrzebuje dużo wsparcia, aby pozostać przy zadaniu",
      pt: "precisa de muito apoio para se manter engajado nas tarefas",
      fr: "a besoin de beaucoup de soutien pour rester engagé dans la tâche"
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

const ATTENTION_QUESTIONS = buildQuestions("adhd", "attention", ATTENTION_BASE, 1);         // 50
const IMPULSIVITY_QUESTIONS = buildQuestions("adhd", "impulsivity", IMPULSIVITY_BASE, 51);   // 50
const HYPERACTIVITY_QUESTIONS = buildQuestions("adhd", "hyperactivity", HYPERACTIVITY_BASE, 101); // 50
const EXECUTIVE_QUESTIONS = buildQuestions("adhd", "executive_function", EXECUTIVE_BASE, 151);    // 50
const SCHOOL_QUESTIONS = buildQuestions("adhd", "school_functioning", SCHOOL_BASE, 201);     // 50

export const ADHD_BANK = [
  ...ATTENTION_QUESTIONS,
  ...IMPULSIVITY_QUESTIONS,
  ...HYPERACTIVITY_QUESTIONS,
  ...EXECUTIVE_QUESTIONS,
  ...SCHOOL_QUESTIONS
];