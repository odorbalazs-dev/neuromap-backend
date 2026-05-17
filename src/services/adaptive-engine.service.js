function normalize(value, max = 3) {
  return Math.max(0, Math.min(1, value / max));
}

function calculateDomainConfidence(score, itemCount = 0) {
  const normalized = normalize(score);

  const itemFactor = Math.min(1, itemCount / 25);

  return Number(
    (
      normalized * 0.7 +
      itemFactor * 0.3
    ).toFixed(3)
  );
}

function calculateOverlap(primary, secondary) {
  if (!primary || !secondary) return 0;

  return Number(
    (1 - Math.abs(primary - secondary)).toFixed(3)
  );
}

function getSeverity(score) {
  if (score >= 2.2) return "high";
  if (score >= 1.6) return "moderate";
  if (score >= 1.0) return "mild";
  return "low";
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

  const primaryConfidence = calculateDomainConfidence(
    primary?.score || 0,
    specificScoring?.totalWeight || 0
  );

  const overlap = calculateOverlap(
    primary?.score || 0,
    secondary?.score || 0
  );

  const shouldAskExtra =
    overlap >= 0.82 ||
    primaryConfidence < 0.72;

  const recommendedFocusAreas = [];

  if (overlap >= 0.82) {
    recommendedFocusAreas.push("overlap_resolution");
  }

  if (primary?.domain === "ADHD") {
    recommendedFocusAreas.push(
      "executive_function",
      "impulsivity",
      "emotional_regulation"
    );
  }

  if (primary?.domain === "ASD") {
    recommendedFocusAreas.push(
      "social_reciprocity",
      "sensory_processing",
      "flexibility"
    );
  }

  if (primary?.domain === "ANXIETY") {
    recommendedFocusAreas.push(
      "worry",
      "avoidance",
      "physical_tension"
    );
  }

  if (primary?.domain === "DEPRESSION") {
    recommendedFocusAreas.push(
      "motivation",
      "mood",
      "energy"
    );
  }

  return {
    primaryDomain: primary?.domain || null,
    secondaryDomain: secondary?.domain || null,

    primaryScore: primary?.score || 0,
    secondaryScore: secondary?.score || 0,

    severity: getSeverity(primary?.score || 0),

    confidence: primaryConfidence,

    overlapScore: overlap,

    shouldAskExtra,

    interpretation:
      overlap >= 0.82
        ? "mixed_pattern"
        : primaryConfidence >= 0.8
        ? "coherent_pattern"
        : "uncertain_pattern",

    recommendedFocusAreas
  };
}