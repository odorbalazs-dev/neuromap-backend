import { TRIAGE_BANK } from "./triage.bank.js";
import { ADHD_BANK } from "./adhd.bank.js";
import { ASD_BANK } from "./asd.bank.js";
import { ANXIETY_BANK } from "./anxiety.bank.js";
import { DEPRESSION_BANK } from "./depression.bank.js";
import { LEARNING_BANK } from "./learning.bank.js";

function makeExtraQuestion(domain, index) {
  const labels = {
    ADHD: {
      hu: `ADHD kiegészítő kérdés ${index}: ez a figyelmi vagy impulzivitási minta mennyire következetes különböző helyzetekben?`,
      en: `ADHD extra question ${index}: how consistent is this attention or impulsivity pattern across situations?`,
      de: `ADHS-Zusatzfrage ${index}: Wie konsistent ist dieses Aufmerksamkeits- oder Impulsivitätsmuster in verschiedenen Situationen?`,
      it: `Domanda aggiuntiva ADHD ${index}: quanto è coerente questo schema di attenzione o impulsività in situazioni diverse?`,
      es: `Pregunta adicional TDAH ${index}: ¿qué tan consistente es este patrón de atención o impulsividad en distintas situaciones?`,
      zh: `ADHD 补充问题 ${index}：这种注意力或冲动模式在不同情境中有多一致？`,
      ja: `ADHD 追加質問 ${index}：この注意や衝動性の傾向は異なる場面でもどの程度一貫していますか？`,
      ar: `سؤال إضافي ADHD رقم ${index}: ما مدى ثبات هذا النمط المتعلق بالانتباه أو الاندفاع عبر المواقف المختلفة؟`,
      pl: `Dodatkowe pytanie ADHD ${index}: na ile spójny jest ten wzorzec uwagi lub impulsywności w różnych sytuacjach?`,
      pt: `Pergunta extra TDAH ${index}: quão consistente é esse padrão de atenção ou impulsividade em diferentes situações?`,
      fr: `Question supplémentaire TDAH ${index} : dans quelle mesure ce schéma d'attention ou d'impulsivité est-il cohérent selon les situations ?`
    },
    ASD: {
      hu: `ASD kiegészítő kérdés ${index}: ez a társas vagy rugalmatlansági minta mennyire következetes különböző helyzetekben?`,
      en: `ASD extra question ${index}: how consistent is this social or flexibility-related pattern across situations?`,
      de: `ASD-Zusatzfrage ${index}: Wie konsistent ist dieses soziale oder flexibilitätsbezogene Muster in verschiedenen Situationen?`,
      it: `Domanda aggiuntiva ASD ${index}: quanto è coerente questo schema sociale o legato alla flessibilità in situazioni diverse?`,
      es: `Pregunta adicional TEA ${index}: ¿qué tan consistente es este patrón social o de flexibilidad en distintas situaciones?`,
      zh: `ASD 补充问题 ${index}：这种社交或灵活性相关模式在不同情境中有多一致？`,
      ja: `ASD 追加質問 ${index}：この社会性または柔軟性に関する傾向は異なる場面でもどの程度一貫していますか？`,
      ar: `سؤال إضافي ASD رقم ${index}: ما مدى ثبات هذا النمط الاجتماعي أو المرتبط بالمرونة عبر المواقف المختلفة؟`,
      pl: `Dodatkowe pytanie ASD ${index}: na ile spójny jest ten wzorzec społeczny lub związany z elastycznością w różnych sytuacjach?`,
      pt: `Pergunta extra TEA ${index}: quão consistente é esse padrão social ou de flexibilidade em diferentes situações?`,
      fr: `Question supplémentaire TSA ${index} : dans quelle mesure ce schéma social ou lié à la flexibilité est-il cohérent selon les situations ?`
    },
    ANXIETY: {
      hu: `Szorongás kiegészítő kérdés ${index}: ez az aggodalmi vagy elkerülő minta mennyire következetes különböző helyzetekben?`,
      en: `Anxiety extra question ${index}: how consistent is this worry or avoidance pattern across situations?`,
      de: `Angst-Zusatzfrage ${index}: Wie konsistent ist dieses Sorgen- oder Vermeidungsmuster in verschiedenen Situationen?`,
      it: `Domanda aggiuntiva ansia ${index}: quanto è coerente questo schema di preoccupazione o evitamento in situazioni diverse?`,
      es: `Pregunta adicional ansiedad ${index}: ¿qué tan consistente es este patrón de preocupación o evitación en distintas situaciones?`,
      zh: `焦虑补充问题 ${index}：这种担忧或回避模式在不同情境中有多一致？`,
      ja: `不安 追加質問 ${index}：この心配や回避の傾向は異なる場面でもどの程度一貫していますか？`,
      ar: `سؤال إضافي للقلق رقم ${index}: ما مدى ثبات نمط القلق أو التجنب هذا عبر المواقف المختلفة؟`,
      pl: `Dodatkowe pytanie lękowe ${index}: na ile spójny jest ten wzorzec zamartwiania się lub unikania w różnych sytuacjach?`,
      pt: `Pergunta extra ansiedade ${index}: quão consistente é esse padrão de preocupação ou evitação em diferentes situações?`,
      fr: `Question supplémentaire anxiété ${index} : dans quelle mesure ce schéma d'inquiétude ou d'évitement est-il cohérent selon les situations ?`
    },
    DEPRESSION: {
      hu: `Depresszió kiegészítő kérdés ${index}: ez a hangulati vagy motivációs minta mennyire következetes különböző helyzetekben?`,
      en: `Depression extra question ${index}: how consistent is this mood or motivation pattern across situations?`,
      de: `Depressions-Zusatzfrage ${index}: Wie konsistent ist dieses Stimmungs- oder Motivationsmuster in verschiedenen Situationen?`,
      it: `Domanda aggiuntiva depressione ${index}: quanto è coerente questo schema dell'umore o della motivazione in situazioni diverse?`,
      es: `Pregunta adicional depresión ${index}: ¿qué tan consistente es este patrón de ánimo o motivación en distintas situaciones?`,
      zh: `抑郁补充问题 ${index}：这种情绪或动机模式在不同情境中有多一致？`,
      ja: `抑うつ 追加質問 ${index}：この気分や意欲の傾向は異なる場面でもどの程度一貫していますか？`,
      ar: `سؤال إضافي للاكتئاب رقم ${index}: ما مدى ثبات هذا النمط المزاجي أو التحفيزي عبر المواقف المختلفة؟`,
      pl: `Dodatkowe pytanie depresyjne ${index}: na ile spójny jest ten wzorzec nastroju lub motywacji w różnych sytuacjach?`,
      pt: `Pergunta extra depressão ${index}: quão consistente é esse padrão de humor ou motivação em diferentes situações?`,
      fr: `Question supplémentaire dépression ${index} : dans quelle mesure ce schéma d'humeur ou de motivation est-il cohérent selon les situations ?`
    },
    LEARNING: {
      hu: `Tanulási zavar kiegészítő kérdés ${index}: ez a tanulási nehézség mennyire következetes különböző feladatokban és helyzetekben?`,
      en: `Learning disorder extra question ${index}: how consistent is this learning difficulty across different tasks and situations?`,
      de: `Lernstörungs-Zusatzfrage ${index}: Wie konsistent ist diese Lernschwierigkeit in verschiedenen Aufgaben und Situationen?`,
      it: `Domanda aggiuntiva disturbo dell'apprendimento ${index}: quanto è coerente questa difficoltà di apprendimento in compiti e situazioni diverse?`,
      es: `Pregunta adicional trastorno del aprendizaje ${index}: ¿qué tan consistente es esta dificultad de aprendizaje en distintas tareas y situaciones?`,
      zh: `学习障碍补充问题 ${index}：这种学习困难在不同任务和情境中有多一致？`,
      ja: `学習障害 追加質問 ${index}：この学習の難しさは異なる課題や場面でもどの程度一貫していますか？`,
      ar: `سؤال إضافي لصعوبات التعلم رقم ${index}: ما مدى ثبات هذه الصعوبة التعليمية عبر المهام والمواقف المختلفة؟`,
      pl: `Dodatkowe pytanie o trudności w uczeniu się ${index}: na ile spójna jest ta trudność w różnych zadaniach i sytuacjach?`,
      pt: `Pergunta extra transtorno de aprendizagem ${index}: quão consistente é essa dificuldade de aprendizagem em diferentes tarefas e situações?`,
      fr: `Question supplémentaire troubles des apprentissages ${index} : dans quelle mesure cette difficulté d'apprentissage est-elle cohérente selon les tâches et les situations ?`
    }
  };

  return {
    id: `${domain.toLowerCase()}_extra_${index}`,
    domain,
    subdomain: "extra",
    weight: 1,
    text: labels[domain]
  };
}

function makeExtraBank(domain) {
  return Array.from({ length: 5 }, (_, i) => makeExtraQuestion(domain, i + 1));
}

const SPECIFIC_BANKS = {
  ADHD: ADHD_BANK,
  ASD: ASD_BANK,
  ANXIETY: ANXIETY_BANK,
  DEPRESSION: DEPRESSION_BANK,
  LEARNING: LEARNING_BANK
};

const EXTRA_BANKS = {
  ADHD: makeExtraBank("ADHD"),
  ASD: makeExtraBank("ASD"),
  ANXIETY: makeExtraBank("ANXIETY"),
  DEPRESSION: makeExtraBank("DEPRESSION"),
  LEARNING: makeExtraBank("LEARNING")
};

if (typeof window !== "undefined") {
  window.NM_TRIAGE_BANK = TRIAGE_BANK;
  window.NM_SPECIFIC_BANK = SPECIFIC_BANKS;
  window.NM_EXTRA_BANK = EXTRA_BANKS;
}

export {
  TRIAGE_BANK,
  SPECIFIC_BANKS,
  EXTRA_BANKS
};