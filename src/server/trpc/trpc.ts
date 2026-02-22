import { type ProtectedContext, type Context } from "./context";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";


const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;

/**
 * Unprotected procedure
 **/
export const publicProcedure = t.procedure;

/**
 * Reusable middleware to ensure
 * users are logged in
 */
const isAuthed = t.middleware(({ ctx, next }) => {
  const nextCtx: ProtectedContext = {
    req: ctx.req,
  };

  return next({
    ctx: nextCtx,
  });
});

/**
 * Protected procedure
 **/
export const protectedProcedure = t.procedure.use(isAuthed);
