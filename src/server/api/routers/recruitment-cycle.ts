import { createInsertSchema } from "drizzle-zod";
import {
    createTRPCRouter,
    publicProcedure,
} from "~/server/api/trpc";
import { recruitmentCycles } from "~/server/db/schema";

export const recruitmentCycleRouter = createTRPCRouter({
    recruitmentCycleList: publicProcedure
        .query(({ ctx }) => {
            return ctx.db.select().from(recruitmentCycles)
        }),
    recruitmentCycleCreate: publicProcedure
        .input(createInsertSchema(recruitmentCycles))
        .mutation(async ({ ctx, input }) => {
            const cycle = await ctx.db.insert(recruitmentCycles).values(input);
            return cycle;
        })
});
