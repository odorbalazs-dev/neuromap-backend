import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { buildReportV2Context } from "./report-v2.service.js";

const BRAND = {
  blue: "#1197D5",
  orange: "#FF7A00",
  green: "#72BE00",
  yellow: "#FFC928",
  pink: "#FF5CA8",
  lightBlue: "#F1FAFF",
  lightOrange: "#FFF4E8",
  lightGreen: "#F4FFF0",
  lightGray: "#F7F8FC",
  dark: "#1F2937",
  muted: "#667085",
  border: "#E5E7EB",
  softBorder: "#D7EEF9"
};

const SECTION_COLORS = [
  BRAND.blue,
  BRAND.orange,
  BRAND.green,
  BRAND.pink,
  BRAND.yellow
];

const FONT_DIR = path.join(process.cwd(), "src/assets/fonts");

const FONT_PATHS = {
  regular: path.join(FONT_DIR, "NotoSans-Regular.ttf"),
  bold: path.join(FONT_DIR, "NotoSans-Bold.ttf"),

  jaRegular: path.join(FONT_DIR, "NotoSansJP-Regular.ttf"),
  jaBold: path.join(FONT_DIR, "NotoSansJP-Bold.ttf"),

  zhRegular: path.join(FONT_DIR, "NotoSansSC-Regular.ttf"),
  zhBold: path.join(FONT_DIR, "NotoSansSC-Bold.ttf"),

  arRegular: path.join(FONT_DIR, "NotoNaskhArabic-Regular.ttf"),
  arBold: path.join(FONT_DIR, "NotoNaskhArabic-Bold.ttf")
};

function clean(value = "") {
  return String(value || "").trim();
}

