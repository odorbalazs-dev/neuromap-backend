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

const PAGE_LAYOUT = {
  contentTop: 138,
  contentBottomPadding: 122,
  blockGap: 20
};

const PDF_VISUAL_KEEP_WITH_BODY_HEIGHT = 76;
const PDF_SECTION_TITLE_KEEP_HEIGHT = 78;
const PDF_REPORT_VERSION = "pdf_report_v12_visual_qa_v4_1";
const BODY_TEXT_COLOR = "#374151";
const BULLET = "\u2022";

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

function polishHungarianReportWording(value = "") {
  return clean(value)
    .replace(/gyermek\s+mindennapi\s+m\u0171k\u00f6d\u00e9s\u00e9t/giu, "gyermek mindennapi viselked\u00e9s\u00e9t")
    .replace(/gyermek\s+m\u0171k\u00f6d\u00e9se/giu, "gyermek viselked\u00e9se")
    .replace(/gyermek\s+m\u0171k\u00f6d\u00e9s\u00e9r\u0151l/giu, "gyermek viselked\u00e9s\u00e9r\u0151l")
    .replace(/gyermek\s+m\u0171k\u00f6d\u00e9s\u00e9t/giu, "gyermek viselked\u00e9s\u00e9t")
    .replace(/gyermek\s+m\u0171k\u00f6d\u00e9s\u00e9ben/giu, "gyermek viselked\u00e9s\u00e9ben")
    .replace(/gyermek\s+m\u0171k\u00f6d\u00e9s\u00e9hez/giu, "gyermek viselked\u00e9s\u00e9hez")
    .replace(/gyermek\s+mindennapi\s+mĹ±kĂ¶dĂ©sĂ©t/giu, "gyermek mindennapi viselkedĂ©sĂ©t")
    .replace(/gyermek\s+mindennapi\s+mukodeset/giu, "gyermek mindennapi viselkedeset")
    .replace(/gyermek\s+mĹ±kĂ¶dĂ©se/giu, "gyermek viselkedĂ©se")
    .replace(/gyermek\s+mukodese/giu, "gyermek viselkedese")
    .replace(/gyermek\s+mĹ±kĂ¶dĂ©sĂ©rĹ‘l/giu, "gyermek viselkedĂ©sĂ©rĹ‘l")
    .replace(/gyermek\s+mukodeserol/giu, "gyermek viselkedeserol")
    .replace(/gyermek\s+mĹ±kĂ¶dĂ©sĂ©t/giu, "gyermek viselkedĂ©sĂ©t")
    .replace(/gyermek\s+mukodeset/giu, "gyermek viselkedeset")
    .replace(/gyermek\s+mĹ±kĂ¶dĂ©sĂ©ben/giu, "gyermek viselkedĂ©sĂ©ben")
    .replace(/gyermek\s+mukodeseben/giu, "gyermek viselkedeseben")
    .replace(/gyermek\s+mĹ±kĂ¶dĂ©sĂ©hez/giu, "gyermek viselkedĂ©sĂ©hez")
    .replace(/gyermek\s+mukodesehez/giu, "gyermek viselkedesehez");
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
      subtitle: "StrukturĂˇlt, szĂĽlĹ‘barĂˇt elĹ‘szĹ±rĂ©si Ă¶sszefoglalĂł",
      greeting: "Kedves",
      parentFallback: "SzĂĽlĹ‘",
      reportTitle: "RĂ©szletes Ă©rtelmezĂ©s",
      summaryLabel: "ElĹ‘zetes kĂ©rdĹ‘Ă­ves riport",
      overviewTitle: "Gyors ĂˇttekintĂ©s",
      focusArea: "FĹ‘ fĂłkuszterĂĽlet",
      secondarySignal: "MĂˇsodlagos jelzĂ©s",
      signalLevel: "JelzĂ©sszint",
      topAreas: "LegerĹ‘sebb terĂĽletek",
      notAvailable: "Nem elĂ©rhetĹ‘",
      disclaimerTitle: "Fontos megjegyzĂ©s",
      disclaimer:
        "Ez az anyag nem minĹ‘sĂĽl diagnĂłzisnak, Ă©s nem helyettesĂ­ti a szemĂ©lyes szakĂ©rtĹ‘i vizsgĂˇlatot. A teljes Ă©rtĂ©kelĂ©shez szakemberrel tĂ¶rtĂ©nĹ‘ konzultĂˇciĂł, fejlĹ‘dĂ©stĂ¶rtĂ©net Ă©s tĂˇgabb kontextus szĂĽksĂ©ges.",
      footer: "NeuroMap Kids Â· Screening report"
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
      footer: "NeuroMap Kids Â· Screening report"
    },
    de: {
      title: "NeuroMap Kids Bericht",
      subtitle: "Strukturierte, elternfreundliche Screening-Zusammenfassung",
      greeting: "Hallo",
      parentFallback: "Elternteil",
      reportTitle: "Detaillierte Interpretation",
      summaryLabel: "VorlĂ¤ufiger Fragebogenbericht",
      overviewTitle: "Kurzer Ăśberblick",
      focusArea: "Hauptfokus",
      secondarySignal: "SekundĂ¤res Signal",
      signalLevel: "SignalstĂ¤rke",
      topAreas: "StĂ¤rkste Bereiche",
      notAvailable: "Nicht verfĂĽgbar",
      disclaimerTitle: "Wichtiger Hinweis",
      disclaimer:
        "Dieses Material ist keine Diagnose und ersetzt keine persĂ¶nliche fachliche Untersuchung. FĂĽr eine vollstĂ¤ndige Bewertung sind eine qualifizierte Fachperson, die Entwicklungsgeschichte und ein breiterer Kontext erforderlich.",
      footer: "NeuroMap Kids Â· Screening report"
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
      topAreas: "Aree piĂą rilevanti",
      notAvailable: "Non disponibile",
      disclaimerTitle: "Nota importante",
      disclaimer:
        "Questo materiale non Ă¨ una diagnosi e non sostituisce una valutazione di persona da parte di un professionista qualificato. Una valutazione completa richiede una consulenza specialistica, la storia dello sviluppo e un contesto piĂą ampio.",
      footer: "NeuroMap Kids Â· Screening report"
    },
    es: {
      title: "Informe NeuroMap Kids",
      subtitle: "Resumen de cribado estructurado y fĂˇcil de entender para padres",
      greeting: "Estimado/a",
      parentFallback: "Padre/madre",
      reportTitle: "InterpretaciĂłn detallada",
      summaryLabel: "Informe preliminar del cuestionario",
      overviewTitle: "Resumen rĂˇpido",
      focusArea: "Ărea principal",
      secondarySignal: "SeĂ±al secundaria",
      signalLevel: "Nivel de seĂ±al",
      topAreas: "Ăreas mĂˇs destacadas",
      notAvailable: "No disponible",
      disclaimerTitle: "Nota importante",
      disclaimer:
        "Este material no es un diagnĂłstico y no sustituye una evaluaciĂłn presencial por parte de un profesional cualificado. Una evaluaciĂłn completa requiere consulta profesional, historia del desarrollo y un contexto mĂˇs amplio.",
      footer: "NeuroMap Kids Â· Screening report"
    },
    fr: {
      title: "Rapport NeuroMap Kids",
      subtitle: "RĂ©sumĂ© de dĂ©pistage structurĂ© et accessible aux parents",
      greeting: "Bonjour",
      parentFallback: "Parent",
      reportTitle: "InterprĂ©tation dĂ©taillĂ©e",
      summaryLabel: "Rapport prĂ©liminaire du questionnaire",
      overviewTitle: "AperĂ§u rapide",
      focusArea: "Domaine principal",
      secondarySignal: "Signal secondaire",
      signalLevel: "Niveau du signal",
      topAreas: "Domaines les plus marquĂ©s",
      notAvailable: "Non disponible",
      disclaimerTitle: "Note importante",
      disclaimer:
        "Ce document nâ€™est pas un diagnostic et ne remplace pas une Ă©valuation en personne par un professionnel qualifiĂ©. Une Ă©valuation complĂ¨te nĂ©cessite une consultation spĂ©cialisĂ©e, lâ€™histoire du dĂ©veloppement et un contexte plus large.",
      footer: "NeuroMap Kids Â· Screening report"
    },
    pt: {
      title: "RelatĂłrio NeuroMap Kids",
      subtitle: "Resumo de triagem estruturado e amigĂˇvel para pais",
      greeting: "OlĂˇ",
      parentFallback: "ResponsĂˇvel",
      reportTitle: "InterpretaĂ§ĂŁo detalhada",
      summaryLabel: "RelatĂłrio preliminar do questionĂˇrio",
      overviewTitle: "VisĂŁo rĂˇpida",
      focusArea: "Ărea principal",
      secondarySignal: "Sinal secundĂˇrio",
      signalLevel: "NĂ­vel do sinal",
      topAreas: "Ăreas mais fortes",
      notAvailable: "NĂŁo disponĂ­vel",
      disclaimerTitle: "Nota importante",
      disclaimer:
        "Este material nĂŁo Ă© um diagnĂłstico e nĂŁo substitui uma avaliaĂ§ĂŁo presencial por um profissional qualificado. Uma avaliaĂ§ĂŁo completa requer consulta profissional, histĂłrico de desenvolvimento e contexto mais amplo.",
      footer: "NeuroMap Kids Â· Screening report"
    },
    pl: {
      title: "Raport NeuroMap Kids",
      subtitle: "Ustrukturyzowane, przyjazne dla rodzicĂłw podsumowanie przesiewowe",
      greeting: "DzieĹ„ dobry",
      parentFallback: "Rodzic",
      reportTitle: "SzczegĂłĹ‚owa interpretacja",
      summaryLabel: "WstÄ™pny raport z kwestionariusza",
      overviewTitle: "KrĂłtki przeglÄ…d",
      focusArea: "GĹ‚Ăłwny obszar",
      secondarySignal: "SygnaĹ‚ dodatkowy",
      signalLevel: "Poziom sygnaĹ‚u",
      topAreas: "Najsilniejsze obszary",
      notAvailable: "Brak danych",
      disclaimerTitle: "WaĹĽna informacja",
      disclaimer:
        "Ten materiaĹ‚ nie jest diagnozÄ… i nie zastÄ™puje osobistej oceny przez wykwalifikowanego specjalistÄ™. PeĹ‚na ocena wymaga konsultacji specjalistycznej, historii rozwoju i szerszego kontekstu.",
      footer: "NeuroMap Kids Â· Screening report"
    },
    zh: {
      title: "NeuroMap Kids ćŠĄĺ‘Š",
      subtitle: "ç»“ćž„ĺŚ–ă€ĺ®¶é•żĺŹ‹ĺĄ˝çš„ç­›ćźĄć‘č¦",
      greeting: "ć‚¨ĺĄ˝",
      parentFallback: "ĺ®¶é•ż",
      reportTitle: "čŻ¦ç»†č§ŁčŻ»",
      summaryLabel: "ĺťć­Ąé—®ĺŤ·ćŠĄĺ‘Š",
      overviewTitle: "ĺż«é€źć¦‚č§",
      focusArea: "ä¸»č¦ĺ…łćł¨é˘†ĺźź",
      secondarySignal: "ć¬ˇč¦äżˇĺŹ·",
      signalLevel: "äżˇĺŹ·ć°´ĺął",
      topAreas: "ćś€çŞĺ‡şçš„é˘†ĺźź",
      notAvailable: "ćš‚ć— ć•°ćŤ®",
      disclaimerTitle: "é‡Ťč¦čŻ´ćŽ",
      disclaimer:
        "ćś¬ćťć–™ä¸ŤćŻčŻŠć–­ďĽŚäąźä¸Ťč˝ć›żä»Łĺć Ľä¸“ä¸šäşşĺ‘çš„éť˘ĺŻąéť˘čŻ„äĽ°ă€‚ĺ®Ść•´čŻ„äĽ°éś€č¦ä¸“ä¸šĺ’¨čŻ˘ă€ĺŹ‘ĺ±•ĺŹ˛ä»ĄĺŹŠć›´ĺążćł›çš„čŚć™ŻäżˇćŻă€‚",
      footer: "NeuroMap Kids Â· Screening report"
    },
    ja: {
      title: "NeuroMap Kids ă¬ăťăĽă",
      subtitle: "äżťč­·č€…ĺ‘ă‘ă®ć§‹é€ ĺŚ–ă•ă‚Śăźă‚ąă‚ŻăŞăĽă‹ăłă‚°ć¦‚č¦",
      greeting: "ă“ă‚“ă«ăˇăŻ",
      parentFallback: "äżťč­·č€…",
      reportTitle: "č©łç´°ăŞč§Łé‡",
      summaryLabel: "äşĺ‚™çš„ăŞčłŞĺ•ŹçĄ¨ă¬ăťăĽă",
      overviewTitle: "ć¦‚č¦",
      focusArea: "ä¸»ăŞćł¨ç›®é ĺźź",
      secondarySignal: "äşŚć¬ˇçš„ăŞă‚µă‚¤ăł",
      signalLevel: "ă‚µă‚¤ăłă®ĺĽ·ă•",
      topAreas: "ćś€ă‚‚ĺĽ·ăŹç¤şă•ă‚Śăźé ĺźź",
      notAvailable: "ĺ©ç”¨ä¸ŤĺŹŻ",
      disclaimerTitle: "é‡Ťč¦ăŞăŠçźĄă‚‰ă›",
      disclaimer:
        "ă“ă®čł‡ć–™ăŻč¨şć–­ă§ăŻăŞăŹă€čł‡ć Ľă‚’ćŚă¤ĺ°‚é–€ĺ®¶ă«ă‚ă‚‹ĺŻľéť˘č©•äľˇă®ä»Łă‚Źă‚Šă«ăŻăŞă‚Šăľă›ă‚“ă€‚ĺ®Śĺ…¨ăŞč©•äľˇă«ăŻă€ĺ°‚é–€ĺ®¶ă«ă‚ă‚‹ç›¸č«‡ă€ç™şé”ć­´ă€ă‚ă‚Šĺşă„čŚć™Żć…ĺ ±ăŚĺż…č¦ă§ă™ă€‚",
      footer: "NeuroMap Kids Â· Screening report"
    },
    ar: {
      title: "ŘŞŮ‚Ř±ŮŠŘ± NeuroMap Kids",
      subtitle: "Ů…Ů„Ř®Řµ ŮŘ­Řµ ŘŁŮŮ„ŮŠ Ů…Ů†Ř¸Ů… ŮŮ…Ů†Ř§ŘłŘ¨ Ů„Ů„ŮŘ§Ů„ŘŻŮŠŮ†",
      greeting: "Ů…Ř±Ř­Ř¨Ů‹Ř§",
      parentFallback: "ŮŮ„ŮŠ Ř§Ů„ŘŁŮ…Ř±",
      reportTitle: "ŘŞŮŘłŮŠŘ± ŘŞŮŘµŮŠŮ„ŮŠ",
      summaryLabel: "ŘŞŮ‚Ř±ŮŠŘ± ŘŁŮŮ„ŮŠ Ů„Ů„Ř§ŘłŘŞŘ¨ŮŠŘ§Ů†",
      overviewTitle: "Ů†Ř¸Ř±Ř© ŘłŘ±ŮŠŘąŘ©",
      focusArea: "Ř§Ů„Ů…Ř¬Ř§Ů„ Ř§Ů„Ř±Ř¦ŮŠŘłŮŠ",
      secondarySignal: "ŘĄŘ´Ř§Ř±Ř© Ř«Ř§Ů†ŮŮŠŘ©",
      signalLevel: "Ů…ŘłŘŞŮŮ‰ Ř§Ů„ŘĄŘ´Ř§Ř±Ř©",
      topAreas: "ŘŁŘ¨Ř±Ř˛ Ř§Ů„Ů…Ř¬Ř§Ů„Ř§ŘŞ",
      notAvailable: "ŘşŮŠŘ± Ů…ŘŞŘ§Ř­",
      disclaimerTitle: "Ů…Ů„Ř§Ř­Ř¸Ř© Ů…Ů‡Ů…Ř©",
      disclaimer:
        "Ů‡Ř°Ů‡ Ř§Ů„Ů…Ř§ŘŻŘ© Ů„ŮŠŘłŘŞ ŘŞŘ´Ř®ŮŠŘµŮ‹Ř§ ŮŮ„Ř§ ŘŞŘ­Ů„ Ů…Ř­Ů„ Ř§Ů„ŘŞŮ‚ŮŠŮŠŮ… Ř§Ů„Ř´Ř®ŘµŮŠ Ů…Ů† Ů‚Ř¨Ů„ Ů…Ř®ŘŞŘµ Ů…Ř¤Ů‡Ů„. ŮŠŘŞŘ·Ů„Ř¨ Ř§Ů„ŘŞŮ‚ŮŠŮŠŮ… Ř§Ů„ŮŘ§Ů…Ů„ Ř§ŘłŘŞŘ´Ř§Ř±Ř© Ů…Ř®ŘŞŘµŘŚ ŮŘŞŘ§Ř±ŮŠŘ®Ů‹Ř§ Ů†Ů…Ř§Ř¦ŮŠŮ‹Ř§ŘŚ ŮŘłŮŠŘ§Ů‚Ů‹Ř§ ŘŁŮŘłŘą.",
      footer: "NeuroMap Kids Â· Screening report"
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
      ANXIETY: "SzorongĂˇs",
      DEPRESSION: "Hangulati terĂĽlet",
      LEARNING: "TanulĂˇsi terĂĽlet"
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
      low: "Alacsony jelzĂ©sszint",
      mild: "Enyhe jelzĂ©sszint",
      moderate: "KĂ¶zepes jelzĂ©sszint",
      high: "Magas jelzĂ©sszint"
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
  const coverPromise = getCoverPromiseCopy(lang);
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

  const promiseY = 666;
  const promiseH = 82;
  doc.roundedRect(x, promiseY, w, promiseH, 16).fill("#F8FBFE");
  doc.roundedRect(x, promiseY, w, promiseH, 16).strokeColor(BRAND.softBorder).lineWidth(1).stroke();
  doc.rect(x, promiseY, 7, promiseH).fill(BRAND.blue);

  doc.fillColor(BRAND.dark)
    .font(getFont(lang, true))
    .fontSize(11.5)
    .text(coverPromise.title, x + 22, promiseY + 14, {
      width: w - 44,
      align: getTextAlign(lang)
    });

  const pillY = promiseY + 43;
  const pillGap = 8;
  const pillW = (w - 44 - pillGap * 2) / 3;
  coverPromise.items.slice(0, 3).forEach((item, index) => {
    const pillX = x + 22 + index * (pillW + pillGap);
    doc.roundedRect(pillX, pillY, pillW, 24, 12).fill("#FFFFFF");
    doc.roundedRect(pillX, pillY, pillW, 24, 12).strokeColor("#DCECF6").lineWidth(1).stroke();
    doc.fillColor(BRAND.dark)
      .font(getFont(lang, true))
      .fontSize(7.6)
      .text(item, pillX + 8, pillY + 7, {
        width: pillW - 16,
        align: "center",
        ellipsis: true
      });
  });
}

