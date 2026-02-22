import { HEADER_HEIGHT_PX } from "@components/Header";
import { SimilarRegulationFinder, StructuredAnswerPanel } from "@components/Compliance";
import {
  Alert,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { type NextPage } from "next";
import { trpc } from "@utils/trpc";
import { useState } from "react";
import styles from "./index.module.css";

const SAMPLE_PROMPT =
  "I'm building an apartment condo unit, 4 stories, in Kitsilano Vancouver BC.";
const DEMO_PROJECT_SCENARIOS = [
  {
    label: "Mid-Rise Condo",
    prompt:
      "I'm building an apartment condo unit, 4 stories, in Kitsilano Vancouver BC.",
  },
  {
    label: "Commercial Retrofit",
    prompt:
      "I'm converting a two-storey commercial shell into a medical clinic in Mount Pleasant, Vancouver BC.",
  },
  {
    label: "Townhouse Development",
    prompt:
      "I'm developing a six-unit townhouse project with laneway homes in East Vancouver BC.",
  },
] as const;

const HomePage: NextPage = () => {
  const [prompt, setPrompt] = useState(SAMPLE_PROMPT);
  const [submittedPrompt, setSubmittedPrompt] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const searchMutation = trpc.compliance.search.useMutation();
  const data = searchMutation.data;
  const isSearching = searchMutation.isLoading;

  const canSubmit = prompt.trim().length >= 10;
  const clientBrief = (() => {
    if (!data) return "";

    const reportDate = new Date().toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const keyLinks =
      data.interviewMode.keyBylawLinks.length === 0
        ? ["- No high-confidence bylaw/code links detected in this run."]
        : data.interviewMode.keyBylawLinks.map(
            (link) => `- ${link.title} (${link.domain}): ${link.url}`,
          );

    const topSources =
      data.results.length === 0
        ? ["- No sources returned."]
        : data.results
            .slice(0, 5)
            .map((result) => `- ${result.title} (${result.domain}): ${result.url}`);

    const promptText = submittedPrompt || prompt.trim();
    const permitPriorityLines =
      data.permitPlan.permits.length === 0
        ? ["- No permit sequence generated."]
        : data.permitPlan.permits.map(
            (permit) =>
              `${permit.priorityRank}. ${permit.permitName} (${permit.estimatedWaitText}) - ${permit.whyStartEarly}`,
          );

    const permitInfoByType =
      data.permitPlan.permits.length === 0
        ? ["- No permit information requirements generated."]
        : data.permitPlan.permits.flatMap((permit) => [
            `### ${permit.permitName}`,
            `Estimated wait: ${permit.estimatedWaitText}`,
            ...permit.requiredInformation.map((item, index) => `${index + 1}. ${item}`),
            "",
          ]);

    const crossPermitInformation =
      data.permitPlan.informationAcrossPermits.length === 0
        ? ["- No cross-permit information list generated."]
        : data.permitPlan.informationAcrossPermits.map(
            (item) =>
              `${item.effortRank}. ${item.info} (max wait: ${item.longestWaitWeeks} weeks; permits: ${item.usedByPermits.join(", ")})`,
          );

    return [
      "# Client Compliance Brief",
      `Date: ${reportDate}`,
      `Project Prompt: ${promptText}`,
      "",
      "## Likely Permit Classes",
      ...data.interviewMode.permitClasses.map(
        (permitClass, index) => `${index + 1}. ${permitClass}`,
      ),
      "",
      "## Permit Priority (Longest Wait First)",
      ...permitPriorityLines,
      "",
      "## Permit Information By Type",
      ...permitInfoByType,
      "## Information Needed Across All Permits (Effort Sorted)",
      ...crossPermitInformation,
      "",
      "## Key Bylaw/Code Links",
      ...keyLinks,
      "",
      "## Top 3 Project Risks",
      ...data.interviewMode.topRisks.map(
        (risk, index) => `${index + 1}. ${risk}`,
      ),
      "",
      "## Initial Checklist",
      ...data.checklist.map((item, index) => `${index + 1}. ${item}`),
      "",
      "## Top Supporting Sources",
      ...topSources,
      "",
      "## Notes",
      `- Exa Query: ${data.queryUsed}`,
      `- Sequencing note: ${data.permitPlan.sequencingNote}`,
      `- ${data.disclaimer}`,
    ].join("\n");
  })();

  const runSearch = (nextPrompt: string) => {
    const cleanedPrompt = nextPrompt.trim();
    if (cleanedPrompt.length < 10) return;
    setCopyState("idle");
    setSubmittedPrompt(cleanedPrompt);
    searchMutation.mutate({
      projectPrompt: cleanedPrompt,
      numResults: 8,
    });
  };

  const submit = () => {
    runSearch(prompt);
  };

  const runDemo = (scenarioPrompt: string) => {
    setPrompt(scenarioPrompt);
    runSearch(scenarioPrompt);
  };

  const copyBrief = async () => {
    if (!clientBrief) return;
    try {
      await navigator.clipboard.writeText(clientBrief);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 3000);
    }
  };

  const downloadBrief = () => {
    if (!clientBrief) return;

    const dateStamp = new Date().toISOString().slice(0, 10);
    const blob = new Blob([clientBrief], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `compliance-brief-${dateStamp}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Box
      className={styles.pageRoot}
      style={{ minHeight: `calc(100vh - ${HEADER_HEIGHT_PX}px)` }}
    >
      <Container size="lg" className={styles.pageContainer}>
        <Card withBorder radius="md" p="xl" className={styles.heroCard}>
          <Stack spacing="xs">
            <Text className={styles.eyebrow}>EXA DEMO</Text>
            <Title order={1} className={styles.heroTitle}>
              Construction Compliance Finder
            </Title>
            <Text className={styles.heroSubtitle}>
              Describe a construction project and fetch regulation-oriented sources
              from Exa in seconds.
            </Text>
          </Stack>

          <Stack spacing="sm" mt="lg">
            <TextInput
              label="Project prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.currentTarget.value)}
              placeholder="Describe your project and location..."
              size="md"
            />

            <Box className={styles.demoSection}>
              <Text size="xs" className={styles.demoLabel}>
                Demo scenarios (1-click run)
              </Text>
              <Group spacing="xs">
                {DEMO_PROJECT_SCENARIOS.map((scenario) => (
                  <Button
                    key={scenario.label}
                    size="xs"
                    variant="light"
                    onClick={() => runDemo(scenario.prompt)}
                    disabled={isSearching}
                  >
                    {scenario.label}
                  </Button>
                ))}
              </Group>
            </Box>

            <Group spacing="xs">
              <Button
                size="md"
                onClick={submit}
                disabled={!canSubmit || isSearching}
                loading={isSearching}
              >
                Find Compliance Rules
              </Button>
              <Button
                size="md"
                variant="default"
                onClick={() => setPrompt(SAMPLE_PROMPT)}
                disabled={isSearching}
              >
                Use Sample Prompt
              </Button>
            </Group>

            <Text size="sm" color="dimmed">
              Prompt used: {submittedPrompt || "No query run yet"}
            </Text>
          </Stack>
        </Card>

        <Stack mt="md" spacing="md">
          <StructuredAnswerPanel />
          <SimilarRegulationFinder />
        </Stack>

        {searchMutation.error ? (
          <Alert color="red" radius="md" mt="md">
            {searchMutation.error.message}
          </Alert>
        ) : null}

        {isSearching ? (
          <Flex className={styles.loadingState}>
            <Loader size="sm" mr="sm" />
            <Text>Searching Exa for relevant compliance sources...</Text>
          </Flex>
        ) : null}

        {data ? (
          <Stack mt="lg" spacing="md">
            <Card withBorder radius="md" p="lg" className={styles.interviewCard}>
              <Stack spacing="sm">
                <Text weight={700}>Interview Mode</Text>

                <Box>
                  <Text size="sm" className={styles.sectionLabel}>
                    Likely permit classes
                  </Text>
                  {data.interviewMode.permitClasses.map((permitClass, index) => (
                    <Text key={`${permitClass}-${index}`} size="sm">
                      {index + 1}. {permitClass}
                    </Text>
                  ))}
                </Box>

                <Box>
                  <Text size="sm" className={styles.sectionLabel}>
                    Key bylaw/code links
                  </Text>
                  {data.interviewMode.keyBylawLinks.length === 0 ? (
                    <Text size="sm" color="dimmed">
                      No high-confidence bylaw links detected in this result set.
                    </Text>
                  ) : (
                    data.interviewMode.keyBylawLinks.map((link, index) => (
                      <Text key={`${link.url}-${index}`} size="sm">
                        {index + 1}.{" "}
                        <Anchor href={link.url} target="_blank" rel="noreferrer">
                          {link.title}
                        </Anchor>{" "}
                        <Text span color="dimmed">
                          ({link.domain})
                        </Text>
                      </Text>
                    ))
                  )}
                </Box>

                <Box>
                  <Text size="sm" className={styles.sectionLabel}>
                    Top 3 project risks
                  </Text>
                  {data.interviewMode.topRisks.map((risk, index) => (
                    <Text key={`${risk}-${index}`} size="sm">
                      {index + 1}. {risk}
                    </Text>
                  ))}
                </Box>
              </Stack>
            </Card>

            <Card withBorder radius="md" p="lg" className={styles.interviewCard}>
              <Stack spacing="sm">
                <Text weight={700}>Permit Sequence (Longest Process First)</Text>
                <Text size="sm" color="dimmed">
                  {data.permitPlan.sequencingNote}
                </Text>

                <SimpleGrid cols={2} spacing="md" breakpoints={[{ maxWidth: "md", cols: 1 }]}>
                  {data.permitPlan.permits.map((permit) => (
                    <Card key={permit.permitName} withBorder radius="md" p="md" className={styles.resultCard}>
                      <Stack spacing={6}>
                        <Group spacing="xs">
                          <Badge variant="outline">Priority #{permit.priorityRank}</Badge>
                          <Badge variant="light">{permit.estimatedWaitText}</Badge>
                          <Badge color="gray" variant="light">
                            {permit.category}
                          </Badge>
                        </Group>
                        <Text weight={600}>{permit.permitName}</Text>
                        <Text size="sm" color="dimmed">
                          Why first: {permit.whyStartEarly}
                        </Text>
                        <Text size="sm" className={styles.sectionLabel}>
                          Information required
                        </Text>
                        {permit.requiredInformation.map((item, index) => (
                          <Text key={`${permit.permitName}-${index}`} size="sm">
                            {index + 1}. {item}
                          </Text>
                        ))}
                      </Stack>
                    </Card>
                  ))}
                </SimpleGrid>
              </Stack>
            </Card>

            <Card withBorder radius="md" p="lg" className={styles.briefCard}>
              <Stack spacing="sm">
                <Text weight={700}>Information Across All Permits (Effort Sorted)</Text>
                <Text size="sm" color="dimmed">
                  Sorted by the longest permit wait time that depends on each information item.
                </Text>
                {data.permitPlan.informationAcrossPermits.map((item) => (
                  <Card key={`${item.info}-${item.effortRank}`} withBorder radius="md" p="sm">
                    <Stack spacing={6}>
                      <Group spacing="xs">
                        <Badge variant="outline">Effort #{item.effortRank}</Badge>
                        <Badge variant="light">{item.longestWaitWeeks} weeks max</Badge>
                        <Badge
                          color={item.sharedAcrossPermits ? "teal" : "gray"}
                          variant="light"
                        >
                          {item.sharedAcrossPermits ? "Shared" : "Single Permit"}
                        </Badge>
                      </Group>
                      <Text size="sm">{item.info}</Text>
                      <Text size="xs" color="dimmed">
                        Used by: {item.usedByPermits.join(", ")}
                      </Text>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </Card>

            <Card withBorder radius="md" p="lg" className={styles.briefCard}>
              <Stack spacing="sm">
                <Group position="apart" align="flex-start">
                  <Text weight={700}>Client Brief Export</Text>
                  <Group spacing="xs">
                    <Button size="xs" variant="light" onClick={() => void copyBrief()}>
                      Copy Brief
                    </Button>
                    <Button size="xs" variant="default" onClick={downloadBrief}>
                      Download .md
                    </Button>
                  </Group>
                </Group>

                {copyState === "copied" ? (
                  <Text size="xs" color="teal">
                    Brief copied to clipboard.
                  </Text>
                ) : null}
                {copyState === "error" ? (
                  <Text size="xs" color="red">
                    Clipboard copy failed. Use Download instead.
                  </Text>
                ) : null}

                <Text component="pre" className={styles.briefPre}>
                  {clientBrief}
                </Text>
              </Stack>
            </Card>

            <Card withBorder radius="md" p="lg">
              <Stack spacing={8}>
                <Text weight={600}>Checklist to validate next</Text>
                {data.checklist.map((item, index) => (
                  <Text key={`${item}-${index}`} size="sm">
                    {index + 1}. {item}
                  </Text>
                ))}
                <Text size="xs" color="dimmed">
                  Exa search query: {data.queryUsed}
                </Text>
                <Text size="xs" color="dimmed">
                  {data.disclaimer}
                </Text>
              </Stack>
            </Card>

            {data.results.length === 0 ? (
              <Alert color="yellow" radius="md">
                No regulation sources found for that prompt. Try adding a city,
                province/state, and project type.
              </Alert>
            ) : (
              <SimpleGrid cols={2} spacing="md" breakpoints={[{ maxWidth: "md", cols: 1 }]}>
                {data.results.map((result) => (
                  <Card key={result.url} withBorder radius="md" p="lg" className={styles.resultCard}>
                    <Stack spacing="xs">
                      <Group spacing="xs">
                        <Badge variant="light">{result.domain}</Badge>
                        {typeof result.score === "number" ? (
                          <Badge variant="outline">Score {result.score.toFixed(3)}</Badge>
                        ) : null}
                      </Group>
                      <Title order={3} className={styles.resultTitle}>
                        {result.title}
                      </Title>
                      <Text size="sm">{result.snippet}</Text>
                      <Anchor href={result.url} target="_blank" rel="noreferrer">
                        Open Source
                      </Anchor>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Stack>
        ) : null}
      </Container>
    </Box>
  );
};

export default HomePage;