function stripMarkdown(value = "") {
  return clean(value)
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*/g, "")
    .replace(/^>\s?/gm, "")
    .replace(/^---+$/gm, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function ensureFontFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing PDF font file: ${label} at ${filePath}`);
  }
}

function registerFonts(doc) {
  Object.entries(FONT_PATHS).forEach(([label, filePath]) => {
    ensureFontFile(filePath, label);
  });

  doc.registerFont("Regular", FONT_PATHS.regular);
  doc.registerFont("Bold", FONT_PATHS.bold);
  doc.registerFont("JA-Regular", FONT_PATHS.jaRegular);
  doc.registerFont("JA-Bold", FONT_PATHS.jaBold);
  doc.registerFont("ZH-Regular", FONT_PATHS.zhRegular);
  doc.registerFont("ZH-Bold", FONT_PATHS.zhBold);
  doc.registerFont("AR-Regular", FONT_PATHS.arRegular);
  doc.registerFont("AR-Bold", FONT_PATHS.arBold);
}

function getFont(lang = "en", bold = false) {
  if (lang === "ja") return bold ? "JA-Bold" : "JA-Regular";
  if (lang === "zh") return bold ? "ZH-Bold" : "ZH-Regular";
  if (lang === "ar") return bold ? "AR-Bold" : "AR-Regular";
  return bold ? "Bold" : "Regular";
}

function isRtl(lang) {
  return lang === "ar";
}

function getTextAlign(lang) {
  return isRtl(lang) ? "right" : "left";
}

function getLabels(lang = "en") {
  const labels = {
    hu: {
      title: "NeuroMap Kids riport",
      subtitle: "Strukturált, szülőbarát előszűrési összefoglaló",
      greeting: "Kedves",
      parentFallback: "Szülő",
      reportTitle: "Részletes értelmezés",
      summaryLabel: "Előzetes kérdőíves riport",
      overviewTitle: "Gyors áttekintés",
      focusArea: "Fő fókuszterület",
      secondarySignal: "Másodlagos jelzés",
      signalLevel: "Jelzésszint",
      topAreas: "Legerősebb területek",
      notAvailable: "Nem elérhető",
      disclaimerTitle: "Fontos megjegyzés",
      disclaimer:
        "Ez az anyag nem minősül diagnózisnak, és nem helyettesíti a személyes szakértői vizsgálatot. A teljes értékeléshez szakemberrel történő konzultáció, fejlődéstörténet és tágabb kontextus szükséges.",
      footer: "NeuroMap Kids · Screening report"
    },
    en: {
      title: "NeuroMap Kids Report",
      subtitle: "Structured, parent-friendly screening summary",
      greeting: "Dear",
      parentFallback: "Parent",
      reportTitle: "Detailed interpretation",
      summaryLabel: "Preliminary questionnaire report",
      overviewTitle: "Quick overview",
      focusArea: "Main focus area",
      secondarySignal: "Secondary signal",
      signalLevel: "Signal level",
      topAreas: "Strongest areas",
      notAvailable: "Not available",
      disclaimerTitle: "Important note",
      disclaimer:
        "This material is not a diagnosis and does not replace an in-person specialist assessment. A full evaluation requires a qualified professional, developmental history, and broader context.",
      footer: "NeuroMap Kids · Screening report"
    },
    de: {
      title: "NeuroMap Kids Bericht",
      subtitle: "Strukturierte, elternfreundliche Screening-Zusammenfassung",
      greeting: "Hallo",
      parentFallback: "Elternteil",
      reportTitle: "Detaillierte Interpretation",
      summaryLabel: "Vorläufiger Fragebogenbericht",
      overviewTitle: "Kurzer Überblick",
      focusArea: "Hauptfokus",
      secondarySignal: "Sekundäres Signal",
      signalLevel: "Signalstärke",
      topAreas: "Stärkste Bereiche",
      notAvailable: "Nicht verfügbar",
      disclaimerTitle: "Wichtiger Hinweis",
      disclaimer:
        "Dieses Material ist keine Diagnose und ersetzt keine persönliche fachliche Untersuchung. Für eine vollständige Bewertung sind eine qualifizierte Fachperson, die Entwicklungsgeschichte und ein breiterer Kontext erforderlich.",
      footer: "NeuroMap Kids · Screening report"
    },
    it: {
      title: "Report NeuroMap Kids",
      subtitle: "Sintesi di screening strutturata e adatta ai genitori",
      greeting: "Gentile",
      parentFallback: "Genitore",
      reportTitle: "Interpretazione dettagliata",
      summaryLabel: "Report preliminare del questionario",
      overviewTitle: "Panoramica rapida",
      focusArea: "Area principale",
      secondarySignal: "Segnale secondario",
      signalLevel: "Livello del segnale",
      topAreas: "Aree più rilevanti",
      notAvailable: "Non disponibile",
      disclaimerTitle: "Nota importante",
      disclaimer:
        "Questo materiale non è una diagnosi e non sostituisce una valutazione di persona da parte di un professionista qualificato. Una valutazione completa richiede una consulenza specialistica, la storia dello sviluppo e un contesto più ampio.",
      footer: "NeuroMap Kids · Screening report"
    },
    es: {
      title: "Informe NeuroMap Kids",
      subtitle: "Resumen de cribado estructurado y fácil de entender para padres",
      greeting: "Estimado/a",
      parentFallback: "Padre/madre",
      reportTitle: "Interpretación detallada",
      summaryLabel: "Informe preliminar del cuestionario",
      overviewTitle: "Resumen rápido",
      focusArea: "Área principal",
      secondarySignal: "Señal secundaria",
      signalLevel: "Nivel de señal",
      topAreas: "Áreas más destacadas",
      notAvailable: "No disponible",
      disclaimerTitle: "Nota importante",
      disclaimer:
        "Este material no es un diagnóstico y no sustituye una evaluación presencial por parte de un profesional cualificado. Una evaluación completa requiere consulta profesional, historia del desarrollo y un contexto más amplio.",
      footer: "NeuroMap Kids · Screening report"
    },
    fr: {
      title: "Rapport NeuroMap Kids",
      subtitle: "Résumé de dépistage structuré et accessible aux parents",
      greeting: "Bonjour",
      parentFallback: "Parent",
      reportTitle: "Interprétation détaillée",
      summaryLabel: "Rapport préliminaire du questionnaire",
      overviewTitle: "Aperçu rapide",
      focusArea: "Domaine principal",
      secondarySignal: "Signal secondaire",
      signalLevel: "Niveau du signal",
      topAreas: "Domaines les plus marqués",
      notAvailable: "Non disponible",
      disclaimerTitle: "Note importante",
      disclaimer:
        "Ce document n’est pas un diagnostic et ne remplace pas une évaluation en personne par un professionnel qualifié. Une évaluation complète nécessite une consultation spécialisée, l’histoire du développement et un contexte plus large.",
      footer: "NeuroMap Kids · Screening report"
    },
    pt: {
      title: "Relatório NeuroMap Kids",
      subtitle: "Resumo de triagem estruturado e amigável para pais",
      greeting: "Olá",
      parentFallback: "Responsável",
      reportTitle: "Interpretação detalhada",
      summaryLabel: "Relatório preliminar do questionário",
      overviewTitle: "Visão rápida",
      focusArea: "Área principal",
      secondarySignal: "Sinal secundário",
      signalLevel: "Nível do sinal",
      topAreas: "Áreas mais fortes",
      notAvailable: "Não disponível",
      disclaimerTitle: "Nota importante",
      disclaimer:
        "Este material não é um diagnóstico e não substitui uma avaliação presencial por um profissional qualificado. Uma avaliação completa requer consulta profissional, histórico de desenvolvimento e contexto mais amplo.",
      footer: "NeuroMap Kids · Screening report"
    },
    pl: {
      title: "Raport NeuroMap Kids",
      subtitle: "Ustrukturyzowane, przyjazne dla rodziców podsumowanie przesiewowe",
      greeting: "Dzień dobry",
      parentFallback: "Rodzic",
      reportTitle: "Szczegółowa interpretacja",
      summaryLabel: "Wstępny raport z kwestionariusza",
      overviewTitle: "Krótki przegląd",
      focusArea: "Główny obszar",
      secondarySignal: "Sygnał dodatkowy",
      signalLevel: "Poziom sygnału",
      topAreas: "Najsilniejsze obszary",
      notAvailable: "Brak danych",
      disclaimerTitle: "Ważna informacja",
      disclaimer:
        "Ten materiał nie jest diagnozą i nie zastępuje osobistej oceny przez wykwalifikowanego specjalistę. Pełna ocena wymaga konsultacji specjalistycznej, historii rozwoju i szerszego kontekstu.",
      footer: "NeuroMap Kids · Screening report"
    },
    zh: {
      title: "NeuroMap Kids 报告",
      subtitle: "结构化、家长友好的筛查摘要",
      greeting: "您好",
      parentFallback: "家长",
      reportTitle: "详细解读",
      summaryLabel: "初步问卷报告",
      overviewTitle: "快速概览",
      focusArea: "主要关注领域",
      secondarySignal: "次要信号",
      signalLevel: "信号水平",
      topAreas: "最突出的领域",
      notAvailable: "暂无数据",
      disclaimerTitle: "重要说明",
      disclaimer:
        "本材料不是诊断，也不能替代合格专业人员的面对面评估。完整评估需要专业咨询、发展史以及更广泛的背景信息。",
      footer: "NeuroMap Kids · Screening report"
    },
    ja: {
      title: "NeuroMap Kids レポート",
      subtitle: "保護者向けの構造化されたスクリーニング概要",
      greeting: "こんにちは",
      parentFallback: "保護者",
      reportTitle: "詳細な解釈",
      summaryLabel: "予備的な質問票レポート",
      overviewTitle: "概要",
      focusArea: "主な注目領域",
      secondarySignal: "二次的なサイン",
      signalLevel: "サインの強さ",
      topAreas: "最も強く示された領域",
      notAvailable: "利用不可",
      disclaimerTitle: "重要なお知らせ",
      disclaimer:
        "この資料は診断ではなく、資格を持つ専門家による対面評価の代わりにはなりません。完全な評価には、専門家による相談、発達歴、より広い背景情報が必要です。",
      footer: "NeuroMap Kids · Screening report"
    },
    ar: {
      title: "تقرير NeuroMap Kids",
      subtitle: "ملخص فحص أولي منظم ومناسب للوالدين",
      greeting: "مرحبًا",
      parentFallback: "ولي الأمر",
      reportTitle: "تفسير تفصيلي",
      summaryLabel: "تقرير أولي للاستبيان",
      overviewTitle: "نظرة سريعة",
      focusArea: "المجال الرئيسي",
      secondarySignal: "إشارة ثانوية",
      signalLevel: "مستوى الإشارة",
      topAreas: "أبرز المجالات",
      notAvailable: "غير متاح",
      disclaimerTitle: "ملاحظة مهمة",
      disclaimer:
        "هذه المادة ليست تشخيصًا ولا تحل محل التقييم الشخصي من قبل مختص مؤهل. يتطلب التقييم الكامل استشارة مختص، وتاريخًا نمائيًا، وسياقًا أوسع.",
      footer: "NeuroMap Kids · Screening report"
    }
  };

  return labels[lang] || labels.en;
}

function extractSummary(payload = {}) {
  const profile = payload?.specificProfile || {};
  const scoring = payload?.specificScoring || {};
  const resultSummary = payload?.resultSummary || {};

  const detectedRisk =
    payload?.detectedRisk ||
    profile?.kind ||
    resultSummary?.kind ||
    null;

  const secondaryRisk =
    payload?.secondaryRisk ||
    resultSummary?.secondaryRisk ||
    null;

  const severity =
    profile?.severity ||
    resultSummary?.signal?.key ||
    null;

  const normalizedAverage =
    typeof profile?.normalizedAverage === "number"
      ? profile.normalizedAverage
      : typeof scoring?.normalizedAverage === "number"
      ? scoring.normalizedAverage
      : null;

  const subdomains = Object.entries(scoring?.subdomains || profile?.subdomains || {})
    .map(([key, value]) => ({
      key,
      average: typeof value?.average === "number" ? value.average : 0,
      itemCount: Number(value?.itemCount || 0)
    }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 5);

  return {
    detectedRisk,
    secondaryRisk,
    severity,
    normalizedAverage,
    subdomains
  };
}

function formatKeyLabel(key, labels) {
  const value = clean(key);
  if (!value) return labels.notAvailable;

  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getDomainLabel(lang, domain, labels) {
  const value = clean(domain).toUpperCase();
  if (!value) return labels.notAvailable;

  const names = {
    hu: {
      ADHD: "ADHD",
      ASD: "Autizmus spektrum",
      ANXIETY: "Szorongás",
      DEPRESSION: "Hangulati terület",
      LEARNING: "Tanulási terület"
    },
    en: {
      ADHD: "ADHD",
      ASD: "Autism spectrum",
      ANXIETY: "Anxiety",
      DEPRESSION: "Mood and motivation",
      LEARNING: "Learning profile"
    }
  };

  return names[lang]?.[value] || names.en[value] || formatKeyLabel(value, labels);
}

function getSeverityLabel(lang, severity, labels) {
  const value = clean(severity).toLowerCase();
  if (!value) return labels.notAvailable;

  const names = {
    hu: {
      low: "Alacsony jelzésszint",
      mild: "Enyhe jelzésszint",
      moderate: "Közepes jelzésszint",
      high: "Magas jelzésszint"
    },
    en: {
      low: "Low signal level",
      mild: "Mild signal level",
      moderate: "Moderate signal level",
      high: "High signal level"
    }
  };

  return names[lang]?.[value] || names.en[value] || formatKeyLabel(value, labels);
}

function formatScore(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : "0.00";
}

function getSectionColor(sectionNumber = 1) {
  const index = Math.max(0, Number(sectionNumber || 1) - 1);
  return SECTION_COLORS[index % SECTION_COLORS.length];
}

function addLogoLikeMark(doc, x, y) {
  const safeX = Number.isFinite(Number(x)) ? Number(x) : 72;
  const safeY = Number.isFinite(Number(y)) ? Number(y) : 52;

  doc.circle(safeX, safeY, 16).fill(BRAND.blue);
  doc.circle(safeX + 28, safeY, 16).fill(BRAND.orange);
  doc.circle(safeX + 14, safeY + 18, 8).fill(BRAND.green);

  doc.strokeColor("#FFFFFF").lineWidth(2.2)
    .moveTo(safeX, safeY)
    .lineTo(safeX + 28, safeY)
    .lineTo(safeX + 14, safeY + 18)
    .lineTo(safeX, safeY)
    .stroke();

  doc.circle(safeX, safeY, 7).fill("#FFFFFF");
  doc.circle(safeX, safeY, 4).fill(BRAND.yellow);
  doc.circle(safeX + 28, safeY, 7).fill("#FFFFFF");
  doc.circle(safeX + 28, safeY, 4).fill(BRAND.green);
  doc.circle(safeX + 14, safeY + 18, 7).fill("#FFFFFF");
  doc.circle(safeX + 14, safeY + 18, 4).fill(BRAND.pink);
}

function addHeader(doc, labels, lang) {
  doc.rect(0, 0, doc.page.width, 116).fill(BRAND.lightBlue);
  doc.rect(0, 0, doc.page.width, 8).fill(BRAND.blue);
  doc.rect(0, 8, doc.page.width * 0.45, 5).fill(BRAND.orange);
  doc.rect(doc.page.width * 0.45, 8, doc.page.width * 0.22, 5).fill(BRAND.green);
  doc.rect(doc.page.width * 0.67, 8, doc.page.width * 0.33, 5).fill(BRAND.yellow);

  addLogoLikeMark(doc, 72, 55);

  doc.fillColor(BRAND.dark)
    .font(getFont(lang, true))
    .fontSize(lang === "zh" || lang === "ja" ? 20 : 23)
    .text(labels.title, 118, 34, {
      width: doc.page.width - 174,
      align: getTextAlign(lang)
    });

  doc.fillColor(BRAND.muted)
    .font(getFont(lang))
    .fontSize(10.5)
    .text(labels.subtitle, 118, 66, {
      width: doc.page.width - 174,
      align: getTextAlign(lang)
    });
}

function addFooter(doc, labels, lang, pageNumber = null) {
  const y = doc.page.height - 78;
  const footerTextWidth = pageNumber ? doc.page.width - 220 : doc.page.width - 150;

  doc.moveTo(56, y - 10)
    .lineTo(doc.page.width - 56, y - 10)
    .strokeColor(BRAND.border)
    .lineWidth(1)
    .stroke();

  doc.circle(58, y + 3, 3).fill(BRAND.blue);
  doc.circle(69, y + 3, 3).fill(BRAND.orange);
  doc.circle(80, y + 3, 3).fill(BRAND.green);

  doc.fillColor("#8A8F9C")
    .font(getFont(lang))
    .fontSize(8.5)
    .text(labels.footer, 94, y - 2, {
      align: getTextAlign(lang),
      width: footerTextWidth
    });

  if (pageNumber) {
    doc.roundedRect(doc.page.width - 94, y - 8, 38, 20, 10)
      .fill("#F8FAFC");
    doc.roundedRect(doc.page.width - 94, y - 8, 38, 20, 10)
      .strokeColor(BRAND.softBorder)
      .lineWidth(1)
      .stroke();

    doc.fillColor(BRAND.muted)
      .font(getFont(lang, true))
      .fontSize(8.5)
      .text(String(pageNumber), doc.page.width - 94, y - 3, {
        width: 38,
        align: "center"
      });
  }
}

function addCoverPage(doc, { name, payload, labels, lang }) {
  const safeName = clean(name) || labels.parentFallback;
  const summary = extractSummary(payload || {});
  const x = 56;
  const w = doc.page.width - 112;

  doc.rect(0, 0, doc.page.width, doc.page.height).fill("#FFFFFF");
  doc.rect(0, 0, doc.page.width, 16).fill(BRAND.blue);
  doc.rect(0, 16, doc.page.width * 0.42, 7).fill(BRAND.orange);
  doc.rect(doc.page.width * 0.42, 16, doc.page.width * 0.22, 7).fill(BRAND.green);
  doc.rect(doc.page.width * 0.64, 16, doc.page.width * 0.36, 7).fill(BRAND.yellow);

  doc.circle(doc.page.width - 70, 118, 58).fill(BRAND.lightBlue);
  doc.circle(doc.page.width - 42, 104, 24).fill(BRAND.lightOrange);
  doc.circle(doc.page.width - 98, 154, 18).fill(BRAND.lightGreen);

  addLogoLikeMark(doc, x + 20, 106);

  doc.fillColor(BRAND.dark)
    .font(getFont(lang, true))
    .fontSize(lang === "zh" || lang === "ja" ? 28 : 31)
    .text(labels.title, x, 178, {
      width: w,
      align: getTextAlign(lang),
      lineGap: 4
    });

  doc.fillColor(BRAND.muted)
    .font(getFont(lang))
    .fontSize(13)
    .text(labels.subtitle, x, 222, {
      width: w,
      align: getTextAlign(lang),
      lineGap: 4
    });

  const cardY = 292;
  const cardH = 178;
  doc.roundedRect(x, cardY, w, cardH, 18).fill(BRAND.lightBlue);
  doc.roundedRect(x, cardY, w, cardH, 18).strokeColor(BRAND.softBorder).lineWidth(1).stroke();
  doc.rect(x, cardY, 8, cardH).fill(BRAND.orange);

  doc.fillColor(BRAND.dark)
    .font(getFont(lang, true))
    .fontSize(17)
    .text(`${labels.greeting} ${safeName}!`, x + 28, cardY + 26, {
      width: w - 56,
      align: getTextAlign(lang)
    });

  doc.fillColor(BRAND.muted)
    .font(getFont(lang))
    .fontSize(10.5)
    .text(labels.summaryLabel, x + 28, cardY + 58, {
      width: w - 56,
      align: getTextAlign(lang),
      lineGap: 3
    });

  const miniY = cardY + 98;
  const gap = 10;
  const miniW = (w - 56 - gap * 2) / 3;

  addMiniCard(
    doc,
    x + 28,
    miniY,
    miniW,
    labels.focusArea,
    getDomainLabel(lang, summary.detectedRisk, labels),
    lang,
    BRAND.blue
  );

  addMiniCard(
    doc,
    x + 28 + miniW + gap,
    miniY,
    miniW,
    labels.secondarySignal,
    getDomainLabel(lang, summary.secondaryRisk, labels),
    lang,
    BRAND.orange
  );

  addMiniCard(
    doc,
    x + 28 + (miniW + gap) * 2,
    miniY,
    miniW,
    labels.signalLevel,
    getSeverityLabel(lang, summary.severity, labels),
    lang,
    BRAND.green
  );

  const noteY = 520;
  doc.roundedRect(x, noteY, w, 118, 16).fill(BRAND.lightOrange);
  doc.roundedRect(x, noteY, w, 118, 16).strokeColor("#FFD2A6").lineWidth(1).stroke();

  doc.circle(x + 22, noteY + 26, 7).fill(BRAND.orange);
  doc.fillColor("#9A3412")
    .font(getFont(lang, true))
    .fontSize(12)
    .text(labels.disclaimerTitle, x + 42, noteY + 18, {
      width: w - 62,
      align: getTextAlign(lang)
    });

  doc.fillColor("#7C2D12")
    .font(getFont(lang))
    .fontSize(9.8)
    .text(labels.disclaimer, x + 22, noteY + 48, {
      width: w - 44,
      lineGap: 3,
      align: getTextAlign(lang)
    });
}

function ensureSpace(doc, neededHeight, labels, lang, pageState = null) {
  if (doc.y + neededHeight > doc.page.height - 74) {
    addFooter(doc, labels, lang, pageState?.current || null);
    doc.addPage();
    if (pageState) pageState.current += 1;
    addHeader(doc, labels, lang);
    doc.y = 138;
  }
}

function addInfoCard(doc, { name, lang }) {
  const labels = getLabels(lang);
  const safeName = clean(name) || labels.parentFallback;

  const x = 56;
  const y = 138;
  const w = doc.page.width - 112;
  const h = 88;

  doc.roundedRect(x, y, w, h, 16).fill("#FFFFFF");
  doc.roundedRect(x, y, w, h, 16).strokeColor(BRAND.softBorder).lineWidth(1).stroke();
  doc.rect(x, y, 8, h).fill(BRAND.orange);

  doc.fillColor(BRAND.dark)
    .font(getFont(lang, true))
    .fontSize(14)
    .text(`${labels.greeting} ${safeName}!`, x + 22, y + 20, {
      width: w - 44,
      align: getTextAlign(lang)
    });

  doc.fillColor(BRAND.muted)
    .font(getFont(lang))
    .fontSize(10)
    .text(labels.summaryLabel, x + 22, y + 48, {
      width: w - 44,
      align: getTextAlign(lang)
    });
}

function addMiniCard(doc, x, y, w, title, value, lang, color = BRAND.blue) {
  const h = 72;

  doc.roundedRect(x, y, w, h, 14).fill("#FFFFFF");
  doc.roundedRect(x, y, w, h, 14).strokeColor(BRAND.border).lineWidth(1).stroke();
  doc.rect(x, y, 6, h).fill(color);

  doc.fillColor(BRAND.muted)
    .font(getFont(lang))
    .fontSize(8.5)
    .text(title, x + 16, y + 14, {
      width: w - 28,
      align: getTextAlign(lang)
    });

  doc.fillColor(BRAND.dark)
    .font(getFont(lang, true))
    .fontSize(12)
    .text(value || "—", x + 16, y + 36, {
      width: w - 28,
      align: getTextAlign(lang)
    });
}

function addOverviewBlock(doc, payload, labels, lang, pageState = null) {
  const summary = extractSummary(payload || {});
  const x = 56;
  const w = doc.page.width - 112;

  ensureSpace(doc, 190, labels, lang, pageState);

  doc.moveDown(1);

  doc.fillColor(BRAND.dark)
    .font(getFont(lang, true))
    .fontSize(15)
    .text(labels.overviewTitle, x, doc.y, {
      width: w,
      align: getTextAlign(lang)
    });

  doc.moveDown(0.6);

  const cardY = doc.y;
  const gap = 10;
  const cardW = (w - gap * 2) / 3;

  addMiniCard(
    doc,
    x,
    cardY,
    cardW,
    labels.focusArea,
    getDomainLabel(lang, summary.detectedRisk, labels),
    lang,
    BRAND.blue
  );

  addMiniCard(
    doc,
    x + cardW + gap,
    cardY,
    cardW,
    labels.secondarySignal,
    getDomainLabel(lang, summary.secondaryRisk, labels),
    lang,
    BRAND.orange
  );

  addMiniCard(
    doc,
    x + (cardW + gap) * 2,
    cardY,
    cardW,
    labels.signalLevel,
    getSeverityLabel(lang, summary.severity, labels),
    lang,
    BRAND.green
  );

  doc.y = cardY + 92;

  if (summary.subdomains.length) {
    doc.fillColor(BRAND.dark)
      .font(getFont(lang, true))
      .fontSize(12)
      .text(labels.topAreas, x, doc.y, {
        width: w,
        align: getTextAlign(lang)
      });

    doc.moveDown(0.4);

    summary.subdomains.forEach((item) => {
      ensureSpace(doc, 28, labels, lang, pageState);

      const barX = x + 150;
      const barY = doc.y + 5;
      const barW = w - 180;
      const ratio = Math.max(0, Math.min(1, item.average / 3));

      doc.fillColor(BRAND.muted)
        .font(getFont(lang))
        .fontSize(9)
        .text(formatKeyLabel(item.key, labels), x, doc.y, {
          width: 135,
          align: getTextAlign(lang)
        });

      doc.roundedRect(barX, barY, barW, 8, 4).fill("#EEF2F6");
      doc.roundedRect(barX, barY, barW * ratio, 8, 4).fill(BRAND.blue);

      doc.fillColor(BRAND.muted)
        .font(getFont(lang))
        .fontSize(8)
        .text(formatScore(item.average), barX + barW + 8, doc.y - 1, {
          width: 30
        });

      doc.moveDown(0.55);
    });
  }
}

function getReportV2PdfLabels(lang = "en") {
  if (lang === "hu") {
    return {
      title: "Korosztalyi ertelmezes",
      ageBand: "Korosztaly",
      recommendations: "Korosztalyi javaslatok",
      actionPlan: "Kovetkezo 7 nap akcioterve",
      observationFocus: "Mit figyelj meg celzottan?",
      escalationNote: "Mikor ne varj tovabb?"
    };
  }

  return {
    title: "Age-group interpretation",
    ageBand: "Age group",
    recommendations: "Age-aware recommendations",
    actionPlan: "Next 7-day action plan",
    observationFocus: "What to observe on purpose",
    escalationNote: "When not to wait"
  };
}

function addReportV2AgeBlock(doc, payload, labels, lang, pageState = null) {
  const context = buildReportV2Context(payload || {}, lang);
  const v2Labels = getReportV2PdfLabels(lang);
  const x = 56;
  const w = doc.page.width - 112;
  const bodyWidth = w - 44;
  const recommendations = (context.recommendations || []).slice(0, 3);
  const actionPlan = (context.actionPlan || []).slice(0, 3);

  const bodyText = clean(context.interpretation);
  const recommendationText = recommendations
    .map((item) => `- ${clean(item)}`)
    .join("\n");
  const actionText = actionPlan
    .map((item, index) => `${index + 1}. ${clean(item)}`)
    .join("\n");
  const observationText = clean(context.observationFocus);
  const escalationText = clean(context.escalationNote);

  const titleHeight = doc
    .font(getFont(lang, true))
    .fontSize(12.5)
    .heightOfString(v2Labels.title, { width: bodyWidth });

  const bodyHeight = doc
    .font(getFont(lang))
    .fontSize(9.5)
    .heightOfString(bodyText, {
      width: bodyWidth,
      align: getTextAlign(lang),
      lineGap: 3
    });

  const recHeight = recommendationText
    ? doc
        .font(getFont(lang))
        .fontSize(9.2)
        .heightOfString(recommendationText, {
          width: bodyWidth - 12,
          align: getTextAlign(lang),
          lineGap: 3
        })
    : 0;

  const actionHeight = actionText
    ? doc
        .font(getFont(lang))
        .fontSize(9.2)
        .heightOfString(actionText, {
          width: bodyWidth - 12,
          align: getTextAlign(lang),
          lineGap: 3
        })
    : 0;

  const observationHeight = observationText
    ? doc
        .font(getFont(lang))
        .fontSize(9.2)
        .heightOfString(observationText, {
          width: bodyWidth - 16,
          align: getTextAlign(lang),
          lineGap: 3
        })
    : 0;

  const escalationHeight = escalationText
    ? doc
        .font(getFont(lang))
        .fontSize(9)
        .heightOfString(escalationText, {
          width: bodyWidth - 16,
          align: getTextAlign(lang),
          lineGap: 3
        })
    : 0;

  const h = Math.max(
    260,
    Math.ceil(
      titleHeight +
      bodyHeight +
      recHeight +
      actionHeight +
      observationHeight +
      escalationHeight +
      190
    )
  );

  ensureSpace(doc, h + 18, labels, lang, pageState);
  doc.moveDown(0.8);

  const y = doc.y;

  doc.roundedRect(x, y, w, h, 16).fill("#FFFFFF");
  doc.roundedRect(x, y, w, h, 16).strokeColor(BRAND.softBorder).lineWidth(1).stroke();
  doc.rect(x, y, 8, h).fill(BRAND.green);

  doc.circle(x + 30, y + 30, 13).fill(BRAND.lightGreen);
  doc.circle(x + 30, y + 30, 5).fill(BRAND.green);

  doc.fillColor(BRAND.dark)
    .font(getFont(lang, true))
    .fontSize(12.5)
    .text(v2Labels.title, x + 54, y + 18, {
      width: w - 76,
      align: getTextAlign(lang)
    });

  doc.fillColor(BRAND.muted)
    .font(getFont(lang, true))
    .fontSize(9)
    .text(`${v2Labels.ageBand}: ${context.ageBandLabel}`, x + 54, y + 42, {
      width: w - 76,
      align: getTextAlign(lang)
    });

  doc.fillColor("#374151")
    .font(getFont(lang))
    .fontSize(9.5)
    .text(bodyText, x + 22, y + 68, {
      width: bodyWidth,
      align: getTextAlign(lang),
      lineGap: 3
    });

  let cursorY = doc.y + 10;

  if (recommendations.length) {
    doc.fillColor(BRAND.dark)
      .font(getFont(lang, true))
      .fontSize(10)
      .text(v2Labels.recommendations, x + 22, cursorY, {
        width: bodyWidth,
        align: getTextAlign(lang)
      });

    doc.fillColor("#374151")
      .font(getFont(lang))
      .fontSize(9.2)
      .text(recommendationText, x + 30, cursorY + 18, {
        width: bodyWidth - 12,
        align: getTextAlign(lang),
        lineGap: 3
      });

    cursorY = doc.y + 12;
  }

  if (actionPlan.length) {
    const actionBoxHeight = Math.max(82, actionHeight + 48);

    doc.roundedRect(x + 18, cursorY, bodyWidth + 8, actionBoxHeight, 12).fill(BRAND.lightBlue);
    doc.roundedRect(x + 18, cursorY, bodyWidth + 8, actionBoxHeight, 12)
      .strokeColor(BRAND.softBorder)
      .lineWidth(1)
      .stroke();

    doc.circle(x + 36, cursorY + 22, 6).fill(BRAND.blue);

    doc.fillColor(BRAND.dark)
      .font(getFont(lang, true))
      .fontSize(10)
      .text(v2Labels.actionPlan, x + 52, cursorY + 14, {
        width: bodyWidth - 34,
        align: getTextAlign(lang)
      });

    doc.fillColor("#374151")
      .font(getFont(lang))
      .fontSize(9.2)
      .text(actionText, x + 34, cursorY + 38, {
        width: bodyWidth - 16,
        align: getTextAlign(lang),
        lineGap: 3
      });

    cursorY += actionBoxHeight + 10;
  }

  if (observationText) {
    doc.fillColor(BRAND.dark)
      .font(getFont(lang, true))
      .fontSize(10)
      .text(v2Labels.observationFocus, x + 22, cursorY, {
        width: bodyWidth,
        align: getTextAlign(lang)
      });

    doc.fillColor("#374151")
      .font(getFont(lang))
      .fontSize(9.2)
      .text(observationText, x + 22, cursorY + 18, {
        width: bodyWidth,
        align: getTextAlign(lang),
        lineGap: 3
      });

    cursorY = doc.y + 10;
  }

  if (escalationText) {
    const noteHeight = Math.max(64, escalationHeight + 42);

    doc.roundedRect(x + 18, cursorY, bodyWidth + 8, noteHeight, 12).fill(BRAND.lightOrange);
    doc.roundedRect(x + 18, cursorY, bodyWidth + 8, noteHeight, 12)
      .strokeColor("#FFD2A6")
      .lineWidth(1)
      .stroke();

    doc.circle(x + 36, cursorY + 21, 6).fill(BRAND.orange);

    doc.fillColor("#9A3412")
      .font(getFont(lang, true))
      .fontSize(10)
      .text(v2Labels.escalationNote, x + 52, cursorY + 13, {
        width: bodyWidth - 34,
        align: getTextAlign(lang)
      });

    doc.fillColor("#7C2D12")
      .font(getFont(lang))
      .fontSize(9)
      .text(escalationText, x + 34, cursorY + 36, {
        width: bodyWidth - 16,
        align: getTextAlign(lang),
        lineGap: 3
      });
  }

  doc.y = y + h;
}

function addSectionTitle(doc, title, labels, lang, pageState = null) {
  ensureSpace(doc, 54, labels, lang, pageState);

  doc.moveDown(1);

  doc.circle(62, doc.y + 8, 5).fill(BRAND.blue);
  doc.circle(76, doc.y + 8, 5).fill(BRAND.orange);

  doc.fillColor(BRAND.dark)
    .font(getFont(lang, true))
    .fontSize(14)
    .text(title, 92, doc.y, {
      width: doc.page.width - 148,
      align: getTextAlign(lang)
    });

  doc.moveDown(0.4);

  doc.moveTo(56, doc.y)
    .lineTo(doc.page.width - 56, doc.y)
    .strokeColor(BRAND.softBorder)
    .lineWidth(1)
    .stroke();

  doc.moveDown(0.65);
}

function addDisclaimerBox(doc, labels, lang, pageState = null) {
  const x = 56;
  const w = doc.page.width - 112;
  const bodyWidth = w - 36;

  const titleHeight = doc
    .font(getFont(lang, true))
    .fontSize(11)
    .heightOfString(labels.disclaimerTitle, {
      width: w - 56,
      align: getTextAlign(lang)
    });

  const bodyHeight = doc
    .font(getFont(lang))
    .fontSize(9.5)
    .heightOfString(labels.disclaimer, {
      width: bodyWidth,
      lineGap: 3,
      align: getTextAlign(lang)
    });

  const h = Math.max(104, Math.ceil(titleHeight + bodyHeight + 58));

  ensureSpace(doc, h + 16, labels, lang, pageState);

  doc.moveDown(1);

  const y = doc.y;

  doc.roundedRect(x, y, w, h, 14).fill(BRAND.lightOrange);
  doc.roundedRect(x, y, w, h, 14).strokeColor("#FFD2A6").lineWidth(1).stroke();

  doc.circle(x + 21, y + 23, 7).fill(BRAND.orange);

  doc.fillColor("#9A3412")
    .font(getFont(lang, true))
    .fontSize(11)
    .text(labels.disclaimerTitle, x + 38, y + 16, {
      width: w - 56,
      align: getTextAlign(lang)
    });

  doc.fillColor("#7C2D12")
    .font(getFont(lang))
    .fontSize(9.5)
    .text(labels.disclaimer, x + 18, y + 42, {
      width: w - 36,
      lineGap: 3,
      align: getTextAlign(lang)
    });

  doc.y = y + h;
}

function isHeading(paragraph) {
  const text = clean(paragraph);
  if (!text) return false;

  if (/^\d{1,2}\.\s+/.test(text) && text.length < 150) return true;
  if (text.length < 90 && /[:：]$/u.test(text)) return true;
  if (text === text.toUpperCase() && text.length < 120) return true;

  return false;
}

function isBulletLine(line) {
  const text = clean(line);
  if (!text) return false;
  if (/^\d{1,2}\.\s+\S/.test(text)) return false;
  return /^([*•‣-]\s+|[–—]\s+|\d{1,2}[)]\s+)/u.test(text);
}

function cleanBulletLine(line) {
  return clean(line)
    .replace(/^([*•‣-]\s+|[–—]\s+|\d{1,2}[)]\s+)/u, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .trim();
}

function normalizeHeading(paragraph, fallbackCounter) {
  const text = clean(paragraph);
  const numbered = text.match(/^(\d+)\.\s*(.+)$/);

  if (numbered) {
    return `${numbered[1]}. ${clean(numbered[2])}`;
  }

  return `${fallbackCounter}. ${text}`;
}

function splitReportText(reportText) {
  const blocks = stripMarkdown(reportText)
    .split(/\n\s*\n/)
    .map((block) => clean(block))
    .filter(Boolean);

  const parts = [];

  blocks.forEach((block) => {
    const lines = block
      .split(/\r?\n/)
      .map((line) => clean(line))
      .filter(Boolean);

    let bodyLines = [];
    let bulletLines = [];

    function flushBody() {
      const text = bodyLines.join(" ").replace(/\s+/g, " ").trim();
      if (text) parts.push({ type: "body", text });
      bodyLines = [];
    }

    function flushBullets() {
      const items = bulletLines
        .map(cleanBulletLine)
        .filter(Boolean);

      if (items.length) {
        parts.push({ type: "bullets", items });
      }

      bulletLines = [];
    }

    lines.forEach((line) => {
      if (isHeading(line)) {
        flushBullets();
        flushBody();
        parts.push({ type: "heading", text: line });
      } else if (isBulletLine(line)) {
        flushBody();
        bulletLines.push(line);
      } else {
        flushBullets();
        bodyLines.push(line);
      }
    });

    flushBullets();
    flushBody();
  });

  return parts;
}

function splitLongParagraph(paragraph, lang) {
  const maxLength = lang === "zh" || lang === "ja" ? 360 : 620;
  const text = clean(paragraph);

  if (text.length <= maxLength) {
    return [text];
  }

  const sentences = text
    .split(/(?<=[.!?。！？])\s+/u)
    .map((item) => clean(item))
    .filter(Boolean);

  if (sentences.length <= 1) {
    const chunks = [];
    for (let i = 0; i < text.length; i += maxLength) {
      chunks.push(text.slice(i, i + maxLength).trim());
    }
    return chunks.filter(Boolean);
  }

  const chunks = [];
  let current = "";

  sentences.forEach((sentence) => {
    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length > maxLength && current) {
      chunks.push(current);
      current = sentence;
    } else {
      current = next;
    }
  });

  if (current) chunks.push(current);
  return chunks;
}

function addReportHeading(doc, heading, labels, lang, pageState = null) {
  ensureSpace(doc, 126, labels, lang, pageState);

  const x = 56;
  const y = doc.y + 6;
  const w = doc.page.width - 112;
  const h = 52;
  const numbered = clean(heading).match(/^(\d+)\.\s*(.+)$/);
  const sectionNumber = numbered ? numbered[1] : "";
  const sectionTitle = numbered ? numbered[2] : heading;
  const accent = getSectionColor(sectionNumber || 1);

  doc.roundedRect(x, y, w, h, 12).fill(BRAND.lightBlue);
  doc.roundedRect(x, y, w, h, 12).strokeColor(BRAND.softBorder).lineWidth(1).stroke();
  doc.rect(x, y, 7, h).fill(accent);

  if (sectionNumber) {
    doc.circle(x + 31, y + 26, 15).fill(accent);
    doc.fillColor("#FFFFFF")
      .font(getFont(lang, true))
      .fontSize(10.5)
      .text(sectionNumber, x + 16, y + 19, {
        width: 30,
        align: "center"
      });
  }

  doc.fillColor(BRAND.dark)
    .font(getFont(lang, true))
    .fontSize(12.4)
    .text(sectionTitle, sectionNumber ? x + 58 : x + 20, y + 15, {
      width: sectionNumber ? w - 78 : w - 40,
      align: getTextAlign(lang),
      lineGap: 2
    });

  doc.y = y + h + 10;
}

function addReportBulletList(doc, items, labels, lang, pageState = null) {
  const listItems = (items || [])
    .map((item) => clean(item))
    .filter(Boolean);

  if (!listItems.length) return;

  const x = 74;
  const width = doc.page.width - 148;
  const fontSize = lang === "zh" || lang === "ja" ? 9.8 : 10.1;

  listItems.forEach((item) => {
    doc.font(getFont(lang)).fontSize(fontSize);

    const height = doc.heightOfString(item, {
      width,
      align: getTextAlign(lang),
      lineGap: 3
    });

    ensureSpace(doc, height + 18, labels, lang, pageState);

    const y = doc.y + 4;

    doc.circle(61, y + 4, 3.2).fill(BRAND.orange);

    doc.fillColor("#374151")
      .font(getFont(lang))
      .fontSize(fontSize)
      .text(item, x, doc.y, {
        width,
        align: getTextAlign(lang),
        lineGap: 3
      });

    doc.moveDown(0.35);
  });
}

function addReportParagraph(doc, paragraph, labels, lang, pageState = null) {
  const chunks = splitLongParagraph(paragraph, lang);
  const width = doc.page.width - 112;
  const fontSize = lang === "zh" || lang === "ja" ? 10 : 10.4;
  const options = {
    width,
    align: getTextAlign(lang),
    lineGap: 4
  };

  chunks.forEach((chunk) => {
    doc.font(getFont(lang)).fontSize(fontSize);

    const height = doc.heightOfString(chunk, options);
    ensureSpace(doc, height + 20, labels, lang, pageState);

    doc.fillColor("#374151")
      .font(getFont(lang))
      .fontSize(fontSize)
      .text(chunk, 56, doc.y, options);

    doc.moveDown(0.62);
  });
}

function addReportText(doc, reportText, labels, lang, pageState = null) {
  const parts = splitReportText(reportText);

  let sectionCounter = 1;

  parts.forEach((part) => {
    if (part.type === "heading") {
      const heading = normalizeHeading(part.text, sectionCounter);
      const match = heading.match(/^(\d+)\./);
      if (match) sectionCounter = Number(match[1]) + 1;

      addReportHeading(doc, heading, labels, lang, pageState);
      return;
    }

    if (part.type === "bullets") {
      addReportBulletList(doc, part.items, labels, lang, pageState);
      return;
    }

    addReportParagraph(doc, part.text, labels, lang, pageState);
  });
}

export async function generatePdfBuffer({ name, reportText, lang = "en", payload = null }) {
  return new Promise((resolve, reject) => {
    try {
      const safeLang = clean(lang) || "en";
      const labels = getLabels(safeLang);
      const chunks = [];

      const doc = new PDFDocument({
        size: "A4",
        margin: 56,
        info: {
          Title: labels.title,
          Author: "NeuroMap Kids",
          Subject: labels.subtitle
        }
      });

      registerFonts(doc);

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageState = { current: 1 };

      addCoverPage(doc, { name, payload, labels, lang: safeLang });
      addFooter(doc, labels, safeLang, pageState.current);

      doc.addPage();
      pageState.current += 1;
      addHeader(doc, labels, safeLang);
      addInfoCard(doc, { name, lang: safeLang });

      doc.y = 246;

      addOverviewBlock(doc, payload, labels, safeLang, pageState);
      addReportV2AgeBlock(doc, payload, labels, safeLang, pageState);
      addSectionTitle(doc, labels.reportTitle, labels, safeLang, pageState);
      addReportText(doc, reportText, labels, safeLang, pageState);
      addDisclaimerBox(doc, labels, safeLang, pageState);
      addFooter(doc, labels, safeLang, pageState.current);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
