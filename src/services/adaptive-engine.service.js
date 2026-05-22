function normalize(value, max = 3) {
  return Math.max(0, Math.min(1, value / max));
}

const DOMAIN_FOCUS_AREAS = {
  ADHD: [
    "inattention",
    "executive",
    "impulsivity",
    "emotional",
    "hyperactivity"
  ],
  ASD: [
    "social_reciprocity",
    "nonverbal_communication",
    "relationships",
    "flexibility",
    "sensory_processing",
    "restricted_patterns",
    "pragmatic_language"
  ],
  ANXIETY: [
    "general_worry",
    "intolerance_of_uncertainty",
    "physical_arousal",
    "avoidance_safety",
    "reassurance_control",
    "social_evaluative_anxiety",
    "restlessness_tension",
    "concentration_sleep"
  ],
  DEPRESSION: [
    "low_mood",
    "anhedonia_interest_loss",
    "energy_fatigue",
    "self_worth_guilt",
    "hopelessness_future",
    "withdrawal_isolation",
    "sleep_change",
    "concentration_decision"
  ],
  LEARNING: [
    "attention_focus",
    "working_memory",
    "processing_speed",
    "executive_function",
    "organization_time_management",
    "comprehension_language",
    "self_monitoring_error_awareness",
    "academic_expression_output"
  ]
};

function round(value, digits = 3) {
  return Number(Number(value || 0).toFixed(digits));
}

function calculateDomainConfidence(score, itemCount = 0, scoreGap = 0) {
  const normalized = normalize(score);
  const itemFactor = Math.min(1, itemCount / 25);
  const gapFactor = Math.min(1, Math.max(0, scoreGap) / 0.8);

  return round(
    normalized * 0.55 +
    itemFactor * 0.25 +
    gapFactor * 0.2
  );
}

function calculateOverlap(primary, secondary) {
  if (!primary || !secondary) return 0;

  return round(Math.max(0, 1 - Math.abs(primary - secondary)));
}

function calculateScoreGap(primary, secondary) {
  if (!primary || !secondary) return 0;
  return round(Math.max(0, primary - secondary));
}

function getSeverity(score) {
  if (score >= 2.2) return "high";
  if (score >= 1.6) return "moderate";
  if (score >= 1.0) return "mild";
  return "low";
}

