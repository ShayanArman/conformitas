import {
  exaCompliance,
  type ComplianceSearchResult,
} from "@server/services/exa/exa";

type SearchInput = {
  projectPrompt: string;
  numResults?: number;
};

type AnswerInput = {
  question: string;
  jurisdictionHint?: string;
};

type SimilarInput = {
  seedUrl: string;
  numResults?: number;
};

type PermitPlanItem = {
  permitName: string;
  category: string;
  estimatedWaitWeeks: number;
  estimatedWaitText: string;
  priorityRank: number;
  whyStartEarly: string;
  requiredInformation: string[];
};

type CrossPermitInfoItem = {
  info: string;
  usedByPermits: string[];
  longestWaitWeeks: number;
  effortRank: number;
  sharedAcrossPermits: boolean;
};

type PermitPlan = {
  permits: PermitPlanItem[];
  informationAcrossPermits: CrossPermitInfoItem[];
  sequencingNote: string;
};

type PermitTemplateContext = {
  normalizedPrompt: string;
  corpus: string;
};

type PermitTemplate = {
  key: string;
  permitName: string;
  category: string;
  estimatedWaitWeeks: number;
  estimatedWaitText: string;
  whyStartEarly: string;
  requiredInformation: string[];
  isRelevant: (context: PermitTemplateContext) => boolean;
};

const REGULATION_INFERENCE_RULES: Array<{ pattern: RegExp; label: string }> = [
  {
    pattern: /(zoning|land use|rezoning|development by[- ]?law|setback|density|fsr)/i,
    label: "Zoning & Land Use Bylaws",
  },
  {
    pattern: /(building code|building permit|bc building code|nbcc|structural)/i,
    label: "Building Code & Building Permit",
  },
  {
    pattern: /(fire|life safety|egress|sprinkler|fire resistance)/i,
    label: "Fire & Life Safety Requirements",
  },
  {
    pattern: /(occupancy|final inspection|completion|occupancy permit)/i,
    label: "Occupancy / Completion Requirements",
  },
  {
    pattern: /(electrical|plumbing|gas|mechanical|hvac|trade permit)/i,
    label: "Trade Permits (Electrical/Plumbing/Gas/Mechanical)",
  },
  {
    pattern: /(environment|drainage|stormwater|servicing|utility|contamination)/i,
    label: "Environmental & Site Servicing Requirements",
  },
  {
    pattern: /(accessibility|barrier[- ]?free|universal design)/i,
    label: "Accessibility Requirements",
  },
  {
    pattern: /(energy|step code|energy code|emission|efficiency)/i,
    label: "Energy / Step Code Compliance",
  },
];

const BASE_PROJECT_INFO = [
  "Legal site address and parcel identifier",
  "Owner/developer contact and authorized agent information",
  "Current title, covenant, and right-of-way summary",
];

const PROFESSIONAL_INFO = [
  "Stamped design professional schedules and seals",
  "Code analysis summary tied to occupancy and construction type",
];

