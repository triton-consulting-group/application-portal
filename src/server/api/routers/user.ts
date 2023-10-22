import { eq } from "drizzle-orm";
import { z } from "zod";

import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "~/server/api/trpc";
import { users } from "~/server/db/schema";

export const postRouter = createTRPCRouter({
    getById: publicProcedure.input(z.string()).query(({ ctx, input }) => {
        return ctx.db.select().from(users).where(eq(users.id, input))
    })
});
