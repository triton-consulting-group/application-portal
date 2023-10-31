import { TRPCError } from "@trpc/server";
import { desc, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import {
    adminProcedure,
    createTRPCRouter,
    memberProcedure,
    publicProcedure,
} from "~/server/api/trpc";
import { recruitmentCycles } from "~/server/db/schema";

export const recruitmentCycleRouter = createTRPCRouter({
    getAll: memberProcedure
        .query(({ ctx }) => {
            return ctx.db.select().from(recruitmentCycles).orderBy(desc(recruitmentCycles.endTime));
        }),
    getActive: publicProcedure
        .query(async ({ ctx }) => {
            const [cycle] = await ctx.db
                .select()
                .from(recruitmentCycles)
                .where(
                    sql`${recruitmentCycles.startTime} <= UTC_TIMESTAMP() AND ${recruitmentCycles.endTime} >= UTC_TIMESTAMP()`
                )
                .limit(1);
            return cycle;
        }),
    create: adminProcedure
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