const PERMIT_TEMPLATES: PermitTemplate[] = [
  {
    key: "development-zoning",
    permitName: "Development/Zoning Review",
    category: "Land Use",
    estimatedWaitWeeks: 18,
    estimatedWaitText: "12-24 weeks",
    whyStartEarly:
      "Land-use approval can gate every downstream permit package and often requires revision rounds.",
    requiredInformation: [
      ...BASE_PROJECT_INFO,
      "Current zoning designation with bylaw references",
      "Topographic/site survey with setbacks, height, lot coverage, and FSR",
      "Massing studies, floor-area schedule, and shadow/privacy impact studies",
      "Planning rationale aligned to neighborhood policy and design guidelines",
    ],
    isRelevant: ({ corpus }) =>
      /(new|build|apartment|condo|townhouse|rezoning|zoning|development|density|commercial|clinic)/i.test(
        corpus,
      ),
  },
  {
    key: "building-permit",
    permitName: "Building Permit",
    category: "Building Code",
    estimatedWaitWeeks: 12,
    estimatedWaitText: "8-16 weeks",
    whyStartEarly:
      "The core permit review is document-heavy and drives structural, envelope, and life-safety approvals.",
    requiredInformation: [
      ...BASE_PROJECT_INFO,
      ...PROFESSIONAL_INFO,
      "Issued or accepted development/zoning decision reference",
      "Stamped architectural drawing set",
      "Stamped structural drawings, schedules, and foundation design",
      "Energy or Step Code compliance documentation",
      "Geotechnical and civil servicing reports where required",
    ],
    isRelevant: () => true,
  },
  {
    key: "fire-life-safety",
    permitName: "Fire/Life-Safety Design Review",
    category: "Life Safety",
    estimatedWaitWeeks: 10,
    estimatedWaitText: "6-14 weeks",
    whyStartEarly:
      "Life-safety constraints can force major layout changes if caught late in design development.",
    requiredInformation: [
      ...BASE_PROJECT_INFO,
      ...PROFESSIONAL_INFO,
      "Life-safety plan with exits, travel distances, and fire separations",
      "Fire-protection narrative for alarm, sprinkler, and standpipe systems",
      "Fire department access and firefighting operations plan",
      "Alternative solution package where prescriptive code path is not met",
    ],
    isRelevant: ({ normalizedPrompt, corpus }) =>
      /\b[4-9]\s*stor(y|ies)\b/.test(normalizedPrompt) ||
      /(fire|life safety|egress|occupancy|mid-rise)/i.test(corpus),
  },
  {
    key: "excavation-shoring",
    permitName: "Excavation/Shoring Permit",
    category: "Site Works",
    estimatedWaitWeeks: 8,
    estimatedWaitText: "4-12 weeks",
    whyStartEarly:
      "Site and geotechnical review can be a critical path dependency before foundation work starts.",
    requiredInformation: [
      ...BASE_PROJECT_INFO,
      ...PROFESSIONAL_INFO,
      "Geotechnical investigation report and recommendations",
      "Engineered shoring/excavation drawings and sequencing",
      "Erosion, sediment, and runoff control plan",
      "Neighbor protection, monitoring, and vibration plan",
    ],
    isRelevant: ({ corpus }) => /(excavat|shor|foundation|basement|parkade|retaining)/i.test(corpus),
  },
  {
    key: "change-of-use",
    permitName: "Change of Use/Occupancy Permit",
    category: "Use Conversion",
    estimatedWaitWeeks: 7,
    estimatedWaitText: "4-10 weeks",
    whyStartEarly:
      "Use changes trigger code upgrades and accessibility obligations that can materially alter scope.",
    requiredInformation: [
      ...BASE_PROJECT_INFO,
      ...PROFESSIONAL_INFO,
      "Existing building condition assessment",
      "Current vs proposed occupancy/use classification matrix",
      "Barrier-free accessibility gap analysis and upgrade plan",
      "Hazardous materials review and abatement scope where required",
    ],
    isRelevant: ({ corpus }) =>
      /(convert|conversion|change of use|retrofit|tenant improvement|clinic|office to|shell)/i.test(
        corpus,
      ),
  },
  {
    key: "trade-permits",
    permitName: "Trade Permits (MEP/Gas)",
    category: "Trades",
    estimatedWaitWeeks: 6,
    estimatedWaitText: "3-10 weeks",
    whyStartEarly:
      "Trade permits can lag structural progress if engineering packages are submitted late.",
    requiredInformation: [
      ...BASE_PROJECT_INFO,
      ...PROFESSIONAL_INFO,
      "Mechanical layouts with ventilation and equipment schedules",
      "Electrical single-line diagrams and load calculations",
      "Plumbing/isometric drawings and fixture schedules",
      "Gas design package and appliance schedules where applicable",
    ],
    isRelevant: () => true,
  },
  {
    key: "demolition",
    permitName: "Demolition Permit",
    category: "Site Preparation",
    estimatedWaitWeeks: 5,
    estimatedWaitText: "2-8 weeks",
    whyStartEarly:
      "Demolition holds up redevelopment start if utility disconnect and hazardous material steps are incomplete.",
    requiredInformation: [
      ...BASE_PROJECT_INFO,
      "Demolition sequencing and safety plan",
      "Hazardous materials survey and disposal plan",
      "Utility disconnect confirmations",
      "Neighbor/public protection and traffic control plan",
    ],
    isRelevant: ({ corpus }) => /(demo|demolition|tear down|remove existing)/i.test(corpus),
  },
  {
    key: "occupancy-completion",
    permitName: "Occupancy/Completion Approval",
    category: "Closeout",
    estimatedWaitWeeks: 3,
    estimatedWaitText: "1-6 weeks",
    whyStartEarly:
      "Closeout packages fail when inspection and commissioning evidence is not tracked from the start.",
    requiredInformation: [
      ...BASE_PROJECT_INFO,
      "All trade final inspections and deficiency closeout records",
      "Life-safety systems testing and acceptance reports",
      "Commissioning documentation and as-built drawings",
      "Letters of assurance/professional sign-off package",
    ],
    isRelevant: () => true,
  },
];