function getCoverPromiseCopy(lang = "en") {
  if (lang === "hu") {
    return {
      title: "Gyors olvasasi utvonal",
      items: ["fo mintazat", "korosztalyi javaslat", "kovetkezo lepes"]
    };
  }

  if (lang === "de") {
    return {
      title: "Schneller Leseweg",
      items: ["main pattern", "age guidance", "next step"]
    };
  }

  if (lang === "es") {
    return {
      title: "Ruta rapida de lectura",
      items: ["main pattern", "age guidance", "next step"]
    };
  }

  if (lang === "fr") {
    return {
      title: "Parcours de lecture rapide",
      items: ["main pattern", "age guidance", "next step"]
    };
  }

  return {
    title: "Quick reading path",
    items: ["main pattern", "age guidance", "next step"]
  };
}

function getSafeContentBottom(doc) {
  return doc.page.height - PAGE_LAYOUT.contentBottomPadding;
}

function getPageContentHeight(doc) {
  return getSafeContentBottom(doc) - PAGE_LAYOUT.contentTop;
}

function addContentPage(doc, labels, lang, pageState = null) {
  addFooter(doc, labels, lang, pageState?.current || null);
  doc.addPage();
  if (pageState) pageState.current += 1;
  addHeader(doc, labels, lang);
  doc.y = PAGE_LAYOUT.contentTop;
}

