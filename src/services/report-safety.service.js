// Narrow regression guards, not a substitute for a clinical or linguistic review.
const UNSUPPORTED_CERTAINTY = {
  hu: /gyermek\s+(?:teljesen egészséges|nem mutat (?:olyan )?viselkedésmintákat)|autizmus[^.\n]{0,180}nem tűn(?:ik|nek) relevánsnak/iu,
  en: /child\s+(?:is (?:completely|entirely) healthy|does not (?:show|exhibit) (?:any |such )?behavio(?:u)?ral patterns)/iu,
  de: /kind\s+(?:ist vollkommen gesund|zeigt keine (?:solchen )?verhaltensmuster)/iu,
  it: /bambino\s+(?:è completamente sano|non mostra (?:tali )?modelli comportamentali)/iu,
  es: /niño\s+(?:está completamente sano|no muestra (?:tales )?patrones de comportamiento)/iu,
  fr: /enfant\s+(?:est en parfaite santé|ne présente (?:aucun|pas de tels) schémas comportementaux)/iu,
  pt: /criança\s+(?:está completamente saudável|não apresenta (?:tais )?padrões comportamentais)/iu,
  pl: /dziecko\s+(?:jest całkowicie zdrowe|nie wykazuje (?:takich )?wzorców zachowania)/iu,
  zh: /孩子(?:完全健康|没有表现出(?:这些|这样的)?行为模式)/u,
  ja: /子どもは(?:完全に健康です|そのような行動パターンを示していません)/u,
  ar: /الطفل\s+(?:سليم تمامًا|لا يُظهر مثل هذه الأنماط السلوكية)/u
};

export function getReportSafetyRequirements(lang) {
  return [{
    label: `unsupported categorical conclusions in ${lang}`,
    pattern: UNSUPPORTED_CERTAINTY[lang] || UNSUPPORTED_CERTAINTY.en
  }];
}