const CORE_TEMPLATE_KEYS = [
  "development-zoning",
  "building-permit",
  "trade-permits",
  "occupancy-completion",
] as const;

export class ComplianceAgent {
  static async search(input: SearchInput) {
    const search = await exaCompliance.search({
      projectPrompt: input.projectPrompt,
      numResults: input.numResults ?? 8,
    });

    const permitPlan = makePermitPlan({
      projectPrompt: input.projectPrompt,
      results: search.results,
    });

    return {
      ...search,
      checklist: makeChecklist(input.projectPrompt),
      permitPlan,
      interviewMode: makeInterview({
        projectPrompt: input.projectPrompt,
        results: search.results,
        permitPlan,
      }),
      disclaimer:
        "Use these sources as a starting point. Confirm final requirements with your municipality and licensed professionals.",
    };
  }

  static async answer(input: AnswerInput) {
    const answer = await exaCompliance.answer({
      question: input.question,
      jurisdictionHint: input.jurisdictionHint,
    });

    return {
      ...answer,
      disclaimer:
        "AI-generated compliance guidance is directional only. Confirm all decisions with licensed professionals and governing authorities.",
    };
  }

  static async similar(input: SimilarInput) {
    const similar = await exaCompliance.similar({
      seedUrl: input.seedUrl,
      numResults: input.numResults ?? 6,
    });

    const similarProjects = similar.results.map((result) => ({
      title: result.title,
      url: result.url,
      domain: result.domain,
      summary: result.snippet,
      similarityScore: result.score,
      requiredRegulations: inferRegs(result),
    }));

    return {
      ...similar,
      similarProjects,
      noSimilarFound: similarProjects.length === 0,
      disclaimer:
        "Similarity is semantic, not legal equivalence. Regulation requirements are inferred from source text and must be validated in full source documents.",
    };
  }
}

function makePermitPlan({
  projectPrompt,
  results,
}: {
  projectPrompt: string;
  results: ComplianceSearchResult[];
}): PermitPlan {
  const normalizedPrompt = projectPrompt.toLowerCase();
  const corpus = [
    normalizedPrompt,
    ...results.map((result) => `${result.title} ${result.snippet}`.toLowerCase()),
  ].join(" ");

  const context: PermitTemplateContext = {
    normalizedPrompt,
    corpus,
  };

  const selected = PERMIT_TEMPLATES.filter((template) => template.isRelevant(context));

  const ensuredCore = CORE_TEMPLATE_KEYS.map((coreKey) =>
    PERMIT_TEMPLATES.find((template) => template.key === coreKey),
  ).filter((template): template is PermitTemplate => Boolean(template));

  const orderedTemplates = uniqueTemplates([...selected, ...ensuredCore]).sort((left, right) => {
    if (right.estimatedWaitWeeks !== left.estimatedWaitWeeks) {
      return right.estimatedWaitWeeks - left.estimatedWaitWeeks;
    }
    return left.permitName.localeCompare(right.permitName);
  });

  const permits = orderedTemplates.map((template, index) => ({
    permitName: template.permitName,
    category: template.category,
    estimatedWaitWeeks: template.estimatedWaitWeeks,
    estimatedWaitText: template.estimatedWaitText,
    priorityRank: index + 1,
    whyStartEarly: template.whyStartEarly,
    requiredInformation: unique(template.requiredInformation),
  }));

  const informationAcrossPermits = makeInformationAcrossPermits(permits);

  return {
    permits,
    informationAcrossPermits,
    sequencingNote:
      "Submit permits in descending review time so the slowest municipal workflows start first while shorter permits are prepared in parallel.",
  };
}

