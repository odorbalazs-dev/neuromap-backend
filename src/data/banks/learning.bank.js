function makeId(prefix, n) {
  return `${prefix}_${String(n).padStart(4, "0")}`;
}

function makeQuestion(id, subdomain, text) {
  return {
    id,
    domain: "LEARNING",
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
    key: "school",
    text: {
      hu: "iskolai helyzetekben",
      en: "in school situations",
      de: "in schulischen Situationen",
      it: "nelle situazioni scolastiche",
      es: "en situaciones escolares",
      zh: "在学校情境中",
      ja: "学校の場面で",
      ar: "في المواقف المدرسية",
      pl: "w sytuacjach szkolnych",
      pt: "em situações escolares",
      fr: "dans les situations scolaires"
    }
  },
  {
    key: "homework",
    text: {
      hu: "házi feladatok során",
      en: "during homework",
      de: "bei Hausaufgaben",
      it: "durante i compiti a casa",
      es: "durante la tarea escolar en casa",
      zh: "在做家庭作业时",
      ja: "宿題の場面で",
      ar: "أثناء الواجبات المنزلية",
      pl: "podczas odrabiania pracy domowej",
      pt: "durante a lição de casa",
      fr: "pendant les devoirs"
    }
  },
  {
    key: "structured_tasks",
    text: {
      hu: "strukturált feladatoknál",
      en: "during structured tasks",
      de: "bei strukturierten Aufgaben",
      it: "durante compiti strutturati",
      es: "durante tareas estructuradas",
      zh: "在结构化任务中",
      ja: "構造化された課題で",
      ar: "أثناء المهام المنظمة",
      pl: "podczas zadań uporządkowanych",
      pt: "durante tarefas estruturadas",
      fr: "pendant des tâches structurées"
    }
  },
  {
    key: "under_pressure",
    text: {
      hu: "megterhelő vagy időnyomásos helyzetekben",
      en: "in demanding or time-pressured situations",
      de: "in belastenden oder zeitkritischen Situationen",
      it: "in situazioni impegnative o con pressione del tempo",
      es: "en situaciones exigentes o con presión de tiempo",
      zh: "在高要求或时间压力情境中",
      ja: "負荷や時間的プレッシャーのある場面で",
      ar: "في المواقف المجهدة أو تحت ضغط الوقت",
      pl: "w sytuacjach wymagających lub pod presją czasu",
      pt: "em situações exigentes ou com pressão de tempo",
      fr: "dans des situations exigeantes ou sous pression de temps"
    }
  }
];

const READING_DECODING_BASE = [
  {
    text: {
      hu: "nehezen boldogul az olvasási pontossággal",
      en: "has difficulty with reading accuracy",
      de: "hat Schwierigkeiten mit der Lesegenauigkeit",
      it: "ha difficoltà con l'accuratezza della lettura",
      es: "tiene dificultad con la precisión en la lectura",
      zh: "阅读准确性方面有困难",
      ja: "正確に読むことに困難がある",
      ar: "يجد صعوبة في دقة القراءة",
      pl: "ma trudności z dokładnością czytania",
      pt: "tem dificuldade com a precisão da leitura",
      fr: "a des difficultés avec la précision de la lecture"
    }
  },
  {
    text: {
      hu: "lassabban halad az olvasással a korosztályához képest",
      en: "reads more slowly than expected for age",
      de: "liest langsamer als für das Alter erwartet",
      it: "legge più lentamente rispetto a quanto atteso per l'età",
      es: "lee más lentamente de lo esperado para su edad",
      zh: "阅读速度低于同龄预期",
      ja: "年齢相応より読む速度が遅い",
      ar: "يقرأ ببطء أكثر مما هو متوقع لعمره",
      pl: "czyta wolniej niż oczekuje się dla jego wieku",
      pt: "lê mais devagar do que o esperado para a idade",
      fr: "lit plus lentement que ce qui est attendu pour son âge"
    }
  },
  {
    text: {
      hu: "gyakran összekever betűket, hangokat vagy szóalakokat",
      en: "often confuses letters, sounds, or word forms",
      de: "verwechselt häufig Buchstaben, Laute oder Wortformen",
      it: "confonde spesso lettere, suoni o forme delle parole",
      es: "confunde con frecuencia letras, sonidos o formas de palabras",
      zh: "经常混淆字母、发音或词形",
      ja: "文字、音、語の形を混同しやすい",
      ar: "غالبًا ما يخلط بين الحروف أو الأصوات أو أشكال الكلمات",
      pl: "często myli litery, dźwięki lub formy wyrazów",
      pt: "frequentemente confunde letras, sons ou formas de palavras",
      fr: "confond souvent des lettres, des sons ou des formes de mots"
    }
  },
  {
    text: {
      hu: "nehezen olvas ki ismeretlen szavakat",
      en: "has difficulty decoding unfamiliar words",
      de: "hat Schwierigkeiten, unbekannte Wörter zu entziffern",
      it: "ha difficoltà a decodificare parole sconosciute",
      es: "tiene dificultad para decodificar palabras desconocidas",
      zh: "难以拼读不熟悉的词",
      ja: "知らない単語を読み解くのが難しい",
      ar: "يجد صعوبة في فك الكلمات غير المألوفة",
      pl: "ma trudność z odczytywaniem nieznanych słów",
      pt: "tem dificuldade em decodificar palavras desconhecidas",
      fr: "a du mal à décoder des mots inconnus"
    }
  },
  {
    text: {
      hu: "olvasás közben gyakran elveszíti a helyét a sorban vagy szövegben",
      en: "often loses place while reading lines or text",
      de: "verliert beim Lesen häufig die Stelle in der Zeile oder im Text",
      it: "perde spesso il segno durante la lettura di righe o testo",
      es: "pierde con frecuencia el lugar al leer líneas o texto",
      zh: "阅读时经常看丢行或位置",
      ja: "読むときに行や位置を見失いやすい",
      ar: "غالبًا ما يفقد مكانه أثناء قراءة السطور أو النص",
      pl: "często gubi miejsce podczas czytania wierszy lub tekstu",
      pt: "frequentemente perde o lugar ao ler linhas ou textos",
      fr: "perd souvent sa place en lisant des lignes ou un texte"
    }
  }
];

