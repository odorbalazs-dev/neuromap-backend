const SUPPORTED_LANGS = Object.freeze([
  "hu", "en", "de", "it", "es", "zh", "ja", "ar", "pl", "pt", "fr"
]);

const COPY = Object.freeze({
  hu: {
    packageName: "NeuroMap Kids Plus",
    disclosure: "Automatikusan, a szülő válaszaiból készült segédanyag. Nem szakember által ellenőrzött vélemény, nem diagnózis és nem helyettesít személyes vizsgálatot.",
    summaryTitle: "Megosztható szülői megfigyelési összefoglaló",
    actionTitle: "Három helyzetre szabott következő lépés",
    actions: [
      ["Otthon", "Válassz ki egy visszatérő helyzetet, figyeld meg az előzményt, a gyermek reakcióját és azt, mi segített megnyugodni vagy továbblépni."],
      ["Óvodában vagy iskolában", "Kérj egy konkrét, friss példát ugyanarra a viselkedési mintára, majd hasonlítsátok össze az otthoni megfigyeléssel."],
      ["Nehéz átmeneteknél", "Jelezd előre a változást, bontsd két-három rövid lépésre, és jegyezd fel, melyik támogatás csökkentette leginkább a feszültséget."]
    ],
    conversationTitle: "Beszélgetési segédlet óvodához vagy iskolához",
    conversation: "Tényekkel indulj: mikor, milyen helyzetben, milyen gyakran látható a minta, és mi segít. Kerüld a címkéket; kérjetek két hétre egy közös, megfigyelhető célt.",
    diaryTitle: "14 napos megfigyelési napló",
    diaryIntro: "Naponta legfeljebb egy rövid bejegyzés. A cél a helyzetek és a változás észrevétele, nem a gyermek folyamatos pontozása.",
    nearbyTitle: "Szakember keresése a közelben",
    nearbyDisclaimer: "A találatok nyilvános keresési eredmények, nem a NeuroMap Kids szakmai ajánlásai. Mindig ellenőrizd a végzettséget, jogosultságot és gyermekekkel szerzett tapasztalatot.",
    reminderSubjects: {
      day_1: "Elindult a 14 napos megfigyelési napló",
      day_7: "Félidőnél jár a megfigyelési napló",
      day_14: "Elkészült a 14 napos trendösszegzés"
    },
    reminderBodies: {
      day_1: "Nyisd meg a biztonságos naplólinket, és rögzíts egy rövid, konkrét megfigyelést.",
      day_7: "Nézd meg, mely helyzetek ismétlődnek, és mi segített a gyermeknek a legtöbbször.",
      day_14: "A napló alapján elkészült az automatikus trendösszegzés. Ez tájékoztató segédanyag, nem diagnózis."
    }
  },
  en: {
    packageName: "NeuroMap Kids Plus",
    disclosure: "Automatically generated from the parent's answers. It is not professionally reviewed, is not a diagnosis, and does not replace an in-person assessment.",
    summaryTitle: "Shareable parent observation summary",
    actionTitle: "Three situation-specific next steps",
    actions: [
      ["At home", "Choose one recurring situation and note what happened before it, how the child responded, and what helped them settle or move forward."],
      ["At preschool or school", "Ask for one recent concrete example of the same behavior pattern and compare it with what you observe at home."],
      ["During difficult transitions", "Give advance notice, break the change into two or three short steps, and note which support reduced tension most."]
    ],
    conversationTitle: "Preschool or school conversation guide",
    conversation: "Start with facts: when, where, and how often the pattern appears, and what helps. Avoid labels and agree on one observable goal for the next two weeks.",
    diaryTitle: "14-day observation diary",
    diaryIntro: "Add no more than one short entry per day. The aim is to notice contexts and change, not to score the child continuously.",
    nearbyTitle: "Find a professional nearby",
    nearbyDisclaimer: "Results are public search results, not professional recommendations from NeuroMap Kids. Always verify qualifications, licensing, and experience with children.",
    reminderSubjects: { day_1: "Your 14-day observation diary is ready", day_7: "You are halfway through the observation diary", day_14: "Your 14-day trend summary is ready" },
    reminderBodies: { day_1: "Open your secure diary link and record one brief, concrete observation.", day_7: "Review which situations repeat and what has helped the child most often.", day_14: "An automated trend summary has been created from the diary. It is informational and not a diagnosis." }
  },
  de: {
    packageName: "NeuroMap Kids Plus",
    disclosure: "Automatisch aus den Antworten der Eltern erstellt. Nicht fachlich geprüft, keine Diagnose und kein Ersatz für eine persönliche Untersuchung.",
    summaryTitle: "Teilbare elterliche Beobachtungsübersicht",
    actionTitle: "Drei situationsbezogene nächste Schritte",
    actions: [["Zu Hause", "Wähle eine wiederkehrende Situation und notiere Auslöser, Reaktion und hilfreiche Unterstützung."], ["In Kita oder Schule", "Bitte um ein aktuelles konkretes Beispiel und vergleiche es mit den Beobachtungen zu Hause."], ["Bei schwierigen Übergängen", "Kündige Veränderungen an, teile sie in kurze Schritte und notiere, was Anspannung reduziert."]],
    conversationTitle: "Gesprächshilfe für Kita oder Schule",
    conversation: "Beginne mit Fakten zu Situation, Häufigkeit und hilfreichen Maßnahmen. Vermeide Etiketten und vereinbart ein beobachtbares Ziel für zwei Wochen.",
    diaryTitle: "14-Tage-Beobachtungstagebuch",
    diaryIntro: "Höchstens ein kurzer Eintrag pro Tag. Ziel ist es, Zusammenhänge und Veränderungen zu erkennen, nicht das Kind ständig zu bewerten.",
    nearbyTitle: "Fachperson in der Nähe finden",
    nearbyDisclaimer: "Die Treffer sind öffentliche Suchergebnisse und keine Empfehlung von NeuroMap Kids. Qualifikation, Zulassung und Erfahrung mit Kindern bitte selbst prüfen.",
    reminderSubjects: { day_1: "Dein 14-Tage-Tagebuch ist bereit", day_7: "Halbzeit im Beobachtungstagebuch", day_14: "Deine 14-Tage-Trendübersicht ist bereit" },
    reminderBodies: { day_1: "Öffne den sicheren Link und notiere eine kurze konkrete Beobachtung.", day_7: "Prüfe, welche Situationen sich wiederholen und was am häufigsten hilft.", day_14: "Aus dem Tagebuch wurde eine automatische Trendübersicht erstellt. Sie ist keine Diagnose." }
  },
  it: {
    packageName: "NeuroMap Kids Plus",
    disclosure: "Generato automaticamente dalle risposte del genitore. Non è revisionato da uno specialista, non è una diagnosi e non sostituisce una valutazione in presenza.",
    summaryTitle: "Sintesi condivisibile delle osservazioni del genitore",
    actionTitle: "Tre passi successivi per situazioni specifiche",
    actions: [["A casa", "Scegli una situazione ricorrente e annota antecedente, reazione e supporto utile."], ["A scuola", "Chiedi un esempio recente e concreto dello stesso schema e confrontalo con casa."], ["Nelle transizioni difficili", "Anticipa il cambiamento, dividilo in pochi passi e annota cosa riduce la tensione."]],
    conversationTitle: "Guida al colloquio con scuola o asilo",
    conversation: "Parti dai fatti: quando, dove, con quale frequenza e cosa aiuta. Evita etichette e concordate un obiettivo osservabile per due settimane.",
    diaryTitle: "Diario di osservazione di 14 giorni",
    diaryIntro: "Massimo una breve nota al giorno. Serve a riconoscere contesti e cambiamenti, non a valutare continuamente il bambino.",
    nearbyTitle: "Trova uno specialista vicino",
    nearbyDisclaimer: "I risultati sono pubblici e non sono raccomandazioni di NeuroMap Kids. Verifica qualifiche, abilitazione ed esperienza con bambini.",
    reminderSubjects: { day_1: "Il diario di 14 giorni è pronto", day_7: "Sei a metà del diario", day_14: "La sintesi dei 14 giorni è pronta" },
    reminderBodies: { day_1: "Apri il link sicuro e registra una breve osservazione concreta.", day_7: "Controlla quali situazioni si ripetono e cosa aiuta più spesso.", day_14: "È stata creata una sintesi automatica delle tendenze. Non è una diagnosi." }
  },
  es: {
    packageName: "NeuroMap Kids Plus",
    disclosure: "Generado automáticamente a partir de las respuestas del progenitor. No está revisado por un profesional, no es un diagnóstico ni sustituye una evaluación presencial.",
    summaryTitle: "Resumen compartible de observaciones familiares",
    actionTitle: "Tres próximos pasos según la situación",
    actions: [["En casa", "Elige una situación recurrente y anota qué ocurrió antes, la respuesta y qué ayuda funcionó."], ["En la escuela", "Pide un ejemplo reciente y concreto del mismo patrón y compáralo con casa."], ["En transiciones difíciles", "Anticipa el cambio, divídelo en pocos pasos y anota qué reduce mejor la tensión."]],
    conversationTitle: "Guía para hablar con la escuela",
    conversation: "Empieza con hechos: cuándo, dónde, con qué frecuencia y qué ayuda. Evita etiquetas y acordad un objetivo observable durante dos semanas.",
    diaryTitle: "Diario de observación de 14 días",
    diaryIntro: "Como máximo una entrada breve al día. Busca reconocer contextos y cambios, no puntuar al niño de forma continua.",
    nearbyTitle: "Buscar un profesional cercano",
    nearbyDisclaimer: "Los resultados son búsquedas públicas, no recomendaciones de NeuroMap Kids. Verifica titulación, habilitación y experiencia con niños.",
    reminderSubjects: { day_1: "Tu diario de 14 días está listo", day_7: "Has llegado a la mitad del diario", day_14: "Tu resumen de tendencias está listo" },
    reminderBodies: { day_1: "Abre el enlace seguro y registra una observación breve y concreta.", day_7: "Revisa qué situaciones se repiten y qué ayuda con más frecuencia.", day_14: "Se ha creado un resumen automático de tendencias. No es un diagnóstico." }
  },
  fr: {
    packageName: "NeuroMap Kids Plus",
    disclosure: "Généré automatiquement à partir des réponses du parent. Non relu par un professionnel, ce document n'est pas un diagnostic et ne remplace pas une évaluation en personne.",
    summaryTitle: "Synthèse parentale partageable",
    actionTitle: "Trois prochaines étapes selon la situation",
    actions: [["À la maison", "Choisissez une situation récurrente et notez le contexte, la réaction et l'aide utile."], ["À l'école", "Demandez un exemple récent et concret du même schéma puis comparez-le avec la maison."], ["Lors des transitions", "Annoncez le changement, découpez-le en étapes et notez ce qui réduit le mieux la tension."]],
    conversationTitle: "Guide de discussion avec l'école",
    conversation: "Commencez par les faits : contexte, fréquence et aides utiles. Évitez les étiquettes et convenez d'un objectif observable pour deux semaines.",
    diaryTitle: "Journal d'observation sur 14 jours",
    diaryIntro: "Une courte entrée maximum par jour. L'objectif est de repérer les contextes et les changements, pas de noter l'enfant en continu.",
    nearbyTitle: "Trouver un professionnel à proximité",
    nearbyDisclaimer: "Les résultats proviennent d'une recherche publique et ne sont pas des recommandations de NeuroMap Kids. Vérifiez qualifications, autorisation et expérience avec les enfants.",
    reminderSubjects: { day_1: "Votre journal de 14 jours est prêt", day_7: "Vous êtes à mi-parcours", day_14: "Votre synthèse de tendance est prête" },
    reminderBodies: { day_1: "Ouvrez le lien sécurisé et saisissez une observation brève et concrète.", day_7: "Repérez les situations récurrentes et les aides les plus utiles.", day_14: "Une synthèse automatique a été créée. Elle ne constitue pas un diagnostic." }
  },
  pt: {
    packageName: "NeuroMap Kids Plus",
    disclosure: "Gerado automaticamente a partir das respostas do responsável. Não é revisto por um profissional, não é um diagnóstico e não substitui uma avaliação presencial.",
    summaryTitle: "Resumo compartilhável das observações da família",
    actionTitle: "Três próximos passos conforme a situação",
    actions: [["Em casa", "Escolha uma situação recorrente e anote o que veio antes, a reação e o apoio que ajudou."], ["Na escola", "Peça um exemplo recente e concreto do mesmo padrão e compare com casa."], ["Em transições difíceis", "Avise antes, divida a mudança em passos curtos e anote o que mais reduz a tensão."]],
    conversationTitle: "Guia de conversa com a escola",
    conversation: "Comece pelos fatos: contexto, frequência e o que ajuda. Evite rótulos e combinem uma meta observável por duas semanas.",
    diaryTitle: "Diário de observação de 14 dias",
    diaryIntro: "No máximo uma entrada curta por dia. O objetivo é perceber contextos e mudanças, não pontuar a criança continuamente.",
    nearbyTitle: "Encontrar um profissional próximo",
    nearbyDisclaimer: "Os resultados são buscas públicas, não recomendações da NeuroMap Kids. Verifique formação, registro e experiência com crianças.",
    reminderSubjects: { day_1: "Seu diário de 14 dias está pronto", day_7: "Você chegou à metade do diário", day_14: "Seu resumo de tendências está pronto" },
    reminderBodies: { day_1: "Abra o link seguro e registre uma observação breve e concreta.", day_7: "Veja quais situações se repetem e o que ajuda com mais frequência.", day_14: "Foi criado um resumo automático de tendências. Não é um diagnóstico." }
  },
  pl: {
    packageName: "NeuroMap Kids Plus",
    disclosure: "Materiał wygenerowany automatycznie na podstawie odpowiedzi rodzica. Nie został sprawdzony przez specjalistę, nie jest diagnozą i nie zastępuje badania osobistego.",
    summaryTitle: "Udostępniane podsumowanie obserwacji rodzica",
    actionTitle: "Trzy kolejne kroki dopasowane do sytuacji",
    actions: [["W domu", "Wybierz powtarzającą się sytuację i zanotuj, co ją poprzedzało, reakcję oraz pomoc, która zadziałała."], ["W przedszkolu lub szkole", "Poproś o aktualny konkretny przykład tego samego wzorca i porównaj go z domem."], ["Przy trudnych zmianach", "Zapowiedz zmianę, podziel ją na krótkie kroki i zanotuj, co najlepiej zmniejsza napięcie."]],
    conversationTitle: "Przewodnik rozmowy ze szkołą",
    conversation: "Zacznij od faktów: sytuacja, częstotliwość i to, co pomaga. Unikaj etykiet i ustalcie jeden obserwowalny cel na dwa tygodnie.",
    diaryTitle: "14-dniowy dziennik obserwacji",
    diaryIntro: "Maksymalnie jeden krótki wpis dziennie. Celem jest zauważenie kontekstu i zmian, nie ciągłe ocenianie dziecka.",
    nearbyTitle: "Znajdź specjalistę w pobliżu",
    nearbyDisclaimer: "Wyniki pochodzą z publicznej wyszukiwarki i nie są rekomendacją NeuroMap Kids. Sprawdź kwalifikacje, uprawnienia i doświadczenie z dziećmi.",
    reminderSubjects: { day_1: "Twój dziennik 14-dniowy jest gotowy", day_7: "Połowa dziennika za Tobą", day_14: "Podsumowanie trendu jest gotowe" },
    reminderBodies: { day_1: "Otwórz bezpieczny link i zapisz jedną krótką, konkretną obserwację.", day_7: "Sprawdź, które sytuacje się powtarzają i co pomaga najczęściej.", day_14: "Utworzono automatyczne podsumowanie trendu. Nie jest ono diagnozą." }
  },
  ja: {
    packageName: "NeuroMap Kids Plus",
    disclosure: "保護者の回答から自動生成された資料です。専門家の確認を受けた所見や診断ではなく、対面評価の代わりにはなりません。",
    summaryTitle: "共有できる保護者観察サマリー",
    actionTitle: "場面別の3つの次のステップ",
    actions: [["家庭で", "繰り返す場面を一つ選び、直前の出来事、子どもの反応、役立った支援を記録します。"], ["園や学校で", "同じ行動パターンの最近の具体例を一つ尋ね、家庭での観察と比べます。"], ["難しい切り替えで", "変化を前もって伝え、短い手順に分け、緊張を最も下げた支援を記録します。"]],
    conversationTitle: "園・学校との話し合いガイド",
    conversation: "場面、頻度、役立つ対応などの事実から始めます。決めつけを避け、2週間の観察可能な目標を一つ共有します。",
    diaryTitle: "14日間の観察日誌",
    diaryIntro: "1日1件までの短い記録です。子どもを常に採点するのではなく、場面と変化に気づくことが目的です。",
    nearbyTitle: "近くの専門家を探す",
    nearbyDisclaimer: "表示されるのは公開検索結果であり、NeuroMap Kidsの専門家推薦ではありません。資格、登録、子どもへの支援経験を確認してください。",
    reminderSubjects: { day_1: "14日間の観察日誌を開始できます", day_7: "観察日誌の半分まで進みました", day_14: "14日間の傾向サマリーが完成しました" },
    reminderBodies: { day_1: "安全な日誌リンクを開き、短く具体的な観察を一つ記録してください。", day_7: "繰り返す場面と、最も役立った対応を確認してください。", day_14: "日誌から自動的に傾向サマリーが作成されました。診断ではありません。" }
  },
  zh: {
    packageName: "NeuroMap Kids Plus",
    disclosure: "本材料根据家长回答自动生成，未经专业人员审核，不构成诊断，也不能替代面对面评估。",
    summaryTitle: "可分享的家长观察摘要",
    actionTitle: "三个情境化后续步骤",
    actions: [["在家中", "选择一个反复出现的情境，记录之前发生了什么、孩子的反应以及哪种支持有效。"], ["在幼儿园或学校", "请老师提供同一行为模式的一个近期具体例子，并与家庭观察进行比较。"], ["在困难的转换中", "提前告知变化，将其分成几个短步骤，并记录哪种支持最能降低紧张。"]],
    conversationTitle: "与幼儿园或学校沟通指南",
    conversation: "从事实开始：何时、何地、频率以及什么有帮助。避免贴标签，并共同设定一个为期两周、可观察的目标。",
    diaryTitle: "14天观察日记",
    diaryIntro: "每天最多记录一条简短观察。目的是识别情境和变化，而不是持续给孩子评分。",
    nearbyTitle: "查找附近的专业人员",
    nearbyDisclaimer: "结果来自公开搜索，并非NeuroMap Kids的专业推荐。请核实资质、执业资格及儿童工作经验。",
    reminderSubjects: { day_1: "14天观察日记已准备好", day_7: "观察日记已进行到一半", day_14: "14天趋势摘要已完成" },
    reminderBodies: { day_1: "打开安全日记链接并记录一条简短、具体的观察。", day_7: "查看哪些情境重复出现，以及什么最常有帮助。", day_14: "系统已根据日记生成自动趋势摘要。它不构成诊断。" }
  },
  ar: {
    packageName: "NeuroMap Kids Plus",
    disclosure: "مادة مولدة تلقائياً من إجابات ولي الأمر. لم يراجعها مختص، وليست تشخيصاً ولا بديلاً عن التقييم الحضوري.",
    summaryTitle: "ملخص ملاحظات ولي الأمر القابل للمشاركة",
    actionTitle: "ثلاث خطوات تالية حسب الموقف",
    actions: [["في المنزل", "اختر موقفاً متكرراً وسجل ما سبقه واستجابة الطفل وما ساعده."], ["في الروضة أو المدرسة", "اطلب مثالاً حديثاً ومحدداً للنمط نفسه وقارنه بما تلاحظه في المنزل."], ["عند الانتقالات الصعبة", "أخبر الطفل بالتغيير مسبقاً وقسمه إلى خطوات قصيرة وسجل ما خفف التوتر أكثر."]],
    conversationTitle: "دليل الحوار مع الروضة أو المدرسة",
    conversation: "ابدأ بالوقائع: متى وأين وكم مرة وما الذي يساعد. تجنب التصنيفات واتفقوا على هدف واحد قابل للملاحظة لمدة أسبوعين.",
    diaryTitle: "سجل ملاحظات لمدة 14 يوماً",
    diaryIntro: "إدخال قصير واحد كحد أقصى يومياً. الهدف ملاحظة السياق والتغير، وليس تقييم الطفل باستمرار.",
    nearbyTitle: "البحث عن مختص قريب",
    nearbyDisclaimer: "النتائج من بحث عام وليست توصيات مهنية من NeuroMap Kids. تحقق من المؤهلات والترخيص والخبرة مع الأطفال.",
    reminderSubjects: { day_1: "سجل الملاحظات لمدة 14 يوماً جاهز", day_7: "وصلت إلى منتصف سجل الملاحظات", day_14: "ملخص الاتجاهات لمدة 14 يوماً جاهز" },
    reminderBodies: { day_1: "افتح الرابط الآمن وسجل ملاحظة قصيرة ومحددة.", day_7: "راجع المواقف المتكررة وما ساعد الطفل أكثر.", day_14: "تم إنشاء ملخص آلي للاتجاهات من السجل. وهو ليس تشخيصاً." }
  }
});

export function getPlusContent(lang = "en") {
  const safeLang = SUPPORTED_LANGS.includes(lang) ? lang : "en";
  return { lang: safeLang, ...COPY[safeLang] };
}

export function isSupportedPlusLanguage(lang) {
  return SUPPORTED_LANGS.includes(lang);
}