function ensureSpace(doc, neededHeight, labels, lang, pageState = null) {
  const safeBottom = getSafeContentBottom(doc);
  const pageContentHeight = getPageContentHeight(doc);
  const normalizedHeight = Math.max(0, Number(neededHeight || 0));

  if (
    normalizedHeight > pageContentHeight &&
    doc.y > PAGE_LAYOUT.contentTop + 8
  ) {
    addContentPage(doc, labels, lang, pageState);
    return;
  }

  if (doc.y + normalizedHeight > safeBottom) {
    addContentPage(doc, labels, lang, pageState);
  }
}

function measureText(doc, text, { font, fontSize, width, lineGap = 3, align = "left" }) {
  return doc
    .font(font)
    .fontSize(fontSize)
    .heightOfString(clean(text), {
      width,
      lineGap,
      align
    });
}

function splitOversizedUnit(doc, unit, options, maxHeight) {
  const text = clean(unit);
  if (!text) return [];

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    const chunks = [];
    const sliceSize = 260;

    for (let i = 0; i < text.length; i += sliceSize) {
      chunks.push(text.slice(i, i + sliceSize).trim());
    }

    return chunks.filter(Boolean);
  }

  const chunks = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    const nextHeight = measureText(doc, next, options);

    if (nextHeight > maxHeight && current) {
      chunks.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) chunks.push(current);
  return chunks;
}