const READING_COMPREHENSION_BASE = [
  {
    text: {
      hu: "nehezen érti meg az elolvasott szöveg lényegét",
      en: "has difficulty understanding the main idea of what was read",
      de: "hat Schwierigkeiten, den Hauptgedanken eines gelesenen Textes zu verstehen",
      it: "ha difficoltà a comprendere l'idea principale di ciò che legge",
      es: "tiene dificultad para comprender la idea principal de lo que lee",
      zh: "难以理解所读内容的主要意思",
      ja: "読んだ内容の要点を理解するのが難しい",
      ar: "يجد صعوبة في فهم الفكرة الرئيسية لما يقرأه",
      pl: "ma trudność ze zrozumieniem głównej myśli przeczytanego tekstu",
      pt: "tem dificuldade em entender a ideia principal do que leu",
      fr: "a du mal à comprendre l'idée principale de ce qu'il lit"
    }
  },
  {
    text: {
      hu: "olvasás után nehezen tudja visszamondani a tartalmat",
      en: "has difficulty retelling content after reading",
      de: "kann den Inhalt nach dem Lesen schwer wiedergeben",
      it: "ha difficoltà a raccontare il contenuto dopo la lettura",
      es: "tiene dificultad para volver a contar el contenido después de leer",
      zh: "阅读后难以复述内容",
      ja: "読んだ後に内容を言い直すのが難しい",
      ar: "يجد صعوبة في إعادة سرد المحتوى بعد القراءة",
      pl: "ma trudność z opowiedzeniem treści po przeczytaniu",
      pt: "tem dificuldade em recontar o conteúdo após a leitura",
      fr: "a du mal à reformuler le contenu après lecture"
    }
  },
  {
    text: {
      hu: "nehezen kapcsolja össze a részleteket a teljes jelentéssel",
      en: "has difficulty connecting details to overall meaning",
      de: "hat Schwierigkeiten, Details mit der Gesamtbedeutung zu verbinden",
      it: "ha difficoltà a collegare i dettagli al significato generale",
      es: "tiene dificultad para conectar los detalles con el significado global",
      zh: "难以把细节与整体意义联系起来",
      ja: "細部と全体の意味を結びつけるのが難しい",
      ar: "يجد صعوبة في ربط التفاصيل بالمعنى العام",
      pl: "ma trudność z łączeniem szczegółów z ogólnym znaczeniem",
      pt: "tem dificuldade em conectar detalhes ao significado geral",
      fr: "a du mal à relier les détails au sens global"
    }
  },
  {
    text: {
      hu: "olvasott információból nehezen von le következtetéseket",
      en: "has difficulty making inferences from reading",
      de: "hat Schwierigkeiten, aus Gelesenem Schlussfolgerungen zu ziehen",
      it: "ha difficoltà a fare inferenze da ciò che legge",
      es: "tiene dificultad para sacar conclusiones de lo leído",
      zh: "难以从阅读内容中做出推断",
      ja: "読んだ情報から推論するのが難しい",
      ar: "يجد صعوبة في استنتاج المعاني من المقروء",
      pl: "ma trudność z wyciąganiem wniosków z przeczytanego tekstu",
      pt: "tem dificuldade em fazer inferências a partir da leitura",
      fr: "a du mal à faire des inférences à partir de la lecture"
    }
  },
  {
    text: {
      hu: "szövegértésnél sok támogatást igényel",
      en: "needs substantial support with reading comprehension",
      de: "braucht viel Unterstützung beim Textverständnis",
      it: "ha bisogno di molto supporto nella comprensione del testo",
      es: "necesita mucho apoyo para la comprensión lectora",
      zh: "在阅读理解方面需要大量支持",
      ja: "読解に多くの支援が必要である",
      ar: "يحتاج إلى الكثير من الدعم في فهم النص",
      pl: "potrzebuje dużo wsparcia w rozumieniu tekstu",
      pt: "precisa de muito apoio em compreensão de leitura",
      fr: "a besoin de beaucoup de soutien pour la compréhension de texte"
    }
  }
];

