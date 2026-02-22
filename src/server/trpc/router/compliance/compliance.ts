import { ComplianceAgent } from "@server/agents/compliance";
import { publicProcedure, router } from "@server/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const searchInput = z.object({
  projectPrompt: z.string().trim().min(10).max(500),
  numResults: z.number().min(3).max(12).optional(),
});

const answerInput = z.object({
  question: z.string().trim().min(10).max(500),
  jurisdictionHint: z.string().trim().min(3).max(120).optional(),
});

const similarInput = z.object({
  seedUrl: z.string().trim().url(),
  numResults: z.number().min(3).max(12).optional(),
});

export const complianceRouter = router({
  search: publicProcedure
    .input(searchInput)
    .mutation(async ({ input }) => {
      return safe(
        () => ComplianceAgent.search(input),
        "Unable to search compliance regulations.",
      );
    }),
  answer: publicProcedure
    .input(answerInput)
    .mutation(async ({ input }) => {
      return safe(
        () => ComplianceAgent.answer(input),
        "Unable to answer compliance question.",
      );
    }),
  similar: publicProcedure
    .input(similarInput)
    .mutation(async ({ input }) => {
      return safe(
        () => ComplianceAgent.similar(input),
        "Unable to find similar compliance sources.",
      );
    }),
});

async function safe<T>(
  fn: () => Promise<T>,
  fallbackMessage: string,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : fallbackMessage;
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message,
      cause: error,
    });
  }
}