function splitTextForHeight(doc, text, options, maxHeight) {
  const safeText = clean(text);
  if (!safeText) return [];

  if (measureText(doc, safeText, options) <= maxHeight) {
    return [safeText];
  }

  const units = safeText
    .split(/\n+/)
    .flatMap((line) => {
      const trimmed = clean(line);
      if (!trimmed) return [];

      const sentenceParts = trimmed
        .split(/(?<=[.!?\u3002\uff01\uff1f])\s+/u)
        .map((item) => clean(item))
        .filter(Boolean);

      return sentenceParts.length ? sentenceParts : [trimmed];
    });

  const chunks = [];
  let current = "";

  units.forEach((unit) => {
    const next = current ? `${current}\n${unit}` : unit;
    const nextHeight = measureText(doc, next, options);

    if (nextHeight > maxHeight && current) {
      chunks.push(current);
      current = unit;
      return;
    }

    if (nextHeight > maxHeight) {
      chunks.push(...splitOversizedUnit(doc, unit, options, maxHeight));
      current = "";
      return;
    }

    current = next;
  });

  if (current) chunks.push(current);
  return chunks.filter(Boolean);
}

function drawPanel(doc, { x, y, w, h, fill = "#FFFFFF", stroke = BRAND.softBorder, accent = null, radius = 14 }) {
  doc.roundedRect(x, y, w, h, radius).fill(fill);
  doc.roundedRect(x, y, w, h, radius).strokeColor(stroke).lineWidth(1).stroke();

  if (accent) {
    doc.rect(x, y, 7, h).fill(accent);
  }
}

