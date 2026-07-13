(function () {
  "use strict";

  const token = decodeURIComponent(window.location.pathname.split("/").filter(Boolean).pop() || "");
  const apiUrl = `/observation/api/${encodeURIComponent(token)}`;
  let program = null;

  const UI = {
    hu: { title: "14 napos megfigyelési napló", progress: "Haladás", today: "Mai megfigyelés", entry: "Megfigyelés rögzítése", date: "Dátum", context: "Helyzet", signal: "Mennyire volt erős a nehézség?", strategy: "Használtatok előre eltervezett segítséget", note: "Rövid, tényszerű megjegyzés (nem kötelező)", save: "Megfigyelés mentése", saving: "Mentés...", saved: "A megfigyelés elmentve.", history: "Rögzített napok", empty: "Még nincs rögzített megfigyelés.", location: "Település vagy irányítószám", maps: "Keresés térképen", trend: { insufficient_data: "Néhány további bejegyzés után megjelenik a trend.", improving: "A közelmúltbeli bejegyzésekben alacsonyabb jelzésszint látszik.", stable: "A jelzésszint egyelőre nagyjából stabil.", increasing: "A közelmúltbeli bejegyzésekben magasabb jelzésszint látszik." }, contexts: ["Reggel", "Tanulás", "Társas helyzet", "Átmenet", "Este", "Egyéb"], levels: ["Nem jelent meg", "Enyhe", "Közepes", "Erős"], strategyShort: "Támogatás használva" },
    en: { title: "14-day observation diary", progress: "Progress", today: "Today's observation", entry: "Add an observation", date: "Date", context: "Situation", signal: "How strong was the difficulty?", strategy: "A planned support strategy was used", note: "Short factual note (optional)", save: "Save observation", saving: "Saving...", saved: "Observation saved.", history: "Recorded days", empty: "No observations have been recorded yet.", location: "City or postal code", maps: "Search maps", trend: { insufficient_data: "A trend will appear after a few more entries.", improving: "Recent entries show a lower signal level.", stable: "The signal level is broadly stable so far.", increasing: "Recent entries show a higher signal level." }, contexts: ["Morning", "Learning", "Social", "Transition", "Evening", "Other"], levels: ["Not present", "Mild", "Moderate", "Strong"], strategyShort: "Support used" },
    de: { title: "14-Tage-Beobachtungstagebuch", progress: "Fortschritt", today: "Heutige Beobachtung", entry: "Beobachtung hinzufügen", date: "Datum", context: "Situation", signal: "Wie stark war die Schwierigkeit?", strategy: "Eine geplante Unterstützung wurde eingesetzt", note: "Kurze sachliche Notiz (optional)", save: "Beobachtung speichern", saving: "Wird gespeichert...", saved: "Beobachtung gespeichert.", history: "Erfasste Tage", empty: "Noch keine Beobachtung erfasst.", location: "Ort oder Postleitzahl", maps: "Auf Karte suchen", trend: { insufficient_data: "Nach weiteren Einträgen wird ein Trend angezeigt.", improving: "Die letzten Einträge zeigen ein niedrigeres Signal.", stable: "Das Signal ist bisher weitgehend stabil.", increasing: "Die letzten Einträge zeigen ein höheres Signal." }, contexts: ["Morgen", "Lernen", "Sozial", "Übergang", "Abend", "Andere"], levels: ["Nicht vorhanden", "Leicht", "Mittel", "Stark"], strategyShort: "Unterstützung eingesetzt" },
    it: { title: "Diario di osservazione di 14 giorni", progress: "Progresso", today: "Osservazione di oggi", entry: "Aggiungi un'osservazione", date: "Data", context: "Situazione", signal: "Quanto era intensa la difficoltà?", strategy: "È stata usata una strategia pianificata", note: "Nota breve e concreta (facoltativa)", save: "Salva osservazione", saving: "Salvataggio...", saved: "Osservazione salvata.", history: "Giorni registrati", empty: "Nessuna osservazione registrata.", location: "Città o codice postale", maps: "Cerca sulla mappa", trend: { insufficient_data: "La tendenza apparirà dopo altre registrazioni.", improving: "Le registrazioni recenti mostrano un segnale più basso.", stable: "Il segnale è finora abbastanza stabile.", increasing: "Le registrazioni recenti mostrano un segnale più alto." }, contexts: ["Mattina", "Apprendimento", "Sociale", "Transizione", "Sera", "Altro"], levels: ["Assente", "Lieve", "Moderata", "Forte"], strategyShort: "Supporto usato" },
    es: { title: "Diario de observación de 14 días", progress: "Progreso", today: "Observación de hoy", entry: "Añadir observación", date: "Fecha", context: "Situación", signal: "¿Qué intensidad tuvo la dificultad?", strategy: "Se utilizó una estrategia de apoyo planificada", note: "Nota breve y objetiva (opcional)", save: "Guardar observación", saving: "Guardando...", saved: "Observación guardada.", history: "Días registrados", empty: "Aún no hay observaciones.", location: "Ciudad o código postal", maps: "Buscar en mapas", trend: { insufficient_data: "La tendencia aparecerá tras algunas entradas más.", improving: "Las entradas recientes muestran una señal menor.", stable: "La señal se mantiene bastante estable.", increasing: "Las entradas recientes muestran una señal mayor." }, contexts: ["Mañana", "Aprendizaje", "Social", "Transición", "Tarde", "Otro"], levels: ["No apareció", "Leve", "Moderada", "Fuerte"], strategyShort: "Apoyo utilizado" },
    fr: { title: "Journal d'observation sur 14 jours", progress: "Progression", today: "Observation du jour", entry: "Ajouter une observation", date: "Date", context: "Situation", signal: "Quelle était l'intensité de la difficulté ?", strategy: "Une stratégie de soutien prévue a été utilisée", note: "Note courte et factuelle (facultatif)", save: "Enregistrer", saving: "Enregistrement...", saved: "Observation enregistrée.", history: "Jours enregistrés", empty: "Aucune observation enregistrée.", location: "Ville ou code postal", maps: "Rechercher sur la carte", trend: { insufficient_data: "Une tendance apparaîtra après quelques entrées supplémentaires.", improving: "Les entrées récentes montrent un signal plus faible.", stable: "Le signal reste globalement stable.", increasing: "Les entrées récentes montrent un signal plus élevé." }, contexts: ["Matin", "Apprentissage", "Social", "Transition", "Soir", "Autre"], levels: ["Absent", "Faible", "Modéré", "Fort"], strategyShort: "Soutien utilisé" },
    pt: { title: "Diário de observação de 14 dias", progress: "Progresso", today: "Observação de hoje", entry: "Adicionar observação", date: "Data", context: "Situação", signal: "Qual foi a intensidade da dificuldade?", strategy: "Foi usada uma estratégia planejada", note: "Nota curta e factual (opcional)", save: "Salvar observação", saving: "Salvando...", saved: "Observação salva.", history: "Dias registrados", empty: "Ainda não há observações.", location: "Cidade ou código postal", maps: "Buscar no mapa", trend: { insufficient_data: "Uma tendência aparecerá após mais algumas entradas.", improving: "As entradas recentes mostram um sinal menor.", stable: "O sinal está relativamente estável.", increasing: "As entradas recentes mostram um sinal maior." }, contexts: ["Manhã", "Aprendizagem", "Social", "Transição", "Noite", "Outro"], levels: ["Não apareceu", "Leve", "Moderada", "Forte"], strategyShort: "Apoio usado" },
    pl: { title: "14-dniowy dziennik obserwacji", progress: "Postęp", today: "Dzisiejsza obserwacja", entry: "Dodaj obserwację", date: "Data", context: "Sytuacja", signal: "Jak silna była trudność?", strategy: "Zastosowano zaplanowaną strategię wsparcia", note: "Krótka rzeczowa notatka (opcjonalnie)", save: "Zapisz obserwację", saving: "Zapisywanie...", saved: "Obserwacja zapisana.", history: "Zapisane dni", empty: "Nie zapisano jeszcze obserwacji.", location: "Miejscowość lub kod pocztowy", maps: "Szukaj na mapie", trend: { insufficient_data: "Trend pojawi się po kilku kolejnych wpisach.", improving: "Ostatnie wpisy pokazują niższy poziom sygnału.", stable: "Poziom sygnału jest na razie stabilny.", increasing: "Ostatnie wpisy pokazują wyższy poziom sygnału." }, contexts: ["Rano", "Nauka", "Społeczna", "Zmiana", "Wieczór", "Inne"], levels: ["Brak", "Łagodna", "Umiarkowana", "Silna"], strategyShort: "Użyto wsparcia" },
    ja: { title: "14日間の観察日誌", progress: "進捗", today: "今日の観察", entry: "観察を追加", date: "日付", context: "場面", signal: "困難さはどの程度でしたか？", strategy: "予定していた支援方法を使った", note: "短く客観的なメモ（任意）", save: "観察を保存", saving: "保存中...", saved: "観察を保存しました。", history: "記録した日", empty: "観察記録はまだありません。", location: "市区町村または郵便番号", maps: "地図で検索", trend: { insufficient_data: "もう少し記録すると傾向が表示されます。", improving: "最近の記録ではシグナルが低くなっています。", stable: "シグナルはおおむね安定しています。", increasing: "最近の記録ではシグナルが高くなっています。" }, contexts: ["朝", "学習", "対人場面", "切り替え", "夕方", "その他"], levels: ["なし", "軽い", "中程度", "強い"], strategyShort: "支援を使用" },
    zh: { title: "14天观察日记", progress: "进度", today: "今日观察", entry: "添加观察", date: "日期", context: "情境", signal: "困难程度如何？", strategy: "使用了预先计划的支持策略", note: "简短客观备注（可选）", save: "保存观察", saving: "正在保存...", saved: "观察已保存。", history: "已记录天数", empty: "尚无观察记录。", location: "城市或邮政编码", maps: "在地图中搜索", trend: { insufficient_data: "再记录几次后将显示趋势。", improving: "近期记录显示信号水平降低。", stable: "目前信号水平大致稳定。", increasing: "近期记录显示信号水平升高。" }, contexts: ["早晨", "学习", "社交", "转换", "晚上", "其他"], levels: ["未出现", "轻度", "中度", "强烈"], strategyShort: "使用了支持" },
    ar: { title: "سجل ملاحظات لمدة 14 يوماً", progress: "التقدم", today: "ملاحظة اليوم", entry: "إضافة ملاحظة", date: "التاريخ", context: "الموقف", signal: "ما شدة الصعوبة؟", strategy: "تم استخدام استراتيجية دعم مخططة", note: "ملاحظة قصيرة وواقعية (اختياري)", save: "حفظ الملاحظة", saving: "جارٍ الحفظ...", saved: "تم حفظ الملاحظة.", history: "الأيام المسجلة", empty: "لا توجد ملاحظات مسجلة بعد.", location: "المدينة أو الرمز البريدي", maps: "البحث على الخريطة", trend: { insufficient_data: "سيظهر الاتجاه بعد إضافة عدة ملاحظات أخرى.", improving: "تظهر الملاحظات الحديثة مستوى إشارة أقل.", stable: "مستوى الإشارة مستقر تقريباً حتى الآن.", increasing: "تظهر الملاحظات الحديثة مستوى إشارة أعلى." }, contexts: ["الصباح", "التعلم", "اجتماعي", "الانتقال", "المساء", "أخرى"], levels: ["لم تظهر", "خفيفة", "متوسطة", "قوية"], strategyShort: "تم استخدام دعم" }
  };

  const contextKeys = ["morning", "learning", "social", "transition", "evening", "other"];

  function text(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value || "";
  }

  function dateKey(value) {
    return String(value || "").slice(0, 10);
  }

  function localeDate(value, lang) {
    const date = new Date(`${dateKey(value)}T12:00:00Z`);
    return Number.isNaN(date.getTime()) ? dateKey(value) : new Intl.DateTimeFormat(lang, { dateStyle: "medium", timeZone: "UTC" }).format(date);
  }

  function renderStatic() {
    const lang = program.lang in UI ? program.lang : "en";
    const ui = UI[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.title = `${ui.title} | NeuroMap Kids`;
    text("pageTitle", ui.title);
    text("pageIntro", program.content.diaryIntro);
    text("disclosure", program.content.disclosure);
    text("progressTitle", ui.progress);
    text("todayLabel", ui.today);
    text("entryTitle", ui.entry);
    text("dateLabel", ui.date);
    text("contextLabel", ui.context);
    text("signalLabel", ui.signal);
    text("strategyLabel", ui.strategy);
    text("noteLabel", ui.note);
    text("saveButton", ui.save);
    text("historyTitle", ui.history);
    text("nearbyTitle", program.content.nearbyTitle);
    text("nearbyDisclaimer", program.content.nearbyDisclaimer);
    text("nearbyButton", ui.maps);
    document.getElementById("locationInput").placeholder = ui.location;

    const contextSelect = document.getElementById("context");
    contextSelect.replaceChildren();
    contextKeys.forEach((key, index) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = ui.contexts[index];
      contextSelect.appendChild(option);
    });

    const signalOptions = document.getElementById("signalOptions");
    signalOptions.replaceChildren();
    ui.levels.forEach((label, index) => {
      const wrapper = document.createElement("label");
      const input = document.createElement("input");
      const span = document.createElement("span");
      input.type = "radio";
      input.name = "signalLevel";
      input.value = String(index);
      input.required = true;
      span.textContent = label;
      wrapper.append(input, span);
      signalOptions.appendChild(wrapper);
    });

    const today = new Date().toISOString().slice(0, 10);
    const dateInput = document.getElementById("entryDate");
    dateInput.value = today;
    dateInput.min = dateKey(program.startsAt);
    dateInput.max = today < dateKey(program.endsAt) ? today : dateKey(program.endsAt);
    text("todayDate", localeDate(today, lang));
  }

  function renderTrend(trend) {
    const ui = UI[program.lang] || UI.en;
    const count = Number(trend?.completedDays || 0);
    text("progressValue", `${count} / 14`);
    text("historyCount", String(count));
    document.getElementById("progressBar").style.width = `${Math.min(100, (count / 14) * 100)}%`;
    text("trendSummary", ui.trend[trend?.direction] || ui.trend.insufficient_data);
  }

  function renderEntries(entries) {
    const ui = UI[program.lang] || UI.en;
    const list = document.getElementById("entryList");
    list.replaceChildren();

    if (!entries.length) {
      const empty = document.createElement("p");
      empty.className = "nm-empty";
      empty.textContent = ui.empty;
      list.appendChild(empty);
      return;
    }

    [...entries].reverse().forEach((entry) => {
      const row = document.createElement("article");
      const date = document.createElement("strong");
      const detail = document.createElement("div");
      const context = document.createElement("strong");
      const note = document.createElement("p");
      const level = document.createElement("span");
      const contextIndex = Math.max(0, contextKeys.indexOf(entry.context));
      date.textContent = localeDate(entry.entry_date, program.lang);
      context.textContent = ui.contexts[contextIndex];
      note.textContent = [entry.note, entry.strategy_used ? ui.strategyShort : ""].filter(Boolean).join(" · ");
      level.className = "nm-level";
      level.textContent = ui.levels[Number(entry.signal_level)] || "";
      detail.append(context, note);
      row.className = "nm-entry";
      row.append(date, detail, level);
      list.appendChild(row);
    });
  }

  async function load() {
    const response = await fetch(apiUrl, { headers: { Accept: "application/json" }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Unable to load diary.");
    program = data.program;
    renderStatic();
    renderTrend(program.trend);
    renderEntries(program.entries || []);
  }

  document.getElementById("entryForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!program) return;
    const ui = UI[program.lang] || UI.en;
    const form = event.currentTarget;
    const button = document.getElementById("saveButton");
    const selectedLevel = form.querySelector("input[name='signalLevel']:checked");
    if (!form.reportValidity() || !selectedLevel) return;

    button.disabled = true;
    text("formStatus", ui.saving);
    try {
      const response = await fetch(`${apiUrl}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          entryDate: document.getElementById("entryDate").value,
          context: document.getElementById("context").value,
          signalLevel: Number(selectedLevel.value),
          strategyUsed: document.getElementById("strategyUsed").checked,
          note: document.getElementById("note").value
        })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Save failed.");
      text("formStatus", ui.saved);
      await load();
    } catch (error) {
      text("formStatus", error.message || "Save failed.");
    } finally {
      button.disabled = false;
    }
  });

  document.getElementById("nearbyForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const location = document.getElementById("locationInput").value.trim();
    if (!location) return document.getElementById("locationInput").focus();
    const focus = program?.focusDomain ? `${program.focusDomain} ` : "";
    const query = encodeURIComponent(`${focus}child psychologist ${location}`);
    window.open(`https://www.google.com/maps/search/${query}`, "_blank", "noopener,noreferrer");
  });

  load().catch((error) => {
    text("pageTitle", "NeuroMap Kids Plus");
    text("pageIntro", error.message || "Unable to load diary.");
    document.querySelectorAll(".nm-progress, .nm-tool, .nm-history, .nm-search").forEach((element) => {
      element.hidden = true;
    });
  });
})();
