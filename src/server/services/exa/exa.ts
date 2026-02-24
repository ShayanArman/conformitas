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
const MAX_RESULT_TEXT_CHARACTERS = 10_000;
let exaClient: Exa | null = null;

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

export class ExaCompliance {
  public async search(request: SearchRequest): Promise<SearchResponse> {
    const exa = getExaClient();
    const queryUsed = buildSearchQuery(request.projectPrompt);

    const response = await withAttempts(
      buildSearchAttempts({
        exa,
        query: queryUsed,
        numResults: request.numResults,
      }),
      "Unable to search compliance sources with Exa.",
    );

    return {
      queryUsed,
      searchedDomains: [...PREFERRED_COMPLIANCE_DOMAINS],
      results: normalizeResults(extractResults(response, "search")),
    };
  }

  public async answer(request: AnswerRequest): Promise<AnswerResponse> {
    const exa = getExaClient();
    const query = buildAnswerQuery(request);

    let response: unknown;
    try {
      response = await exa.answer(query, {
        text: true,
        outputSchema: COMPLIANCE_ANSWER_OUTPUT_SCHEMA,
      });
    } catch (error) {
      throw normalizeExaError(
        error,
        "Unable to answer compliance question with Exa.",
      );
    }

    const record = asRecord(response);

    return {
      question: request.question,
      answer: normalizeAnswer(record?.answer ?? response),
      citations: normalizeCitations(record?.citations),
    };
  }

  public async similar(request: SimilarRequest): Promise<SimilarResponse> {
    const exa = getExaClient();

    const response = await withAttempts(
      buildSimilarAttempts({
        exa,
        seedUrl: request.seedUrl,
        numResults: request.numResults,
      }),
      "Unable to find similar compliance sources with Exa.",
    );

    return {
      seedUrl: request.seedUrl,
      searchedDomains: [...PREFERRED_COMPLIANCE_DOMAINS],
      results: normalizeResults(extractResults(response, "findSimilar")),
    };
  }
}

function getExaClient(): Exa {
  if (exaClient) return exaClient;

  const apiKey = env.EXA_API_KEY;
  if (!apiKey) {
    throw new Error("EXA_API_KEY is missing. Add it to your environment.");
  }

  exaClient = new Exa(apiKey);
  return exaClient;
}

function buildSearchAttempts({
  exa,
  query,
  numResults,
}: {
  exa: Exa;
  query: string;
  numResults: number;
}): Array<() => Promise<unknown>> {
  return [
    () =>
      exa.search(query, {
        numResults,
        type: "auto",
        includeDomains: PREFERRED_COMPLIANCE_DOMAINS,
        contents: {
          text: {
            maxCharacters: MAX_RESULT_TEXT_CHARACTERS,
          },
        },
      }),
    () =>
      exa.search(query, {
        numResults,
        type: "auto",
        includeDomains: PREFERRED_COMPLIANCE_DOMAINS,
        contents: {
          text: true,
        },
      }),
    () =>
      exa.search(query, {
        numResults,
        type: "auto",
        includeDomains: PREFERRED_COMPLIANCE_DOMAINS,
      }),
  ];
}

function buildSimilarAttempts({
  exa,
  seedUrl,
  numResults,
}: {
  exa: Exa;
  seedUrl: string;
  numResults: number;
}): Array<() => Promise<unknown>> {
  return [
    () =>
      exa.findSimilar(seedUrl, {
        numResults,
        includeDomains: PREFERRED_COMPLIANCE_DOMAINS,
        contents: {
          text: {
            maxCharacters: MAX_RESULT_TEXT_CHARACTERS,
          },
        },
      }),
    () =>
      exa.findSimilar(seedUrl, {
        numResults,
        includeDomains: PREFERRED_COMPLIANCE_DOMAINS,
        contents: {
          text: true,
        },
      }),
    () =>
      exa.findSimilar(seedUrl, {
        numResults,
        includeDomains: PREFERRED_COMPLIANCE_DOMAINS,
      }),
  ];
}

