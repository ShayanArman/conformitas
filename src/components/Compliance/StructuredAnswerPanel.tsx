import {
  Alert,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { trpc } from "@utils/trpc";
import { useState } from "react";
import styles from "./StructuredAnswerPanel.module.css";

const DEFAULT_QUESTION =
  "What should I validate first for permitting and life-safety before starting a 4-storey condo project in Kitsilano Vancouver BC?";
const DEFAULT_JURISDICTION = "Kitsilano, Vancouver, BC, Canada";
const QUESTION_DEMOS = [
  {
    label: "Permit Sequence",
    question:
      "What permit sequence should I follow before excavation for a four-storey condo in Kitsilano Vancouver BC?",
    jurisdiction: "Kitsilano, Vancouver, BC, Canada",
  },
  {
    label: "Life Safety",
    question:
      "What are the highest-risk fire and life-safety compliance issues for a mid-rise residential project in Vancouver BC?",
    jurisdiction: "Vancouver, BC, Canada",
  },
  {
    label: "Occupancy Readiness",
    question:
      "What inspections and documentation are typically required before final occupancy approval for a new condo building?",
    jurisdiction: "British Columbia, Canada",
  },
] as const;

export default function StructuredAnswerPanel() {
  const [question, setQuestion] = useState(DEFAULT_QUESTION);
  const [jurisdiction, setJurisdiction] = useState(DEFAULT_JURISDICTION);

  const answerMutation = trpc.compliance.answer.useMutation();
  const canAsk = question.trim().length >= 10;

  const ask = (nextQuestion: string, nextJurisdiction: string) => {
    const cleanedQuestion = nextQuestion.trim();
    if (cleanedQuestion.length < 10) return;

    answerMutation.mutate({
      question: cleanedQuestion,
      jurisdictionHint: nextJurisdiction.trim() || undefined,
    });
  };

  const submit = () => {
    ask(question, jurisdiction);
  };

  const runDemo = (demo: (typeof QUESTION_DEMOS)[number]) => {
    setQuestion(demo.question);
    setJurisdiction(demo.jurisdiction);
    ask(demo.question, demo.jurisdiction);
  };

  const reset = () => {
    setQuestion(DEFAULT_QUESTION);
    setJurisdiction(DEFAULT_JURISDICTION);
  };

  return (
    <Card withBorder radius="md" p="lg" className={styles.panel}>
      <Stack spacing="sm">
        <Box>
          <Group spacing="xs" align="center">
            <Title order={3} className={styles.title}>
              Compliance Copilot
            </Title>
            <Badge color="teal" variant="light">
              Exa Answer API
            </Badge>
          </Group>
          <Text size="sm" color="dimmed">
            Independent module using Exa structured answers (`outputSchema`) + citations.
          </Text>
        </Box>

        <TextInput
          label="Compliance question"
          placeholder="Ask a focused compliance question..."
          value={question}
          onChange={(event) => setQuestion(event.currentTarget.value)}
        />

        <TextInput
          label="Jurisdiction hint"
          placeholder="City/region to anchor the answer"
          value={jurisdiction}
          onChange={(event) => setJurisdiction(event.currentTarget.value)}
        />

        <Box className={styles.demoSection}>
          <Text size="xs" className={styles.demoLabel}>
            Demo questions (1-click run)
          </Text>
          <Group spacing="xs">
            {QUESTION_DEMOS.map((demo) => (
              <Button
                key={demo.label}
                size="xs"
                variant="light"
                onClick={() => runDemo(demo)}
                disabled={answerMutation.isLoading}
              >
                {demo.label}
              </Button>
            ))}
          </Group>
        </Box>

        <Group spacing="xs">
          <Button
            onClick={submit}
            loading={answerMutation.isLoading}
            disabled={!canAsk || answerMutation.isLoading}
          >
            Ask Compliance Copilot
          </Button>
          <Button
            variant="default"
            onClick={reset}
            disabled={answerMutation.isLoading}
          >
            Reset Prompt
          </Button>
        </Group>

        <Text size="xs" color="dimmed">
          Last question: {answerMutation.variables?.question || "No question submitted yet"}
        </Text>

        {answerMutation.error ? (
          <Alert color="red" radius="md">
            {answerMutation.error.message}
          </Alert>
        ) : null}

        {answerMutation.isLoading ? (
          <Flex className={styles.loadingState}>
            <Loader size="sm" mr="sm" />
            <Text size="sm">Asking Exa Answer API with structured output...</Text>
          </Flex>
        ) : null}

        {answerMutation.data ? (
          <Stack spacing="md">
            <Card withBorder radius="md" p="md" className={styles.answerCard}>
              <Stack spacing={6}>
                <Text className={styles.sectionTitle}>Direct Answer</Text>
                <Text size="sm">{answerMutation.data.answer.conciseAnswer}</Text>
                <Text size="xs" color="dimmed">
                  {answerMutation.data.disclaimer}
                </Text>
              </Stack>
            </Card>

            <SimpleGrid cols={2} spacing="md" breakpoints={[{ maxWidth: "sm", cols: 1 }]}>
              <Card withBorder radius="md" p="md">
                <Stack spacing={6}>
                  <Text className={styles.sectionTitle}>Likely Permit Classes</Text>
                  {answerMutation.data.answer.likelyPermits.map((item, index) => (
                    <Text key={`${item}-${index}`} size="sm">
                      {index + 1}. {item}
                    </Text>
                  ))}
                </Stack>
              </Card>

              <Card withBorder radius="md" p="md">
                <Stack spacing={6}>
                  <Text className={styles.sectionTitle}>Governing Bodies</Text>
                  <Group spacing={6}>
                    {answerMutation.data.answer.governingBodies.map((body) => (
                      <Badge key={body} variant="outline">
                        {body}
                      </Badge>
                    ))}
                  </Group>
                </Stack>
              </Card>
            </SimpleGrid>

            <Card withBorder radius="md" p="md">
              <Stack spacing={6}>
                <Text className={styles.sectionTitle}>Critical Risks</Text>
                {answerMutation.data.answer.criticalRisks.map((risk, index) => (
                  <Text key={`${risk}-${index}`} size="sm">
                    {index + 1}. {risk}
                  </Text>
                ))}
                <Text size="sm">
                  <Text span weight={600}>
                    Recommended next step:{" "}
                  </Text>
                  {answerMutation.data.answer.nextStep}
                </Text>
              </Stack>
            </Card>

            <Card withBorder radius="md" p="md">
              <Stack spacing={6}>
                <Text className={styles.sectionTitle}>Citations</Text>
                {answerMutation.data.citations.length === 0 ? (
                  <Text size="sm" color="dimmed">
                    No citations returned by Exa for this answer.
                  </Text>
                ) : (
                  answerMutation.data.citations.map((citation) => (
                    <Box key={citation.url} className={styles.citationRow}>
                      <Anchor href={citation.url} target="_blank" rel="noreferrer">
                        {citation.title}
                      </Anchor>
                      <Text size="xs" color="dimmed">
                        {citation.domain}
                        {citation.publishedDate ? ` • ${citation.publishedDate}` : ""}
                      </Text>
                      <Text size="sm">{citation.textSnippet}</Text>
                    </Box>
                  ))
                )}
              </Stack>
            </Card>
          </Stack>
        ) : null}
      </Stack>
    </Card>
  );
}