const WRITTEN_EXPRESSION_BASE = [
  {
    text: {
      hu: "sok hibát vét írásban vagy másoláskor",
      en: "makes many errors in writing or copying",
      de: "macht viele Fehler beim Schreiben oder Abschreiben",
      it: "fa molti errori nello scrivere o copiare",
      es: "comete muchos errores al escribir o copiar",
      zh: "书写或抄写时错误很多",
      ja: "書くときや写すときにミスが多い",
      ar: "يرتكب الكثير من الأخطاء في الكتابة أو النسخ",
      pl: "popełnia wiele błędów podczas pisania lub przepisywania",
      pt: "comete muitos erros ao escrever ou copiar",
      fr: "fait beaucoup d'erreurs en écrivant ou en recopiant"
    }
  },
  {
    text: {
      hu: "írása rendezetlenebb vagy nehezebben követhető",
      en: "written work is disorganized or hard to follow",
      de: "schriftliche Arbeiten sind unstrukturiert oder schwer nachvollziehbar",
      it: "gli elaborati scritti sono disorganizzati o difficili da seguire",
      es: "los escritos son desorganizados o difíciles de seguir",
      zh: "书面表达缺乏条理或难以跟随",
      ja: "書いた内容がまとまりに欠け、追いにくい",
      ar: "تكون أعماله الكتابية غير منظمة أو يصعب تتبعها",
      pl: "jego wypowiedzi pisemne są chaotyczne lub trudne do śledzenia",
      pt: "a produção escrita é desorganizada ou difícil de acompanhar",
      fr: "les productions écrites sont désorganisées ou difficiles à suivre"
    }
  },
  {
    text: {
      hu: "nehezen formálja írásba a gondolatait",
      en: "has difficulty turning thoughts into written form",
      de: "hat Schwierigkeiten, Gedanken schriftlich auszudrücken",
      it: "ha difficoltà a trasformare i pensieri in forma scritta",
      es: "tiene dificultad para expresar sus ideas por escrito",
      zh: "难以把想法组织成书面表达",
      ja: "考えを文章にするのが難しい",
      ar: "يجد صعوبة في تحويل أفكاره إلى صياغة مكتوبة",
      pl: "ma trudność z przełożeniem myśli na formę pisemną",
      pt: "tem dificuldade em transformar pensamentos em escrita",
      fr: "a du mal à mettre ses idées par écrit"
    }
  },
  {
    text: {
      hu: "helyesírási vagy betűalakítási nehézségei vannak",
      en: "shows spelling or letter-formation difficulties",
      de: "zeigt Schwierigkeiten in Rechtschreibung oder Buchstabenbildung",
      it: "mostra difficoltà di ortografia o formazione delle lettere",
      es: "presenta dificultades de ortografía o formación de letras",
      zh: "拼写或字形书写方面有困难",
      ja: "綴りや文字形成に困難がある",
      ar: "يُظهر صعوبات في الإملاء أو تشكيل الحروف",
      pl: "wykazuje trudności z ortografią lub kształtowaniem liter",
      pt: "apresenta dificuldades ortográficas ou de formação de letras",
      fr: "présente des difficultés d'orthographe ou de formation des lettres"
    }
  },
  {
    text: {
      hu: "írásbeli feladatoknál nagyobb erőfeszítésre van szüksége az elvártnál",
      en: "needs more effort than expected for written tasks",
      de: "braucht mehr Anstrengung als erwartet für schriftliche Aufgaben",
      it: "richiede più sforzo del previsto per compiti scritti",
      es: "necesita más esfuerzo del esperado en tareas escritas",
      zh: "完成书面任务所需努力明显高于预期",
      ja: "書字課題で年齢相応以上の努力が必要になる",
      ar: "يحتاج إلى جهد أكبر من المتوقع في المهام الكتابية",
      pl: "potrzebuje większego wysiłku niż oczekiwano przy zadaniach pisemnych",
      pt: "precisa de mais esforço do que o esperado em tarefas escritas",
      fr: "a besoin de plus d'effort que prévu pour les tâches écrites"
    }
  }
];

