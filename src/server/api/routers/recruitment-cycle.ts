import { TRPCError } from "@trpc/server";
import { desc } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import {
    createTRPCRouter,
    publicProcedure,
} from "~/server/api/trpc";
import { recruitmentCycles } from "~/server/db/schema";

export const recruitmentCycleRouter = createTRPCRouter({
    recruitmentCycleList: publicProcedure
        .query(({ ctx }) => {
            return ctx.db.select().from(recruitmentCycles).orderBy(desc(recruitmentCycles.endTime));
        }),
    recruitmentCycleCreate: publicProcedure
        .input(createInsertSchema(recruitmentCycles))
        .mutation(async ({ ctx, input }) => {
            if (input.startTime >= input.endTime) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Start time can not be after end time."
                });
            }
            const cycle = await ctx.db.insert(recruitmentCycles).values(input);
            return cycle;
        })
});
