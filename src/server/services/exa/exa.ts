import { env } from "@env/server.mjs";
import Exa from "exa-js";

const PREFERRED_COMPLIANCE_DOMAINS = [
  "vancouver.ca",
  "bccodes.ca",
  "bclaws.gov.bc.ca",
  "www2.gov.bc.ca",
  "nrc.canada.ca",
  "laws-lois.justice.gc.ca",
];

const COMPLIANCE_QUERY_HINT =
  "construction compliance regulations permits zoning building code occupancy fire safety";

const DEFAULT_JURISDICTION_HINT = "Kitsilano, Vancouver, BC, Canada";

type ExaRawResult = {
  title?: unknown;
  url?: unknown;
  score?: unknown;
  publishedDate?: unknown;
  text?: unknown;
  highlights?: unknown;
};

export type ComplianceSearchResult = {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  score?: number;
  publishedDate?: string;
};

type SearchRequest = {
  projectPrompt: string;
  numResults: number;
};

type SearchResponse = {
  queryUsed: string;
  searchedDomains: string[];
  results: ComplianceSearchResult[];
};

type SimilarRequest = {
  seedUrl: string;
  numResults: number;
};

type SimilarResponse = {
  seedUrl: string;
  searchedDomains: string[];
  results: ComplianceSearchResult[];
};

type AnswerRequest = {
  question: string;
  jurisdictionHint?: string;
};

type ExaComplianceConfig = {
  clientFactory?: () => Exa;
  preferredDomains?: string[];
  queryHint?: string;
  defaultJurisdictionHint?: string;
};

export type ComplianceAnswerCitation = {
  title: string;
  url: string;
  domain: string;
  publishedDate?: string;
  textSnippet: string;
};

export type StructuredComplianceAnswer = {
  conciseAnswer: string;
  likelyPermits: string[];
  governingBodies: string[];
  criticalRisks: string[];
  nextStep: string;
};

type AnswerResponse = {
  question: string;
  answer: StructuredComplianceAnswer;
  citations: ComplianceAnswerCitation[];
};

const COMPLIANCE_ANSWER_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "conciseAnswer",
    "likelyPermits",
    "governingBodies",
    "criticalRisks",
    "nextStep",
  ],
  properties: {
    conciseAnswer: { type: "string" },
    likelyPermits: {
      type: "array",
      items: { type: "string" },
    },
    governingBodies: {
      type: "array",
      items: { type: "string" },
    },
    criticalRisks: {
      type: "array",
      items: { type: "string" },
    },
    nextStep: { type: "string" },
  },
} as const;

function createDefaultExaClient(): Exa {
  const apiKey = env.EXA_API_KEY;
  if (!apiKey) {
    throw new Error("EXA_API_KEY is missing. Add it to your environment.");
  }

  return new Exa(apiKey);
}

export class ExaCompliance {
  private readonly clientFactory: () => Exa;
  private readonly preferredDomains: string[];
  private readonly queryHint: string;
  private readonly defaultJurisdictionHint: string;

  constructor(config: ExaComplianceConfig = {}) {
    this.clientFactory = config.clientFactory ?? createDefaultExaClient;
    this.preferredDomains = config.preferredDomains ?? PREFERRED_COMPLIANCE_DOMAINS;
    this.queryHint = config.queryHint ?? COMPLIANCE_QUERY_HINT;
    this.defaultJurisdictionHint =
      config.defaultJurisdictionHint ?? DEFAULT_JURISDICTION_HINT;
  }

  async search(request: SearchRequest): Promise<SearchResponse> {
    const exa = this.client();
    const queryUsed = this.buildSearchQuery(request.projectPrompt);

    const response = await this.withAttempts(
      [
        () =>
          exa.search(queryUsed, {
            numResults: request.numResults,
            type: "auto",
            includeDomains: this.preferredDomains,
            contents: {
              text: {
                maxCharacters: 10000,
              },
            },
          }),
        () =>
          exa.search(queryUsed, {
            numResults: request.numResults,
            type: "auto",
            includeDomains: this.preferredDomains,
            contents: {
              text: true,
            },
          }),
        () =>
          exa.search(queryUsed, {
            numResults: request.numResults,
            type: "auto",
            includeDomains: this.preferredDomains,
          }),
      ],
      "Unable to search compliance sources with Exa.",
    );

    return {
      queryUsed,
      searchedDomains: this.preferredDomains,
      results: this.normalizeResults(this.extractResults(response, "search")),
    };
  }

