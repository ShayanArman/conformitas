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
import styles from "./SimilarRegulationFinder.module.css";

const SAMPLE_SEED_URL =
  "https://vancouver.ca/home-property-development/building-or-renovating.aspx";
const HTTP_URL_REGEX = /^https?:\/\/.+/i;
const SEED_URL_DEMOS = [
  {
    label: "Vancouver Building",
    url: "https://vancouver.ca/home-property-development/building-or-renovating.aspx",
  },
  {
    label: "Vancouver Rezoning",
    url: "https://vancouver.ca/home-property-development/rezoning.aspx",
  },
  {
    label: "BC Building Codes",
    url: "https://www2.gov.bc.ca/gov/content/industry/construction-industry/building-codes-standards",
  },
] as const;

export default function SimilarRegulationFinder() {
  const [seedUrl, setSeedUrl] = useState(SAMPLE_SEED_URL);

  const similarMutation = trpc.compliance.similar.useMutation();
  const canRun = HTTP_URL_REGEX.test(seedUrl.trim());

  const runSimilar = (nextSeedUrl: string) => {
    const cleaned = nextSeedUrl.trim();
    if (!HTTP_URL_REGEX.test(cleaned)) return;

    similarMutation.mutate({
      seedUrl: cleaned,
      numResults: 6,
    });
  };

  const submit = () => {
    runSimilar(seedUrl);
  };

  const runDemo = (seedDemoUrl: string) => {
    setSeedUrl(seedDemoUrl);
    runSimilar(seedDemoUrl);
  };

  return (
    <Card withBorder radius="md" p="lg" className={styles.panel}>
      <Stack spacing="sm">
        <Group spacing="xs" align="center">
          <Title order={3} className={styles.title}>
            Similar Projects & Required Regulations
          </Title>
          <Badge color="orange" variant="light">
            Exa findSimilar
          </Badge>
        </Group>

        <Text size="sm" color="dimmed">
          Independent module: provide one project reference URL and Exa finds
          similar projects/sources, then infers likely regulations they required.
        </Text>

        <TextInput
          label="Seed project URL"
          placeholder="https://..."
          value={seedUrl}
          onChange={(event) => setSeedUrl(event.currentTarget.value)}
        />

        <Box className={styles.demoSection}>
          <Text size="xs" className={styles.demoLabel}>
            Demo sources (1-click run)
          </Text>
          <Group spacing="xs">
            {SEED_URL_DEMOS.map((demo) => (
              <Button
                key={demo.label}
                size="xs"
                variant="light"
                onClick={() => runDemo(demo.url)}
                disabled={similarMutation.isLoading}
              >
                {demo.label}
              </Button>
            ))}
          </Group>
        </Box>

        <Group spacing="xs">
          <Button
            onClick={submit}
            loading={similarMutation.isLoading}
            disabled={!canRun || similarMutation.isLoading}
          >
            Find Similar Projects
          </Button>
          <Button
            variant="default"
            onClick={() => setSeedUrl(SAMPLE_SEED_URL)}
            disabled={similarMutation.isLoading}
          >
            Use Sample URL
          </Button>
        </Group>

        <Text size="xs" color="dimmed">
          Last seed URL: {similarMutation.variables?.seedUrl || "No URL searched yet"}
        </Text>

        {similarMutation.error ? (
          <Alert color="red" radius="md">
            {similarMutation.error.message}
          </Alert>
        ) : null}

        {similarMutation.isLoading ? (
          <Flex className={styles.loadingState}>
            <Loader size="sm" mr="sm" />
            <Text size="sm">Finding similar projects and inferring regulations...</Text>
          </Flex>
        ) : null}

        {similarMutation.data ? (
          <Stack spacing="sm">
            <Text size="xs" color="dimmed">
              {similarMutation.data.disclaimer}
            </Text>

            {similarMutation.data.noSimilarFound ? (
              <Alert color="yellow" radius="md">
                No similar projects found.
              </Alert>
            ) : (
              <SimpleGrid cols={2} spacing="md" breakpoints={[{ maxWidth: "md", cols: 1 }]}>
                {similarMutation.data.similarProjects.map((project, index) => (
                  <Card key={project.url} withBorder radius="md" p="md" className={styles.resultCard}>
                    <Stack spacing={6}>
                      <Group spacing="xs">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <Badge variant="light">{project.domain}</Badge>
                      </Group>

                      <Anchor href={project.url} target="_blank" rel="noreferrer">
                        {project.title}
                      </Anchor>

                      <Text size="sm">{project.summary}</Text>

                      <Text size="xs" color="dimmed">
                        Likely required regulations
                      </Text>
                      <Group spacing={6}>
                        {project.requiredRegulations.map((regulation) => (
                          <Badge key={`${project.url}-${regulation}`} variant="outline">
                            {regulation}
                          </Badge>
                        ))}
                      </Group>

                      {typeof project.similarityScore === "number" ? (
                        <Text size="xs" color="dimmed">
                          Similarity score: {project.similarityScore.toFixed(3)}
                        </Text>
                      ) : null}
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Stack>
        ) : null}
      </Stack>
    </Card>
  );
}
