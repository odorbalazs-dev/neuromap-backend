/*
  Webflow Engine embed patch.

  Replace the current pickBalancedSpecificQuestions(bank, count = 30)
  function in the Webflow Engine embed with this function.

  It uses window.NM_ADAPTIVE_ENGINE from public/banks/all-banks.bundle.js.
  The all-banks embed must load before the Engine embed.
*/

function pickBalancedSpecificQuestions(bank, count = 30) {
  const browserEngine = window.NM_ADAPTIVE_ENGINE;

  if (
    browserEngine &&
    typeof browserEngine.pickBalancedSpecificQuestions === "function"
  ) {
    const interpretation = state.needsExtra
      ? "mixed_pattern"
      : "coherent_pattern";

    const focusSubdomains =
      typeof browserEngine.getRecommendedFocusAreas === "function"
        ? browserEngine.getRecommendedFocusAreas(
            state.detectedRisk,
            state.secondaryRisk,
            interpretation
          )
        : [];

    const seedParts = [
      "specific",
      state.lang || "hu",
      state.detectedRisk || "unknown",
      state.secondaryRisk || "none",
      (state.triageAnswers || []).join("-")
    ];

    return browserEngine.pickBalancedSpecificQuestions(bank, {
      count,
      seed: seedParts.join(":"),
      focusSubdomains,
      avoidStemKeys: [],
      maxPerStem: 1,
      targetReverseRatio: 0.2
    }).map((question) => {
      if (question.stemKey) return question;

      return Object.assign({}, question, {
        stemKey:
          typeof browserEngine.inferStemKey === "function"
            ? browserEngine.inferStemKey(question)
            : inferStemKey(question)
      });
    });
  }

  if (!Array.isArray(bank) || bank.length === 0) return [];

  const bySubdomain = {};

  bank.forEach((q) => {
    const key = q.subdomain || "general";
    if (!bySubdomain[key]) bySubdomain[key] = [];
    bySubdomain[key].push(q);
  });

  const subdomains = Object.keys(bySubdomain);

  if (subdomains.length === 0) {
    return shuffle(bank).slice(0, Math.min(count, bank.length));
  }

  function diversifyPool(pool, targetCount) {
    const shuffled = shuffle(pool).sort(
      (a, b) => Number(b.weight || 1) - Number(a.weight || 1)
    );

    const selected = [];
    const usedStemKeys = new Set();
    let reverseCount = 0;

    for (const item of shuffled) {
      if (selected.length >= targetCount) break;

      const stemKey = inferStemKey(item);
      const isReverse = !!item.reverse;

      if (usedStemKeys.has(stemKey)) continue;
      if (isReverse && reverseCount >= Math.max(1, Math.floor(targetCount * 0.25))) continue;

      selected.push(Object.assign({}, item, { stemKey }));
      usedStemKeys.add(stemKey);
      if (isReverse) reverseCount += 1;
    }

    if (selected.length < targetCount) {
      for (const item of shuffled) {
        if (selected.length >= targetCount) break;
        if (selected.some((s) => s.id === item.id)) continue;
        selected.push(Object.assign({}, item, { stemKey: inferStemKey(item) }));
      }
    }

    return selected.slice(0, targetCount);
  }

  const perSubdomain = Math.floor(count / subdomains.length);
  let remainder = count % subdomains.length;
  let selected = [];

  for (const subdomain of subdomains) {
    const pool = bySubdomain[subdomain] || [];
    const picked = diversifyPool(pool, perSubdomain);
    selected.push(...picked);
  }

  if (remainder > 0) {
    const alreadySelectedIds = new Set(selected.map((q) => q.id));

    const leftovers = subdomains.flatMap((subdomain) => {
      return (bySubdomain[subdomain] || []).filter((q) => !alreadySelectedIds.has(q.id));
    });

    const extraPicked = diversifyPool(leftovers, remainder);
    selected.push(...extraPicked);
  }

  if (selected.length < count) {
    const alreadySelectedIds = new Set(selected.map((q) => q.id));
    const remaining = bank.filter((q) => !alreadySelectedIds.has(q.id));
    selected.push(...shuffle(remaining).slice(0, count - selected.length));
  }

  return shuffle(selected).slice(0, Math.min(count, selected.length));
}