  async answer(request: AnswerRequest): Promise<AnswerResponse> {
    const exa = this.client();
    const query = this.buildAnswerQuery({
      question: request.question,
      jurisdictionHint: request.jurisdictionHint,
    });

    let response: unknown;
    try {
      response = await exa.answer(query, {
        text: true,
        outputSchema: COMPLIANCE_ANSWER_OUTPUT_SCHEMA,
      });
    } catch (error) {
      throw this.normalizeExaError(error, "Unable to answer compliance question with Exa.");
    }

    const record = this.asRecord(response);
    const answer = this.normalizeAnswer(record?.answer ?? response);
    const citations = this.normalizeCitations(record?.citations);

    return {
      question: request.question,
      answer,
      citations,
    };
  }

  async similar(request: SimilarRequest): Promise<SimilarResponse> {
    const exa = this.client();

    const response = await this.withAttempts(
      [
        () =>
          exa.findSimilar(request.seedUrl, {
            numResults: request.numResults,
            includeDomains: this.preferredDomains,
            contents: {
              text: {
                maxCharacters: 10000,
              },
            },
          }),
        () =>
          exa.findSimilar(request.seedUrl, {
            numResults: request.numResults,
            includeDomains: this.preferredDomains,
            contents: {
              text: true,
            },
          }),
        () =>
          exa.findSimilar(request.seedUrl, {
            numResults: request.numResults,
            includeDomains: this.preferredDomains,
          }),
      ],
      "Unable to find similar compliance sources with Exa.",
    );

    return {
      seedUrl: request.seedUrl,
      searchedDomains: this.preferredDomains,
      results: this.normalizeResults(this.extractResults(response, "findSimilar")),
    };
  }

  private client(): Exa {
    return this.clientFactory();
  }

  private async withAttempts(
    attempts: Array<() => Promise<unknown>>,
    fallbackMessage: string,
  ): Promise<unknown> {
    let lastError: Error | undefined;

    for (const run of attempts) {
      try {
        return await run();
      } catch (error) {
        lastError = this.normalizeExaError(error, fallbackMessage);
      }
    }

    throw lastError ?? new Error(fallbackMessage);
  }

  private normalizeExaError(error: unknown, fallbackMessage: string): Error {
    if (error instanceof SyntaxError) {
      const message = error.message.toLowerCase();
      if (
        message.includes("unicode escape") ||
        message.includes("unterminated string") ||
        message.includes("unexpected token")
      ) {
        return new Error(
          "Exa returned an unreadable response. Re-check EXA_API_KEY and retry.",
        );
      }
    }

    return error instanceof Error ? error : new Error(fallbackMessage);
  }

  private buildSearchQuery(projectPrompt: string): string {
    return [this.queryHint, projectPrompt].join(" ");
  }

  private buildAnswerQuery({
    question,
    jurisdictionHint,
  }: {
    question: string;
    jurisdictionHint?: string;
  }): string {
    const jurisdiction = jurisdictionHint?.trim() || this.defaultJurisdictionHint;

    return [
      `Jurisdiction: ${jurisdiction}.`,
      "Answer as a construction compliance analyst.",
      "Prioritize zoning, permits, building code, fire/life safety, and occupancy requirements.",
      question.trim(),
    ].join(" ");
  }

  private extractResults(response: unknown, apiName: string): ExaRawResult[] {
    const results = this.asRecord(response)?.results;
    if (!Array.isArray(results)) {
      throw new Error(`Unexpected Exa ${apiName} response format.`);
    }

    return results.filter((result): result is ExaRawResult => this.isRecord(result));
  }

  private normalizeResults(rawResults: ExaRawResult[]): ComplianceSearchResult[] {
    const uniqueUrls = new Set<string>();
    const normalized: ComplianceSearchResult[] = [];

    for (const result of rawResults) {
      const url = typeof result.url === "string" ? result.url : "";
      if (!url.startsWith("http") || uniqueUrls.has(url)) continue;

      uniqueUrls.add(url);

      const title =
        typeof result.title === "string" && result.title.trim().length > 0
          ? result.title.trim()
          : "Untitled source";

      const score =
        typeof result.score === "number" && Number.isFinite(result.score)
          ? result.score
          : undefined;

      const publishedDate =
        typeof result.publishedDate === "string" ? result.publishedDate : undefined;

      normalized.push({
        title,
        url,
        snippet: this.makeSnippet(result),
        domain: this.getDomain(url),
        score,
        publishedDate,
      });
    }

    return normalized;
  }

