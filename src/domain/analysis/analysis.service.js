export class AnalysisService {
  constructor(openaiClient, scoring) {
    this.openaiClient = openaiClient;
    this.scoring = scoring;
  }

  async analyze(input) {
    const prompt = this.buildPrompt(input);

    const response = await this.openaiClient.generate(prompt);

    return this.scoring.calculate(response);
  }

  buildPrompt(input) {
    return `Analyze: ${input}`;
  }
}