function getPremiumPdfCopy(lang = "en") {
  if (lang === "hu") {
    return {
      title: "Hogyan haszn\u00e1ld ezt a riportot?",
      body: "Kezdd a gyors \u00e1ttekint\u00e9ssel, ut\u00e1na olvasd el a koroszt\u00e1lyi javaslatokat. A riport c\u00e9lja, hogy \u00e9rthet\u0151 mint\u00e1zatokat adjon a k\u00f6vetkez\u0151 sz\u00fcl\u0151i l\u00e9p\u00e9sekhez.",
      points: [
        "Emeld ki azt a 2-3 helyzetet, ahol a jelz\u00e9s a leger\u0151sebb.",
        "Ne egyetlen v\u00e1laszt n\u00e9zz, hanem a visszat\u00e9r\u0151 mint\u00e1zatot.",
        "Ha a jelz\u00e9s er\u0151s vagy tart\u00f3s, \u00e9rdemes szakemberrel is \u00e1tbesz\u00e9lni.",
        "Tedd mell\u00e9 a k\u00f6vetkez\u0151 7 nap megfigyel\u00e9seit: mikor er\u0151s\u00f6dik, mikor enyh\u00fcl, \u00e9s mi seg\u00edt."
      ]
    };
  }

  return {
    title: "How to use this report",
    body: "Start with the quick overview, then read the age-aware recommendations. The report is designed to turn questionnaire answers into practical patterns for the next parent steps.",
    points: [
      "Mark the 2-3 everyday situations where the signal is clearest.",
      "Look for recurring patterns rather than one isolated answer.",
      "If the signal feels strong or persistent, discuss it with a qualified professional.",
      "Add observations from the next 7 days: when it intensifies, when it eases, and what seems to help."
    ]
  };
}