  private normalizeAnswer(answer: unknown): StructuredComplianceAnswer {
    const fallback: StructuredComplianceAnswer = {
      conciseAnswer:
        "I could not structure a full answer from Exa for this question. Please rephrase and retry.",
      likelyPermits: ["Building permit", "Development/zoning review"],
      governingBodies: ["Municipality", "Provincial code authority"],
      criticalRisks: [
        "Zoning mismatch",
        "Fire/life-safety noncompliance",
        "Permit sequencing delays",
      ],
      nextStep: "Confirm lot zoning and request a pre-application review with the municipality.",
    };

    if (typeof answer === "string") {
      return {
        ...fallback,
        conciseAnswer: answer.trim() || fallback.conciseAnswer,
      };
    }

    if (!this.isRecord(answer)) {
      return fallback;
    }

    const conciseAnswer = this.text(answer.conciseAnswer) || fallback.conciseAnswer;
    const likelyPermits = this.textList(answer.likelyPermits);
    const governingBodies = this.textList(answer.governingBodies);
    const criticalRisks = this.textList(answer.criticalRisks);
    const nextStep = this.text(answer.nextStep) || fallback.nextStep;

    return {
      conciseAnswer,
      likelyPermits: likelyPermits.length > 0 ? likelyPermits : fallback.likelyPermits,
      governingBodies: governingBodies.length > 0 ? governingBodies : fallback.governingBodies,
      criticalRisks: criticalRisks.length > 0 ? criticalRisks : fallback.criticalRisks,
      nextStep,
    };
  }

  private normalizeCitations(citations: unknown): ComplianceAnswerCitation[] {
    if (!Array.isArray(citations)) return [];

    const parsed: ComplianceAnswerCitation[] = [];
    const seenUrls = new Set<string>();

    for (const citation of citations) {
      if (!this.isRecord(citation)) continue;

      const url = this.text(citation.url) || this.text(citation.id);
      if (!url || !url.startsWith("http") || seenUrls.has(url)) continue;

      seenUrls.add(url);

      parsed.push({
        title: this.text(citation.title) || "Untitled citation",
        url,
        domain: this.getDomain(url),
        publishedDate: this.text(citation.publishedDate) || undefined,
        textSnippet:
          this.text(citation.text)?.slice(0, 280) || "Open citation source for details.",
      });
    }

    return parsed;
  }

  private makeSnippet(result: ExaRawResult): string {
    const highlights = this.getHighlights(result.highlights);
    if (highlights.length > 0) return highlights.join(" ");

    const text = typeof result.text === "string" ? result.text : "";
    const trimmedText = text.replace(/\s+/g, " ").trim();
    if (trimmedText.length > 0) {
      return trimmedText.length > 280 ? `${trimmedText.slice(0, 280)}...` : trimmedText;
    }

    return "Open source for compliance details.";
  }

  private getHighlights(highlights: unknown): string[] {
    if (!highlights) return [];

    if (Array.isArray(highlights)) {
      return highlights
        .flatMap((item) => {
          if (typeof item === "string") return [item];
          if (
            this.isRecord(item) &&
            typeof item.highlight === "string"
          ) {
            return [item.highlight];
          }
          return [];
        })
        .map((item) => item.trim())
        .filter(Boolean);
    }

    if (this.isRecord(highlights)) {
      const values = Object.values(highlights);
      return values
        .flatMap((value) => {
          if (typeof value === "string") return [value];
          if (Array.isArray(value)) {
            return value
              .filter((item): item is string => typeof item === "string")
              .map((item) => item.trim());
          }
          return [];
        })
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  }

  private getDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return "unknown";
    }
  }

  private text(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
  }

  private textList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];

    const normalized = value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);

    return Array.from(new Set(normalized));
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return this.isRecord(value) ? value : null;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }
}

export const exaCompliance = new ExaCompliance();
