function clamp(value, min = 0, max = 1) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return min;
  return Math.max(min, Math.min(max, numeric));
}

function normalize(value, max = 3) {
  return clamp(Number(value || 0) / max);
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

const DOMAINS = Object.keys(DOMAIN_FOCUS_AREAS);

function round(value, digits = 3) {
  return Number(Number(value || 0).toFixed(digits));
}

function normalizeSignalScore(score) {
  const numeric = Number(score || 0);
  if (!Number.isFinite(numeric)) return 0;

  // Frontend triage raw sums are 5 items x 0..3. Convert those to the same 0..3
  // signal scale as weightedSignal/average before making backend decisions.
  const normalized = numeric > 3 ? numeric / 5 : numeric;
  return round(clamp(normalized, 0, 3));
}

function getConfidenceLabel(confidence) {
  if (confidence >= 0.78) return "high";
  if (confidence >= 0.62) return "medium";
  return "low";
}

function calculateSpecificCoherence(specificScoring = null) {
  const subdomains = specificScoring?.subdomains || {};
  const values = Object.values(subdomains)
    .map((item) => Number(item?.average || 0))
    .filter((value) => Number.isFinite(value));

  if (!values.length) {
    return {
      score: 0.5,
      label: "not_available",
      topAverage: 0,
      spread: 0,
      subdomainCount: 0
    };
  }

  const sorted = [...values].sort((a, b) => b - a);
  const topAverage = sorted.slice(0, Math.min(3, sorted.length))
    .reduce((sum, value) => sum + value, 0) / Math.min(3, sorted.length);
  const spread = sorted[0] - sorted[sorted.length - 1];

  let score = 0.58;
  let label = "mixed";

  if (topAverage < 0.8) {
    score = 0.4;
    label = "weak";
  } else if (spread >= 1.1) {
    score = 0.72;
    label = "spiky";
  } else if (topAverage >= 1.4 && spread <= 0.7) {
    score = 0.82;
    label = "coherent";
  }

  return {
    score: round(score),
    label,
    topAverage: round(topAverage),
    spread: round(spread),
    subdomainCount: values.length
  };
}

function calculateDomainConfidence(
  score,
  itemCount = 0,
  scoreGap = 0,
  {
    scoreSource = "triageScores.normalizedRaw",
    specificCoherence = 0.5
  } = {}
) {
  const normalized = normalize(score);
  const itemFactor = Math.min(1, itemCount / 25);
  const gapFactor = Math.min(1, Math.max(0, scoreGap) / 0.8);
  const sourceFactor = scoreSource === "triageRanking.weightedSignal" ? 1 : 0.8;
  const coherenceFactor = clamp(specificCoherence);

  return round(
    normalized * 0.44 +
    itemFactor * 0.18 +
    gapFactor * 0.2 +
    sourceFactor * 0.1 +
    coherenceFactor * 0.08
  );
}

function calculateOverlap(primary, secondary) {
  if (!primary || !secondary) return 0;

  return round(Math.max(0, 1 - Math.abs(primary - secondary) / 1.2));
}

function calculateScoreGap(primary, secondary) {
  if (!primary || !secondary) return 0;
  return round(Math.max(0, primary - secondary));
}

function getSeverity(score) {
  if (score >= 2.2) return "high";
  if (score >= 1.4) return "moderate";
  if (score >= 0.8) return "mild";
  return "low";
}

function getInterpretation({ severity, overlap, confidence, scoreGap }) {
  if (severity === "low") return "low_signal";
  if (overlap >= 0.82 && scoreGap < 0.35) return "mixed_pattern";
  if (confidence >= 0.78 && scoreGap >= 0.35) return "coherent_pattern";
  return "uncertain_pattern";
}

function getPatternType({ severity, overlap, confidence, scoreGap }) {
  if (severity === "low") return "weak_signal";
  if (overlap >= 0.82 && scoreGap < 0.35) return "overlap_pattern";
  if (confidence >= 0.78 && scoreGap >= 0.35) return "clear_pattern";
  return "needs_observation";
}

function getDecisionQuality({ severity, confidence, scoreGap, specificCoherence }) {
  if (severity === "low") return "low";
  if (confidence >= 0.78 && scoreGap >= 0.35) return "high";
  if (confidence >= 0.62 || specificCoherence?.score >= 0.72) return "medium";
  return "low";
}

function buildRankedDomainEntries({ triageScores = {}, triageRanking = [] } = {}) {
  if (Array.isArray(triageRanking) && triageRanking.length) {
    const entries = triageRanking
      .filter((item) => DOMAINS.includes(item?.domain))
      .map((item) => {
        const score = normalizeSignalScore(
          item.weightedSignal ?? item.score ?? item.average ?? item.raw
        );

        return {
          domain: item.domain,
          score,
          weightedSignal: score,
          raw: Number(item.raw || 0),
          average: normalizeSignalScore(item.average ?? score),
          strongestSubdomain: normalizeSignalScore(item.strongestSubdomain ?? 0),
          consistency: round(clamp(item.consistency ?? 0))
        };
      })
      .sort((a, b) => b.score - a.score);

    if (entries.length) {
      return {
        entries,
        scoreSource: "triageRanking.weightedSignal"
      };
    }
  }

  return {
    entries: DOMAINS.map((domain) => {
      const score = normalizeSignalScore(triageScores?.[domain]);
      return {
        domain,
        score,
        weightedSignal: score,
        raw: Number(triageScores?.[domain] || 0),
        average: score,
        strongestSubdomain: 0,
        consistency: 0
      };
    }).sort((a, b) => b.score - a.score),
    scoreSource: "triageScores.normalizedRaw"
  };
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
    avoidStemKeys = []
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

  // Safety items are distinct from ordinary profile items. Include them in
  // every relevant module so a concerning answer never depends on random
  // selection and can trigger immediate, non-paywalled support guidance.
  randomizedBank
    .filter((item) => item?.safetySignal === true)
    .slice(0, requestedCount)
    .forEach((item) => {
      selected.push(item);
      selectedIds.add(item.id);
    });

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
  triageRanking = [],
  specificProfile = null,
  specificScoring = null
} = {}) {
  const { entries, scoreSource } = buildRankedDomainEntries({
    triageScores,
    triageRanking
  });

  const primary = entries[0] || null;
  const secondary = entries[1] || null;
  const scoreGap = calculateScoreGap(primary?.score || 0, secondary?.score || 0);
  const specificCoherence = calculateSpecificCoherence(specificScoring || specificProfile);

  const primaryConfidence = calculateDomainConfidence(
    primary?.score || 0,
    specificScoring?.totalWeight || 0,
    scoreGap,
    {
      scoreSource,
      specificCoherence: specificCoherence.score
    }
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
  const patternType = getPatternType({
    severity,
    overlap,
    confidence: primaryConfidence,
    scoreGap
  });
  const decisionQuality = getDecisionQuality({
    severity,
    confidence: primaryConfidence,
    scoreGap,
    specificCoherence
  });

  const shouldAskExtra =
    severity !== "low" &&
    (
      interpretation === "mixed_pattern" ||
      patternType === "needs_observation" ||
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
    confidenceLabel: getConfidenceLabel(primaryConfidence),

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
    patternType,
    decisionQuality,

    evidence: {
      scoreSource,
      primaryScoreNormalized: primary?.score || 0,
      secondaryScoreNormalized: secondary?.score || 0,
      scoreGap,
      overlapScore: overlap,
      specificCoherence,
      hasSpecificScoring: !!specificScoring
    },

    recommendedFocusAreas
  };
}