const MATH_BASE = [
  {
    text: {
      hu: "bizonytalan az alapvető matematikai műveletekben",
      en: "is uncertain with basic math operations",
      de: "ist bei grundlegenden Rechenoperationen unsicher",
      it: "è insicuro nelle operazioni matematiche di base",
      es: "muestra inseguridad en operaciones matemáticas básicas",
      zh: "基础数学运算不够稳定",
      ja: "基本的な計算に不安定さがある",
      ar: "يُظهر ترددًا في العمليات الحسابية الأساسية",
      pl: "jest niepewny przy podstawowych działaniach matematycznych",
      pt: "mostra insegurança em operações matemáticas básicas",
      fr: "montre des hésitations dans les opérations mathématiques de base"
    }
  },
  {
    text: {
      hu: "nehezen érti a matematikai feladatok logikáját",
      en: "has difficulty understanding the logic of math tasks",
      de: "hat Schwierigkeiten, die Logik mathematischer Aufgaben zu verstehen",
      it: "ha difficoltà a comprendere la logica dei compiti matematici",
      es: "tiene dificultad para entender la lógica de las tareas matemáticas",
      zh: "难以理解数学任务的逻辑",
      ja: "数学課題の考え方や筋道を理解しにくい",
      ar: "يجد صعوبة في فهم منطق المسائل الرياضية",
      pl: "ma trudność ze zrozumieniem logiki zadań matematycznych",
      pt: "tem dificuldade em entender a lógica das tarefas de matemática",
      fr: "a du mal à comprendre la logique des tâches mathématiques"
    }
  },
  {
    text: {
      hu: "számolási pontossága vagy tempója elmarad az elvárttól",
      en: "calculation accuracy or speed is below expectation",
      de: "Rechengenauigkeit oder Tempo liegen unter der Erwartung",
      it: "accuratezza o velocità di calcolo sono inferiori alle aspettative",
      es: "la precisión o velocidad de cálculo están por debajo de lo esperado",
      zh: "计算准确性或速度低于预期",
      ja: "計算の正確さや速さが期待より低い",
      ar: "تكون دقة الحساب أو سرعته أقل من المتوقع",
      pl: "dokładność lub tempo liczenia są poniżej oczekiwań",
      pt: "a precisão ou velocidade de cálculo estão abaixo do esperado",
      fr: "la précision ou la vitesse de calcul est inférieure à ce qui est attendu"
    }
  },
  {
    text: {
      hu: "matematikánál könnyen elveszíti a feladat menetét",
      en: "easily loses track during math work",
      de: "verliert bei Mathematik leicht den Faden",
      it: "perde facilmente il filo durante il lavoro di matematica",
      es: "pierde fácilmente el hilo durante el trabajo matemático",
      zh: "做数学时容易跟不上步骤",
      ja: "数学の途中で手順を見失いやすい",
      ar: "يفقد تسلسل الحل بسهولة أثناء الرياضيات",
      pl: "łatwo gubi tok zadania podczas matematyki",
      pt: "perde facilmente o fio durante a matemática",
      fr: "perd facilement le fil pendant le travail en mathématiques"
    }
  },
  {
    text: {
      hu: "matematikai helyzetekben sok támogatást igényel",
      en: "needs substantial support in math situations",
      de: "braucht viel Unterstützung in mathematischen Situationen",
      it: "ha bisogno di molto supporto nelle situazioni matematiche",
      es: "necesita mucho apoyo en situaciones matemáticas",
      zh: "在数学情境中需要大量支持",
      ja: "数学場面で多くの支援が必要である",
      ar: "يحتاج إلى الكثير من الدعم في المواقف الرياضية",
      pl: "potrzebuje dużo wsparcia w sytuacjach matematycznych",
      pt: "precisa de muito apoio em situações matemáticas",
      fr: "a besoin de beaucoup de soutien dans les situations mathématiques"
    }
  }
];

