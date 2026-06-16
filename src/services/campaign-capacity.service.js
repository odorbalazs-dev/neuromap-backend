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
  const processing = number(counts.processing);
  const active = queued + processing;

  const reportsPerHourPerWorker = 3600 / jobSeconds;
  const estimatedReportsPerHour = Math.floor(concurrency * reportsPerHourPerWorker);
  const targetReportsPerHour = Math.ceil(targetDailyReports / 24);
  const recommendedConcurrency = Math.max(
    1,
    ceilDiv(targetReportsPerHour, reportsPerHourPerWorker)
  );

  const estimatedDrainMinutes =
    queued > 0
      ? Math.ceil((queued * jobSeconds) / concurrency / 60)
      : 0;

  let level = "healthy";
  if (timing.oldestQueuedAgeSeconds >= 1800 || queued >= targetReportsPerHour) {
    level = "warning";
  }
  if (timing.oldestQueuedAgeSeconds >= 3600 || queued >= targetReportsPerHour * 2) {
    level = "critical";
  }

  const recommendations = [];

  if (concurrency < recommendedConcurrency) {
    recommendations.push(
      `A napi ${targetDailyReports} riportos kampanycelhoz legalabb ${recommendedConcurrency} WORKER_CONCURRENCY javasolt.`
    );
  }

  if (estimatedDrainMinutes > 20) {
    recommendations.push(
      `A jelenlegi varakozo sor kb. ${estimatedDrainMinutes} perc alatt urulhet ki a mostani worker beallitassal.`
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
    estimatedDrainMinutes,
    activeJobs: active,
    recommendations
  };
}
