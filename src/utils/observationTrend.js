function toDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export function buildObservationTrend(entries = []) {
  const normalized = entries
    .map((entry) => ({
      entryDate: toDateKey(entry.entry_date || entry.entryDate),
      context: String(entry.context || "other"),
      signalLevel: Number(entry.signal_level ?? entry.signalLevel),
      strategyUsed: Boolean(entry.strategy_used ?? entry.strategyUsed)
    }))
    .filter((entry) => entry.entryDate && Number.isFinite(entry.signalLevel))
    .sort((a, b) => a.entryDate.localeCompare(b.entryDate));

  const average = (items) => {
    if (!items.length) return null;
    return items.reduce((sum, item) => sum + item.signalLevel, 0) / items.length;
  };

  const midpoint = Math.max(1, Math.ceil(normalized.length / 2));
  const firstHalf = normalized.slice(0, midpoint);
  const secondHalf = normalized.slice(midpoint);
  const earlyAverage = average(firstHalf);
  const recentAverage = average(secondHalf.length ? secondHalf : firstHalf);
  const delta = earlyAverage === null || recentAverage === null
    ? null
    : Number((recentAverage - earlyAverage).toFixed(2));

  let direction = "insufficient_data";
  if (normalized.length >= 4) {
    direction = delta <= -0.35 ? "improving" : delta >= 0.35 ? "increasing" : "stable";
  }

  const contexts = {};
  normalized.forEach((entry) => {
    const current = contexts[entry.context] || { count: 0, total: 0 };
    current.count += 1;
    current.total += entry.signalLevel;
    contexts[entry.context] = current;
  });

  const contextSummary = Object.fromEntries(
    Object.entries(contexts).map(([key, value]) => [
      key,
      {
        count: value.count,
        average: Number((value.total / value.count).toFixed(2))
      }
    ])
  );

  const strategyCount = normalized.filter((entry) => entry.strategyUsed).length;

  return {
    entryCount: normalized.length,
    completedDays: [...new Set(normalized.map((entry) => entry.entryDate))].length,
    earlyAverage: earlyAverage === null ? null : Number(earlyAverage.toFixed(2)),
    recentAverage: recentAverage === null ? null : Number(recentAverage.toFixed(2)),
    delta,
    direction,
    strategyUseRate: normalized.length
      ? Number((strategyCount / normalized.length).toFixed(2))
      : 0,
    contexts: contextSummary
  };
}