function makeInformationAcrossPermits(permits: PermitPlanItem[]): CrossPermitInfoItem[] {
  const map = new Map<
    string,
    {
      info: string;
      usedByPermits: Set<string>;
      longestWaitWeeks: number;
    }
  >();

  for (const permit of permits) {
    for (const info of permit.requiredInformation) {
      const key = normalizeInfoKey(info);
      const current = map.get(key);

      if (!current) {
        map.set(key, {
          info,
          usedByPermits: new Set([permit.permitName]),
          longestWaitWeeks: permit.estimatedWaitWeeks,
        });
        continue;
      }

      current.usedByPermits.add(permit.permitName);
      current.longestWaitWeeks = Math.max(current.longestWaitWeeks, permit.estimatedWaitWeeks);
    }
  }

  const sorted = [...map.values()]
    .sort((left, right) => {
      if (right.longestWaitWeeks !== left.longestWaitWeeks) {
        return right.longestWaitWeeks - left.longestWaitWeeks;
      }
      if (right.usedByPermits.size !== left.usedByPermits.size) {
        return right.usedByPermits.size - left.usedByPermits.size;
      }
      return left.info.localeCompare(right.info);
    })
    .map((item, index) => ({
      info: item.info,
      usedByPermits: [...item.usedByPermits],
      longestWaitWeeks: item.longestWaitWeeks,
      effortRank: index + 1,
      sharedAcrossPermits: item.usedByPermits.size > 1,
    }));

  return sorted;
}

function normalizeInfoKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function uniqueTemplates(templates: PermitTemplate[]): PermitTemplate[] {
  const map = new Map<string, PermitTemplate>();

  for (const template of templates) {
    if (!map.has(template.key)) {
      map.set(template.key, template);
    }
  }

  return [...map.values()];
}

function makeChecklist(projectPrompt: string): string[] {
  const normalizedPrompt = projectPrompt.toLowerCase();
  const checklist = [
    "Confirm land use and zoning for the lot.",
    "Identify required building permits and inspections.",
    "Rank permits by expected municipal review time and submit the longest first.",
    "Assemble one shared information pack for documents reused across multiple permits.",
    "Check fire, life-safety, egress, and occupancy rules.",
    "Document environmental and utility servicing requirements.",
  ];

  if (
    normalizedPrompt.includes("vancouver") ||
    normalizedPrompt.includes("kitsilano")
  ) {
    checklist.unshift(
      "Review City of Vancouver development and zoning bylaws for the property.",
    );
  }

  if (normalizedPrompt.includes("british columbia") || /\bbc\b/.test(normalizedPrompt)) {
    checklist.push("Verify applicable BC Building Code provisions for the building class.");
  }

  if (/\b[4-9]\s*stor(y|ies)\b/.test(normalizedPrompt)) {
    checklist.push("Validate mid-rise requirements for height, exiting, and fire resistance.");
  }

  return unique(checklist);
}

function makeInterview({
  projectPrompt,
  results,
  permitPlan,
}: {
  projectPrompt: string;
  results: ComplianceSearchResult[];
  permitPlan: PermitPlan;
}) {
  const normalizedPrompt = projectPrompt.toLowerCase();

  const permitClasses = permitPlan.permits.map((permit) => permit.permitName);
  const topRisks = makeRisks({
    normalizedPrompt,
    results,
  }).slice(0, 3);

  const keyBylawLinks = pickBylawLinks(results);

  return {
    permitClasses: unique(permitClasses).slice(0, 6),
    keyBylawLinks,
    topRisks,
  };
}