async function withAttempts(
  attempts: Array<() => Promise<unknown>>,
  fallbackMessage: string,
): Promise<unknown> {
  let lastError: Error | undefined;

  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = normalizeExaError(error, fallbackMessage);
    }
  }

  throw lastError ?? new Error(fallbackMessage);
}

function normalizeExaError(error: unknown, fallbackMessage: string): Error {
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

function buildSearchQuery(projectPrompt: string): string {
  return [COMPLIANCE_QUERY_HINT, projectPrompt].join(" ");
}

function buildAnswerQuery({ question, jurisdictionHint }: AnswerRequest): string {
  const jurisdiction = jurisdictionHint?.trim() || DEFAULT_JURISDICTION_HINT;

  return [
    `Jurisdiction: ${jurisdiction}.`,
    "Answer as a construction compliance analyst.",
    "Prioritize zoning, permits, building code, fire/life safety, and occupancy requirements.",
    question.trim(),
  ].join(" ");
}

function extractResults(response: unknown, apiName: string): ExaRawResult[] {
  const results = asRecord(response)?.results;
  if (!Array.isArray(results)) {
    throw new Error(`Unexpected Exa ${apiName} response format.`);
  }

  return results.filter((result): result is ExaRawResult => isRecord(result));
}

function normalizeResults(rawResults: ExaRawResult[]): ComplianceSearchResult[] {
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
      snippet: makeSnippet(result),
      domain: getDomain(url),
      score,
      publishedDate,
    });
  }

  return normalized;
}

function normalizeAnswer(answer: unknown): StructuredComplianceAnswer {
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

  if (!isRecord(answer)) return fallback;

  const conciseAnswer = toText(answer.conciseAnswer) || fallback.conciseAnswer;
  const likelyPermits = toUniqueTextList(answer.likelyPermits);
  const governingBodies = toUniqueTextList(answer.governingBodies);
  const criticalRisks = toUniqueTextList(answer.criticalRisks);
  const nextStep = toText(answer.nextStep) || fallback.nextStep;

  return {
    conciseAnswer,
    likelyPermits: likelyPermits.length > 0 ? likelyPermits : fallback.likelyPermits,
    governingBodies:
      governingBodies.length > 0 ? governingBodies : fallback.governingBodies,
    criticalRisks: criticalRisks.length > 0 ? criticalRisks : fallback.criticalRisks,
    nextStep,
  };
}

function normalizeCitations(citations: unknown): ComplianceAnswerCitation[] {
  if (!Array.isArray(citations)) return [];

  const parsed: ComplianceAnswerCitation[] = [];
  const seenUrls = new Set<string>();

  for (const citation of citations) {
    if (!isRecord(citation)) continue;

    const url = toText(citation.url) || toText(citation.id);
    if (!url || !url.startsWith("http") || seenUrls.has(url)) continue;

    seenUrls.add(url);

    parsed.push({
      title: toText(citation.title) || "Untitled citation",
      url,
      domain: getDomain(url),
      publishedDate: toText(citation.publishedDate) || undefined,
      textSnippet:
        toText(citation.text).slice(0, 280) || "Open citation source for details.",
    });
  }

  return parsed;
}

function makeSnippet(result: ExaRawResult): string {
  const highlights = getHighlights(result.highlights);
  if (highlights.length > 0) return highlights.join(" ");

  const text = typeof result.text === "string" ? result.text : "";
  const trimmedText = text.replace(/\s+/g, " ").trim();

  if (trimmedText.length > 0) {
    return trimmedText.length > 280 ? `${trimmedText.slice(0, 280)}...` : trimmedText;
  }

  return "Open source for compliance details.";
}

function getHighlights(highlights: unknown): string[] {
  if (!highlights) return [];

  if (Array.isArray(highlights)) {
    return highlights
      .flatMap((item) => {
        if (typeof item === "string") return [item];
        if (isRecord(item) && typeof item.highlight === "string") {
          return [item.highlight];
        }
        return [];
      })
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (isRecord(highlights)) {
    return Object.values(highlights)
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

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown";
  }
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toUniqueTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const normalized = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set(normalized));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export const exaCompliance = new ExaCompliance();
