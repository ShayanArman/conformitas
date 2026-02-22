import { complianceRouter } from "./compliance";
import { router } from "@server/trpc";

export const appRouter = router({
  compliance: complianceRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