function getInterpretation({ severity, overlap, confidence, scoreGap }) {
  if (severity === "low") return "low_signal";
  if (overlap >= 0.82 && scoreGap < 0.35) return "mixed_pattern";
  if (confidence >= 0.78 && scoreGap >= 0.35) return "coherent_pattern";
  return "uncertain_pattern";
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function getRecommendedFocusAreas(primaryDomain, secondaryDomain, interpretation) {
  const primaryAreas = DOMAIN_FOCUS_AREAS[primaryDomain] || [];
  const secondaryAreas = DOMAIN_FOCUS_AREAS[secondaryDomain] || [];

  if (interpretation === "mixed_pattern") {
    return unique([
      "overlap_resolution",
      ...primaryAreas.slice(0, 4),
      ...secondaryAreas.slice(0, 3)
    ]);
  }

  if (interpretation === "uncertain_pattern") {
    return unique([
      ...primaryAreas.slice(0, 5),
      ...secondaryAreas.slice(0, 2)
    ]);
  }

  return primaryAreas;
}

function hashSeed(seed = "neuromap") {
  return [...String(seed)].reduce((hash, char) => {
    return ((hash << 5) - hash + char.charCodeAt(0)) >>> 0;
  }, 2166136261);
}

function seededRandom(seed) {
  let state = hashSeed(seed) || 1;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffle(items, seed) {
  const random = seededRandom(seed);
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = item?.[key] || "unknown";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function getSubdomainTarget(bank, subdomain, count) {
  const total = bank.length || 1;
  const available = bank.filter((item) => item.subdomain === subdomain).length;
  return Math.max(1, Math.round((available / total) * count));
}

function scoreCandidate(item, selected, bank, options) {
  const {
    count,
    focusSubdomains,
    maxPerStem,
    targetReverseRatio,
    avoidStemKeys
  } = options;

  const subdomainCounts = countBy(selected, "subdomain");
  const stemCounts = countBy(selected, "stemKey");
  const reverseCount = selected.filter((q) => q.reverse).length;
  const targetSubdomainCount = getSubdomainTarget(bank, item.subdomain, count);
  const currentSubdomainCount = subdomainCounts[item.subdomain] || 0;
  const currentStemCount = stemCounts[item.stemKey] || 0;
  const currentReverseRatio = selected.length ? reverseCount / selected.length : 0;

  let score = Number(item.weight || 1) * 10;

  if (focusSubdomains.includes(item.subdomain)) score += 18;
  if (currentSubdomainCount < targetSubdomainCount) score += 16;
  if (currentSubdomainCount === 0) score += 10;
  if (item.reverse && currentReverseRatio < targetReverseRatio) score += 8;
  if (!item.reverse && currentReverseRatio > targetReverseRatio) score += 4;

  score -= currentSubdomainCount * 5;
  score -= currentStemCount * 22;

  if (currentStemCount >= maxPerStem) score -= 120;
  if (avoidStemKeys.includes(item.stemKey)) score -= 90;

  return score;
}

export function pickBalancedSpecificQuestions(
  bank = [],
  {
    count = 30,
    seed = "neuromap",
    focusSubdomains = [],
    avoidStemKeys = [],
    maxPerStem = 1,
    targetReverseRatio = 0.2
  } = {}
) {
  if (!Array.isArray(bank) || bank.length === 0 || count <= 0) return [];

  const requestedCount = Math.min(count, bank.length);
  const selected = [];
  const selectedIds = new Set();
  const randomizedBank = shuffle(bank, seed);

  while (selected.length < requestedCount) {
    const candidates = randomizedBank.filter((item) => !selectedIds.has(item.id));
    if (candidates.length === 0) break;

    const relaxedMaxPerStem =
      selected.length < Math.min(requestedCount, Object.keys(countBy(bank, "stemKey")).length)
        ? maxPerStem
        : Math.max(maxPerStem, 2);

    candidates.sort((a, b) => {
      const bScore = scoreCandidate(b, selected, bank, {
        count: requestedCount,
        focusSubdomains,
        avoidStemKeys,
        maxPerStem: relaxedMaxPerStem,
        targetReverseRatio
      });
      const aScore = scoreCandidate(a, selected, bank, {
        count: requestedCount,
        focusSubdomains,
        avoidStemKeys,
        maxPerStem: relaxedMaxPerStem,
        targetReverseRatio
      });

      return bScore - aScore;
    });

    const next = candidates[0];
    selected.push(next);
    selectedIds.add(next.id);
  }

  return selected;
}

export function analyzeAdaptiveState({
  triageScores = {},
  specificProfile = null,
  specificScoring = null
}) {
  const entries = Object.entries(triageScores || {})
    .map(([domain, score]) => ({
      domain,
      score: Number(score || 0)
    }))
    .sort((a, b) => b.score - a.score);

  const primary = entries[0] || null;
  const secondary = entries[1] || null;
  const scoreGap = calculateScoreGap(primary?.score || 0, secondary?.score || 0);

  const primaryConfidence = calculateDomainConfidence(
    primary?.score || 0,
    specificScoring?.totalWeight || 0,
    scoreGap
  );

  const overlap = calculateOverlap(
    primary?.score || 0,
    secondary?.score || 0
  );

  const severity = getSeverity(primary?.score || 0);
  const interpretation = getInterpretation({
    severity,
    overlap,
    confidence: primaryConfidence,
    scoreGap
  });

  const shouldAskExtra =
    severity !== "low" &&
    (
      interpretation === "mixed_pattern" ||
      primaryConfidence < 0.68
    );

  const recommendedFocusAreas = getRecommendedFocusAreas(
    primary?.domain,
    secondary?.domain,
    interpretation
  );

  return {
    primaryDomain: primary?.domain || null,
    secondaryDomain: secondary?.domain || null,
    rankedDomains: entries,

    primaryScore: primary?.score || 0,
    secondaryScore: secondary?.score || 0,
    scoreGap,

    severity,

    confidence: primaryConfidence,

    overlapScore: overlap,

    shouldAskExtra,
    extraQuestionPlan: {
      count: shouldAskExtra ? 5 : 0,
      reason: shouldAskExtra ? interpretation : null,
      primaryDomain: primary?.domain || null,
      secondaryDomain: secondary?.domain || null,
      focusSubdomains: recommendedFocusAreas.filter(
        (area) => area !== "overlap_resolution"
      )
    },

    interpretation,

    recommendedFocusAreas
  };
}