const EXECUTION_BASE = [
  {
    text: {
      hu: "nehezen érti meg a feladatutasításokat",
      en: "has difficulty understanding task instructions",
      de: "hat Schwierigkeiten, Aufgabenanweisungen zu verstehen",
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
      hu: "sok segítséget igényel ahhoz, hogy elinduljon egy tanulási feladattal",
      en: "needs a lot of help to get started on learning tasks",
      de: "braucht viel Hilfe, um mit Lernaufgaben zu beginnen",
      it: "ha bisogno di molto aiuto per iniziare compiti di apprendimento",
      es: "necesita mucha ayuda para empezar tareas de aprendizaje",
      zh: "开始学习任务时需要很多帮助",
      ja: "学習課題を始めるのに多くの支援が必要である",
      ar: "يحتاج إلى الكثير من المساعدة لبدء المهام التعليمية",
      pl: "potrzebuje dużo pomocy, aby zacząć zadania edukacyjne",
      pt: "precisa de muita ajuda para começar tarefas de aprendizagem",
      fr: "a besoin de beaucoup d'aide pour commencer les tâches d'apprentissage"
    }
  },
  {
    text: {
      hu: "tanulási helyzetekben teljesítménye feltűnően ingadozó",
      en: "shows noticeably inconsistent performance in learning situations",
      de: "zeigt in Lernsituationen auffallend schwankende Leistungen",
      it: "mostra prestazioni notevolmente incoerenti nelle situazioni di apprendimento",
      es: "muestra un rendimiento notablemente inconsistente en situaciones de aprendizaje",
      zh: "在学习情境中表现明显不稳定",
      ja: "学習場面での出来がかなり不安定である",
      ar: "يُظهر أداءً متقلبًا بشكل ملحوظ في مواقف التعلم",
      pl: "wykazuje wyraźnie nierówne wyniki w sytuacjach edukacyjnych",
      pt: "apresenta desempenho claramente inconsistente em situações de aprendizagem",
      fr: "présente des performances nettement irrégulières dans les situations d'apprentissage"
    }
  },
  {
    text: {
      hu: "gyorsabban elfárad tanulási terhelés alatt, mint várható lenne",
      en: "tires faster under learning demands than expected",
      de: "ermüdet unter Lernanforderungen schneller als erwartet",
      it: "si stanca più rapidamente del previsto sotto richieste di apprendimento",
      es: "se fatiga más rápido de lo esperado bajo demandas de aprendizaje",
      zh: "在学习负荷下比预期更快疲劳",
      ja: "学習負荷がかかると想定より早く疲れる",
      ar: "يتعب أسرع من المتوقع تحت متطلبات التعلم",
      pl: "męczy się szybciej niż oczekiwano przy obciążeniu nauką",
      pt: "cansa mais rápido do que o esperado sob demandas de aprendizagem",
      fr: "se fatigue plus vite que prévu sous la charge d'apprentissage"
    }
  },
  {
    text: {
      hu: "nagyobb erőfeszítés ellenére is elmaradhat az életkorától elvárttól",
      en: "may perform below age expectations despite strong effort",
      de: "kann trotz großer Anstrengung unter den altersbezogenen Erwartungen bleiben",
      it: "può restare al di sotto delle aspettative per l'età nonostante un forte impegno",
      es: "puede rendir por debajo de lo esperado para su edad a pesar de un gran esfuerzo",
      zh: "即使付出较大努力，表现也可能低于同龄预期",
      ja: "強い努力をしていても年齢相応の期待に届かないことがある",
      ar: "قد يكون أداؤه أقل من المتوقع لعمره رغم الجهد الكبير",
      pl: "może osiągać wyniki poniżej oczekiwań dla wieku mimo dużego wysiłku",
      pt: "pode ficar abaixo do esperado para a idade apesar de grande esforço",
      fr: "peut rester en dessous des attentes pour son âge malgré de gros efforts"
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

const READING_DECODING = buildQuestions("learn", "reading_decoding", READING_DECODING_BASE, 1);
const READING_COMPREHENSION = buildQuestions("learn", "reading_comprehension", READING_COMPREHENSION_BASE, 51);
const WRITTEN_EXPRESSION = buildQuestions("learn", "written_expression", WRITTEN_EXPRESSION_BASE, 101);
const MATH_SKILLS = buildQuestions("learn", "math_skills", MATH_BASE, 151);
const LEARNING_EXECUTION = buildQuestions("learn", "learning_execution", EXECUTION_BASE, 201);

export const LEARNING_BANK = [
  ...READING_DECODING,
  ...READING_COMPREHENSION,
  ...WRITTEN_EXPRESSION,
  ...MATH_SKILLS,
  ...LEARNING_EXECUTION
];