function makeRisks({
  normalizedPrompt,
  results,
}: {
  normalizedPrompt: string;
  results: ComplianceSearchResult[];
}): string[] {
  const corpus = [
    normalizedPrompt,
    ...results.map((result) => `${result.title} ${result.snippet}`.toLowerCase()),
  ].join(" ");

  const risks: string[] = [];

  if (
    corpus.includes("zoning") ||
    corpus.includes("land use") ||
    normalizedPrompt.includes("vancouver")
  ) {
    risks.push(
      "Zoning mismatch risk: project height, setbacks, density, or use may not align with the lot's bylaw.",
    );
  }

  if (
    /\b[4-9]\s*stor(y|ies)\b/.test(normalizedPrompt) ||
    corpus.includes("fire") ||
    corpus.includes("egress")
  ) {
    risks.push(
      "Life-safety risk: mid-rise egress, fire-resistance, and occupancy requirements can trigger major redesigns.",
    );
  }

  if (
    corpus.includes("permit") ||
    corpus.includes("inspection") ||
    corpus.includes("occupancy")
  ) {
    risks.push(
      "Permit sequencing risk: missing prerequisite permits or inspections can delay construction start and occupancy.",
    );
  }

  if (
    corpus.includes("utility") ||
    corpus.includes("servicing") ||
    corpus.includes("environment")
  ) {
    risks.push(
      "Servicing risk: utility capacity, drainage, or environmental constraints can add unplanned scope and cost.",
    );
  }

  if (risks.length < 3) {
    risks.push(
      "Jurisdiction risk: provincial and municipal requirements can conflict; confirm the governing authority for each requirement.",
    );
  }

  if (risks.length < 3) {
    risks.push(
      "Documentation risk: incomplete stamped plans and code references are common reasons for permit resubmission.",
    );
  }

  const uniqueRisks = unique(risks);
  const fallbackRisks = [
    "Schedule risk: incomplete agency review packages often trigger revision cycles and timeline drift.",
    "Cost risk: late compliance changes can materially impact structural, MEP, and fire-protection budgets.",
  ];

  for (const fallbackRisk of fallbackRisks) {
    if (uniqueRisks.length >= 3) break;
    uniqueRisks.push(fallbackRisk);
  }

  return uniqueRisks;
}

function pickBylawLinks(results: ComplianceSearchResult[]) {
  const keywordPattern =
    /(bylaw|code|regulation|permit|zoning|occupancy|fire|development|building)/i;
  const seenUrls = new Set<string>();

  return [...results]
    .sort((left, right) => {
      const leftRank = rankResult(left);
      const rightRank = rankResult(right);
      return rightRank - leftRank;
    })
    .filter((result) => {
      const isKeywordMatch =
        keywordPattern.test(result.title) || keywordPattern.test(result.url);
      if (!isKeywordMatch) return false;
      if (seenUrls.has(result.url)) return false;
      seenUrls.add(result.url);
      return true;
    })
    .slice(0, 5)
    .map((result) => ({
      title: result.title,
      url: result.url,
      domain: result.domain,
    }));
}

function rankResult(result: ComplianceSearchResult): number {
  let rank = 0;
  const searchableText = `${result.title} ${result.url}`.toLowerCase();

  if (result.domain.includes(".gov") || result.domain.includes("vancouver.ca")) {
    rank += 4;
  }
  if (result.domain.includes("bccodes.ca") || result.domain.includes("bclaws.gov.bc.ca")) {
    rank += 4;
  }
  if (
    /(bylaw|code|regulation|permit|zoning|occupancy|fire|development|building)/.test(
      searchableText,
    )
  ) {
    rank += 3;
  }
  if (typeof result.score === "number" && Number.isFinite(result.score)) {
    rank += result.score;
  }

  return rank;
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const normalized = value.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
  }

  return output;
}

function inferRegs(result: ComplianceSearchResult): string[] {
  const text = `${result.title} ${result.snippet} ${result.url}`.toLowerCase();
  const inferred: string[] = [];

  for (const rule of REGULATION_INFERENCE_RULES) {
    if (rule.pattern.test(text)) {
      inferred.push(rule.label);
    }
  }

  if (inferred.length === 0) {
    return ["Not clearly specified in snippet (open source to verify)."];
  }

  return unique(inferred).slice(0, 5);
}
