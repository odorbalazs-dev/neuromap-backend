function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function ceilDiv(a, b) {
  if (!b) return 0;
  return Math.ceil(a / b);
}

export function buildCampaignCapacitySnapshot({
  queueSnapshot,
  workerConcurrency = 1,
  expectedJobSeconds = 90,
  targetReportsPerDay = 1000
} = {}) {
  const concurrency = Math.max(1, number(workerConcurrency, 1));
  const jobSeconds = Math.max(20, number(expectedJobSeconds, 90));
  const targetDailyReports = Math.max(1, number(targetReportsPerDay, 1000));

  const counts = queueSnapshot?.counts || {};
  const timing = queueSnapshot?.timing || {};
  const queued = number(counts.queued);
  const queuedReady = number(counts.queuedReady, queued);
  const queuedDelayed = number(counts.queuedDelayed);
  const processing = number(counts.processing);
  const active = queued + processing;

  const reportsPerHourPerWorker = 3600 / jobSeconds;
  const estimatedReportsPerHour = Math.floor(concurrency * reportsPerHourPerWorker);
  const targetReportsPerHour = Math.ceil(targetDailyReports / 24);
  const recommendedConcurrency = Math.max(
    1,
    ceilDiv(targetReportsPerHour, reportsPerHourPerWorker)
  );
  const recommendedBurstConcurrency = Math.max(
    recommendedConcurrency,
    Math.ceil(recommendedConcurrency * 1.25)
  );

  const estimatedDrainMinutes =
    queuedReady > 0
      ? Math.ceil((queuedReady * jobSeconds) / concurrency / 60)
      : 0;

  let level = "healthy";
  if (queuedDelayed > 0 || timing.oldestQueuedAgeSeconds >= 1800 || queuedReady >= targetReportsPerHour) {
    level = "warning";
  }
  if (
    timing.oldestQueuedAgeSeconds >= 3600 ||
    queuedReady >= targetReportsPerHour * 2 ||
    number(counts.failed24h) >= Math.max(5, Math.ceil(targetReportsPerHour * 0.05))
  ) {
    level = "critical";
  }

  const recommendations = [];

  if (concurrency < recommendedConcurrency) {
    recommendations.push(
      `A napi ${targetDailyReports} riportos kampanycelhoz legalabb ${recommendedConcurrency} WORKER_CONCURRENCY javasolt. Kampanyinditasnal ${recommendedBurstConcurrency} erosebb biztonsagi tartalek.`
    );
  }

  if (estimatedDrainMinutes > 20) {
    recommendations.push(
      `A jelenlegi azonnal feldolgozhato sor kb. ${estimatedDrainMinutes} perc alatt urulhet ki a mostani worker beallitassal.`
    );
  }

  if (queuedDelayed > 0) {
    recommendations.push(
      `${queuedDelayed} job kesleltetett ujraprobalkozasra var; ez altalaban kulso szolgaltatoi lassulas vagy atmeneti hiba jele.`
    );
  }

  if (active === 0) {
    recommendations.push("A feldolgozasi sor ures; kampanyinditaskor figyeld a kapacitas panelt.");
  }

  return {
    level,
    workerConcurrency: concurrency,
    expectedJobSeconds: jobSeconds,
    targetReportsPerDay: targetDailyReports,
    targetReportsPerHour,
    estimatedReportsPerHour,
    recommendedConcurrency,
    recommendedBurstConcurrency,
    estimatedDrainMinutes,
    activeJobs: active,
    queuedReady,
    queuedDelayed,
    failed24h: number(counts.failed24h),
    nextRetryAt: timing.nextRetryAt || null,
    recommendations
  };
}
