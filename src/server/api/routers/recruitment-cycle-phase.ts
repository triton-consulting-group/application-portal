import { recruitmentCyclePhases } from "~/server/db/schema";
import { adminProcedure, createTRPCRouter, memberProcedure } from "../trpc";
import { type SQL, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { TRPCError } from "@trpc/server";

export const recruitmentCyclePhaseRouter = createTRPCRouter({
    getByCycleId: memberProcedure
        .input(z.string())
        .query(({ ctx, input }) => {
            return ctx.db
                .select()
                .from(recruitmentCyclePhases)
                .where(eq(recruitmentCyclePhases.cycleId, input));
        }),
    create: adminProcedure
        .input(createInsertSchema(recruitmentCyclePhases))
        .mutation(async ({ ctx, input }) => {
            if (!input.order) {
                const biggestOrder = await (ctx.db
                    .select({ maxOrder: sql<number | null>`MAX(${recruitmentCyclePhases.order})` })
                    .from(recruitmentCyclePhases)
                    .where(eq(recruitmentCyclePhases.cycleId, input.cycleId))
                );
                input.order = (biggestOrder[0]?.maxOrder ?? 0) + 1;
            }

            return ctx.db.insert(recruitmentCyclePhases).values(input);
        }),
    delete: adminProcedure
        .input(z.string())
        .mutation(({ ctx, input }) => {
            return ctx.db.delete(recruitmentCyclePhases).where(eq(recruitmentCyclePhases.id, input));
        }),
    update: adminProcedure
        .input(createInsertSchema(recruitmentCyclePhases))
        .mutation(async ({ ctx, input }) => {
            if (!input.id) {
                throw new TRPCError({
                    message: "No id specified",
                    code: "BAD_REQUEST"
                });
            }

            const updateResult = await ctx.db
                .update(recruitmentCyclePhases)
                .set(input)
                .where(eq(recruitmentCyclePhases.id, input.id));

            if (updateResult.rowsAffected === 0) {
                throw new TRPCError({
                    message: `Phase with id ${input.id} not found`,
                    code: "NOT_FOUND"
                });
            }

            return updateResult;
        }),
    reorder: adminProcedure
        .input(z.string().array())
        .mutation(({ ctx, input }) => {
            const sqlChunks: SQL[] = [
                sql`(CASE`,
                ...input.map((id, idx) => {
                    return sql`WHEN ${recruitmentCyclePhases.id} = ${id} THEN ${idx}`;
                }),
                sql`END)`
            ];

            return ctx.db
                .update(recruitmentCyclePhases)
                .set({ order: sql.join(sqlChunks, sql.raw(" ")) })
                .where(inArray(recruitmentCyclePhases.id, input));
        }),
});