function addPremiumReadingGuide(doc, labels, lang, pageState = null) {
  const copy = getPremiumPdfCopy(lang);
  const x = 56;
  const w = doc.page.width - 112;
  const bodyWidth = w - 48;
  const align = getTextAlign(lang);
  const titleHeight = measureText(doc, copy.title, {
    font: getFont(lang, true),
    fontSize: 12.5,
    width: bodyWidth,
    lineGap: 2,
    align
  });
  const bodyHeight = measureText(doc, copy.body, {
    font: getFont(lang),
    fontSize: 9.5,
    width: bodyWidth,
    lineGap: 3,
    align
  });
  const pointHeight = copy.points.reduce((sum, point) => {
    return sum + measureText(doc, point, {
      font: getFont(lang),
      fontSize: 9.1,
      width: bodyWidth - 22,
      lineGap: 2.5,
      align
    }) + 7;
  }, 0);
  const h = Math.max(156, Math.ceil(titleHeight + bodyHeight + pointHeight + 66));

  ensureSpace(doc, h + 18, labels, lang, pageState);

  const y = doc.y;
  drawPanel(doc, {
    x,
    y,
    w,
    h,
    fill: "#F8FBFE",
    stroke: BRAND.softBorder,
    accent: BRAND.blue
  });

  doc.circle(x + 28, y + 28, 9).fill(BRAND.blue);
  doc.fillColor(BRAND.dark)
    .font(getFont(lang, true))
    .fontSize(12.5)
    .text(copy.title, x + 46, y + 18, {
      width: bodyWidth - 24,
      align
    });

  doc.fillColor(BODY_TEXT_COLOR)
    .font(getFont(lang))
    .fontSize(9.5)
    .text(copy.body, x + 24, y + 48 + titleHeight, {
      width: bodyWidth,
      align,
      lineGap: 3
    });

  let pointY = y + 72 + titleHeight + bodyHeight;
  copy.points.forEach((point) => {
    doc.circle(x + 30, pointY + 6, 3).fill(BRAND.orange);
    doc.fillColor(BODY_TEXT_COLOR)
      .font(getFont(lang))
      .fontSize(9.1)
      .text(point, x + 42, pointY, {
        width: bodyWidth - 22,
        align,
        lineGap: 2.5
      });
    pointY += measureText(doc, point, {
      font: getFont(lang),
      fontSize: 9.1,
      width: bodyWidth - 22,
      lineGap: 2.5,
      align
    }) + 7;
  });

  doc.y = y + h + 14;
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

function addMiniCard(doc, x, y, w, title, value, lang, color = BRAND.blue, height = 72) {
  const h = height;

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
    .text(value || "â€”", x + 16, y + 36, {
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

function getParentQuickSummaryCopy(lang = "en") {
  if (lang === "hu") {
    return {
      title: "Sz\u00fcl\u0151i gyors \u00f6sszefoglal\u00f3",
      lead: "A riport elej\u00e9n ezt a blokkot \u00e9rdemes el\u0151sz\u00f6r \u00e1tn\u00e9zni: megmutatja a f\u0151 mint\u00e1t, a koroszt\u00e1lyi kontextust \u00e9s az els\u0151 gyakorlati l\u00e9p\u00e9st.",
      focus: "F\u0151 minta",
      age: "Koroszt\u00e1ly",
      firstStep: "Els\u0151 l\u00e9p\u00e9s",
      note: "Ez nem diagn\u00f3zis. A c\u00e9l az, hogy a v\u00e1laszokb\u00f3l \u00e9rthet\u0151, gyakorlatban haszn\u00e1lhat\u00f3 sz\u00fcl\u0151i kapaszkod\u00f3k legyenek."
    };
  }

  return {
    title: "Parent quick summary",
    lead: "Start here before reading the full report: this block highlights the primary pattern, age context, and one practical first step.",
    focus: "Main pattern",
    age: "Age context",
    firstStep: "First step",
    note: "This is not a diagnosis. The goal is to turn questionnaire answers into clear, practical parent guidance."
  };
}

function addParentQuickSummaryBlock(doc, payload, labels, lang, pageState = null) {
  const summary = extractSummary(payload || {});
  const context = buildReportV2Context(payload || {}, lang);
  const copy = getParentQuickSummaryCopy(lang);
  const x = 56;
  const w = doc.page.width - 112;
  const align = getTextAlign(lang);
  const innerX = x + 20;
  const innerW = w - 40;
  const gap = 10;
  const cardW = (innerW - gap * 2) / 3;
  const firstAction =
    lang === "hu"
      ? "A leger\u0151sebb helyzet c\u00e9lzott megfigyel\u00e9se"
      : "Observe the clearest everyday situation";

  const leadHeight = measureText(doc, copy.lead, {
    font: getFont(lang),
    fontSize: 9.4,
    width: innerW,
    lineGap: 3,
    align
  });
  const actionHeight = measureText(doc, firstAction, {
    font: getFont(lang, true),
    fontSize: 10.3,
    width: cardW - 28,
    lineGap: 2,
    align
  });
  const noteHeight = measureText(doc, copy.note, {
    font: getFont(lang),
    fontSize: 8.8,
    width: innerW,
    lineGap: 2.5,
    align
  });
  const miniCardH = Math.max(124, Math.ceil(90 + Math.max(0, actionHeight - 10)));
  const h = Math.max(320, Math.ceil(154 + leadHeight + miniCardH + noteHeight + 52));

  ensureSpace(doc, h + 24, labels, lang, pageState);

  doc.moveDown(0.8);
  const y = doc.y;

  drawPanel(doc, {
    x,
    y,
    w,
    h,
    fill: "#F8FBFE",
    stroke: BRAND.softBorder,
    accent: BRAND.orange,
    radius: 18
  });

  doc.fillColor(BRAND.dark)
    .font(getFont(lang, true))
    .fontSize(14.2)
    .text(copy.title, innerX, y + 18, {
      width: innerW,
      align
    });

  doc.fillColor(BODY_TEXT_COLOR)
    .font(getFont(lang))
    .fontSize(9.4)
    .text(copy.lead, innerX, y + 43, {
      width: innerW,
      lineGap: 3,
      align
    });

  const cardY = y + 100 + leadHeight;

  addMiniCard(
    doc,
    innerX,
    cardY,
    cardW,
    copy.focus,
    getDomainLabel(lang, summary.detectedRisk, labels),
    lang,
    BRAND.blue,
    miniCardH
  );

  addMiniCard(
    doc,
    innerX + cardW + gap,
    cardY,
    cardW,
    copy.age,
    context.ageBandLabel || labels.notAvailable,
    lang,
    BRAND.green,
    miniCardH
  );

  addMiniCard(
    doc,
    innerX + (cardW + gap) * 2,
    cardY,
    cardW,
    copy.firstStep,
    firstAction,
    lang,
    BRAND.orange,
    miniCardH
  );

  doc.fillColor(BRAND.muted)
    .font(getFont(lang))
    .fontSize(8.8)
    .text(copy.note, innerX, cardY + miniCardH + 24, {
      width: innerW,
      lineGap: 2.5,
      align
    });

  doc.y = y + h + 20;
}

function getReportV2PdfLabels(lang = "en") {
  if (lang === "hu") {
    return {
      title: "Koroszt\u00e1lyi \u00e9rtelmez\u00e9s",
      ageBand: "Koroszt\u00e1ly",
      recommendations: "Koroszt\u00e1lyi javaslatok",
      actionPlan: "K\u00f6vetkez\u0151 7 nap akci\u00f3terve",
      observationFocus: "Mit figyelj meg c\u00e9lzottan?",
      escalationNote: "Mikor ne v\u00e1rj tov\u00e1bb?"
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
  const bodyWidth = w - 48;
  const align = getTextAlign(lang);
  const recommendations = (context.recommendations || []).slice(0, 3);
  const actionPlan = (context.actionPlan || []).slice(0, 3);

  const bodyText = clean(context.interpretation);
  const observationText = clean(context.observationFocus);
  const escalationText = clean(context.escalationNote);

  function addTextPanel({
    title,
    body,
    accent = BRAND.green,
    fill = "#FFFFFF",
    titleColor = BRAND.dark,
    bodyColor = BODY_TEXT_COLOR,
    iconFill = null,
    titleSize = 10.6,
    bodySize = 9.4,
    bodyLineGap = 3.5
  }) {
    const safeTitle = clean(title);
    const safeBody = clean(body);
    if (!safeTitle && !safeBody) return;

    const titleWidth = bodyWidth - 34;
    const firstTitleHeight = safeTitle
      ? measureText(doc, safeTitle, {
          font: getFont(lang, true),
          fontSize: titleSize,
          width: titleWidth,
          lineGap: 2,
          align
        })
      : 0;

    const bodyOptions = {
      font: getFont(lang),
      fontSize: bodySize,
      width: bodyWidth - 4,
      lineGap: bodyLineGap,
      align
    };

    const maxBodyHeight = Math.max(
      120,
      getPageContentHeight(doc) - firstTitleHeight - 88
    );
    const bodyChunks = safeBody
      ? splitTextForHeight(doc, safeBody, bodyOptions, maxBodyHeight)
      : [""];

    bodyChunks.forEach((bodyChunk, index) => {
      const shouldDrawTitle = index === 0 && safeTitle;
      const titleHeight = shouldDrawTitle ? firstTitleHeight : 0;
      const bodyHeight = bodyChunk
        ? measureText(doc, bodyChunk, bodyOptions)
        : 0;

      const h = Math.max(78, Math.ceil(titleHeight + bodyHeight + 58));
      ensureSpace(doc, h + 18, labels, lang, pageState);

      const y = doc.y;
      drawPanel(doc, {
        x,
        y,
        w,
        h,
        fill,
        stroke: accent === BRAND.orange ? "#FFD2A6" : BRAND.softBorder,
        accent
      });

      if (iconFill && index === 0) {
        doc.circle(x + 28, y + 27, 8).fill(iconFill);
      }

      if (shouldDrawTitle) {
        doc.fillColor(titleColor)
          .font(getFont(lang, true))
          .fontSize(titleSize)
          .text(safeTitle, x + 44, y + 18, {
            width: titleWidth,
            align
          });
      }

      if (bodyChunk) {
        const bodyY = shouldDrawTitle ? y + 44 + titleHeight : y + 22;

        doc.fillColor(bodyColor)
          .font(getFont(lang))
          .fontSize(bodySize)
          .text(bodyChunk, x + 22, bodyY, {
            width: bodyWidth,
            align,
            lineGap: bodyLineGap
          });
      }

      doc.y = y + h + 12;
    });
  }

  doc.moveDown(0.8);

  const introHeight =
    measureText(doc, v2Labels.title, {
      font: getFont(lang, true),
      fontSize: 12.8,
      width: bodyWidth - 42,
      lineGap: 2,
      align
    }) +
    measureText(doc, bodyText, {
      font: getFont(lang),
      fontSize: 9.6,
      width: bodyWidth,
      lineGap: 3.5,
      align
    });
  const introPanelHeight = Math.max(132, Math.ceil(introHeight + 84));

  ensureSpace(doc, introPanelHeight + 14, labels, lang, pageState);

  const introY = doc.y;
  drawPanel(doc, {
    x,
    y: introY,
    w,
    h: introPanelHeight,
    fill: "#FFFFFF",
    stroke: BRAND.softBorder,
    accent: BRAND.green,
    radius: 16
  });

  doc.circle(x + 30, introY + 30, 13).fill(BRAND.lightGreen);
  doc.circle(x + 30, introY + 30, 5).fill(BRAND.green);

  doc.fillColor(BRAND.dark)
    .font(getFont(lang, true))
    .fontSize(12.8)
    .text(v2Labels.title, x + 54, introY + 18, {
      width: bodyWidth - 42,
      align
    });

  doc.fillColor(BRAND.muted)
    .font(getFont(lang, true))
    .fontSize(9)
    .text(`${v2Labels.ageBand}: ${context.ageBandLabel}`, x + 54, introY + 44, {
      width: bodyWidth - 42,
      align
    });

  doc.fillColor(BODY_TEXT_COLOR)
    .font(getFont(lang))
    .fontSize(9.6)
    .text(bodyText, x + 22, introY + 74, {
      width: bodyWidth,
      align,
      lineGap: 3.5
    });

  doc.y = introY + introPanelHeight + 12;

  if (recommendations.length) {
    addTextPanel({
      title: v2Labels.recommendations,
      body: recommendations.map((item) => `${BULLET} ${clean(item)}`).join("\n"),
      accent: BRAND.green,
      iconFill: BRAND.green
    });
  }

  if (actionPlan.length) {
    addTextPanel({
      title: v2Labels.actionPlan,
      body: actionPlan.map((item, index) => `${index + 1}. ${clean(item)}`).join("\n"),
      accent: BRAND.blue,
      fill: BRAND.lightBlue,
      iconFill: BRAND.blue
    });
  }

  if (observationText) {
    addTextPanel({
      title: v2Labels.observationFocus,
      body: observationText,
      accent: BRAND.pink,
      iconFill: BRAND.pink
    });
  }

  if (escalationText) {
    addTextPanel({
      title: v2Labels.escalationNote,
      body: escalationText,
      accent: BRAND.orange,
      fill: BRAND.lightOrange,
      titleColor: "#9A3412",
      bodyColor: "#7C2D12",
      iconFill: BRAND.orange,
      bodySize: 9.1
    });
  }

  doc.y += 2;
}

function addSectionTitle(doc, title, labels, lang, pageState = null) {
  ensureSpace(doc, PDF_SECTION_TITLE_KEEP_HEIGHT, labels, lang, pageState);

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
  if (text.length < 90 && /[:ďĽš]$/u.test(text)) return true;
  if (text === text.toUpperCase() && text.length < 120) return true;

  return false;
}

function isBulletLine(line) {
  const text = clean(line);
  if (!text) return false;
  if (/^\d{1,2}\.\s+\S/.test(text)) return false;
  return /^([*â€˘â€Ł-]\s+|[â€“â€”]\s+|\d{1,2}[)]\s+)/u.test(text);
}

function cleanBulletLine(line) {
  return clean(line)
    .replace(/^([*â€˘â€Ł-]\s+|[â€“â€”]\s+|\d{1,2}[)]\s+)/u, "")
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
    .split(/(?<=[.!?ă€‚ďĽďĽź])\s+/u)
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

function getReportHeadingMetrics(doc, heading, lang) {
  const x = 56;
  const w = doc.page.width - 112;
  const numbered = clean(heading).match(/^(\d+)\.\s*(.+)$/);
  const sectionNumber = numbered ? numbered[1] : "";
  const sectionTitle = numbered ? numbered[2] : heading;
  const accent = getSectionColor(sectionNumber || 1);
  const titleX = sectionNumber ? x + 58 : x + 20;
  const titleWidth = sectionNumber ? w - 78 : w - 40;
  const titleHeight = measureText(doc, sectionTitle, {
    font: getFont(lang, true),
    fontSize: 12.4,
    width: titleWidth,
    lineGap: 2,
    align: getTextAlign(lang)
  });
  const h = Math.max(52, Math.ceil(titleHeight + 30));

  return {
    x,
    w,
    sectionNumber,
    sectionTitle,
    accent,
    titleX,
    titleWidth,
    h
  };
}

function addReportHeading(doc, heading, labels, lang, pageState = null, keepWithHeight = 0) {
  const {
    x,
    w,
    sectionNumber,
    sectionTitle,
    accent,
    titleX,
    titleWidth,
    h
  } = getReportHeadingMetrics(doc, heading, lang);

  const requestedKeepHeight = Math.max(
    Number(keepWithHeight || 0),
    PDF_VISUAL_KEEP_WITH_BODY_HEIGHT
  );
  const keepTogetherHeight = Math.min(requestedKeepHeight, 132);
  ensureSpace(doc, h + 28 + keepTogetherHeight, labels, lang, pageState);

  const y = doc.y + 6;

  doc.roundedRect(x, y, w, h, 12).fill(BRAND.lightBlue);
  doc.roundedRect(x, y, w, h, 12).strokeColor(BRAND.softBorder).lineWidth(1).stroke();
  doc.rect(x, y, 7, h).fill(accent);

  if (sectionNumber) {
    doc.circle(x + 31, y + Math.min(30, h / 2), 15).fill(accent);
    doc.fillColor("#FFFFFF")
      .font(getFont(lang, true))
      .fontSize(10.5)
      .text(sectionNumber, x + 16, y + Math.min(23, h / 2 - 7), {
        width: 30,
        align: "center"
      });
  }

  doc.fillColor(BRAND.dark)
    .font(getFont(lang, true))
    .fontSize(12.4)
    .text(sectionTitle, titleX, y + 15, {
      width: titleWidth,
      align: getTextAlign(lang),
      lineGap: 2
    });

  doc.y = y + h + 12;
}

function estimateReportPartIntroHeight(doc, part, lang) {
  if (!part) return 0;

  if (part.type === "bullets") {
    const firstItem = (part.items || []).map((item) => clean(item)).find(Boolean);
    if (!firstItem) return 0;

    return Math.min(
      110,
      measureText(doc, firstItem, {
        font: getFont(lang),
        fontSize: lang === "zh" || lang === "ja" ? 9.8 : 10.1,
        width: doc.page.width - 148,
        align: getTextAlign(lang),
        lineGap: 3
      }) + 26
    );
  }

  if (part.type === "paragraph") {
    const firstParagraph = splitLongParagraph(part.text, lang)[0] || "";
    if (!firstParagraph) return 0;

    return Math.min(
      120,
      measureText(doc, firstParagraph, {
        font: getFont(lang),
        fontSize: lang === "zh" || lang === "ja" ? 10 : 10.4,
        width: doc.page.width - 112,
        align: getTextAlign(lang),
        lineGap: 4
      }) + 28
    );
  }

  return 0;
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
    const textOptions = {
      font: getFont(lang),
      fontSize,
      width,
      align: getTextAlign(lang),
      lineGap: 3
    };
    const chunks = splitTextForHeight(
      doc,
      item,
      textOptions,
      Math.max(100, getPageContentHeight(doc) - 32)
    );

    chunks.forEach((chunk, chunkIndex) => {
      doc.font(getFont(lang)).fontSize(fontSize);

      const height = doc.heightOfString(chunk, textOptions);

      ensureSpace(doc, height + 26, labels, lang, pageState);

      const y = doc.y + 4;

      if (chunkIndex === 0) {
        doc.circle(61, y + 4, 3.2).fill(BRAND.orange);
      }

      doc.fillColor("#374151")
        .font(getFont(lang))
        .fontSize(fontSize)
        .text(chunk, x, doc.y, textOptions);

      doc.moveDown(0.42);
    });
  });
}

function addReportParagraph(doc, paragraph, labels, lang, pageState = null) {
  const width = doc.page.width - 112;
  const fontSize = lang === "zh" || lang === "ja" ? 10 : 10.4;
  const options = {
    font: getFont(lang),
    fontSize,
    width,
    align: getTextAlign(lang),
    lineGap: 4
  };
  const chunks = splitTextForHeight(
    doc,
    splitLongParagraph(paragraph, lang).join("\n"),
    options,
    Math.max(120, getPageContentHeight(doc) - 28)
  );

  chunks.forEach((chunk) => {
    doc.font(getFont(lang)).fontSize(fontSize);

    const height = doc.heightOfString(chunk, options);
    ensureSpace(doc, height + 28, labels, lang, pageState);

    doc.fillColor("#374151")
      .font(getFont(lang))
      .fontSize(fontSize)
      .text(chunk, 56, doc.y, options);

    doc.moveDown(0.74);
  });
}

function addReportText(doc, reportText, labels, lang, pageState = null) {
  const parts = splitReportText(polishHungarianReportWording(reportText));

  let sectionCounter = 1;

  parts.forEach((part, index) => {
    if (part.type === "heading") {
      const heading = normalizeHeading(part.text, sectionCounter);
      const match = heading.match(/^(\d+)\./);
      if (match) sectionCounter = Number(match[1]) + 1;

      const nextContentPart = parts
        .slice(index + 1)
        .find((candidate) => candidate.type !== "heading");
      const keepWithHeight = estimateReportPartIntroHeight(doc, nextContentPart, lang);

      addReportHeading(doc, heading, labels, lang, pageState, keepWithHeight);
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
          Subject: `${labels.subtitle} (${PDF_REPORT_VERSION})`,
          Keywords: "NeuroMap Kids, screening report, parent report, pdf v4"
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

      addPremiumReadingGuide(doc, labels, safeLang, pageState);
      addParentQuickSummaryBlock(doc, payload, labels, safeLang, pageState);
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

