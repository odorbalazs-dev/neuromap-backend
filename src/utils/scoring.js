export function calculateFinalScore(answers = []) {
  return Math.round(
    answers.reduce((sum, val, i) => {
      const weight =
        i < 10 ? 1.25 :
        i < 20 ? 1.15 :
        i < 30 ? 1.05 :
        1.1;

      return sum + (Number(val || 0) * weight);
    }, 0)
  );
}