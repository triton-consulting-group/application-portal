import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import {
    adminProcedure,
    createTRPCRouter,
    publicProcedure,
} from "~/server/api/trpc";
import { applicationQuestions } from "~/server/db/schema";
import { FieldType } from "~/server/db/types";

export const applicationQuestionRouter = createTRPCRouter({
    getByCycle: publicProcedure
        .input(z.string())
        .query(({ ctx, input }) => {
            return ctx.db
                .select()
                .from(applicationQuestions)
                .where(eq(applicationQuestions.cycleId, input));
        }),
    create: adminProcedure
        .input(createInsertSchema(applicationQuestions))
        .mutation(async ({ ctx, input }) => {
            if (input.type === FieldType.STRING) {
                if ((input.minLength ?? 0) >= (input.maxLength ?? 1)) {
                    throw new TRPCError({
                        message: "Minimum length can't be larger than maximum length",
                        code: "BAD_REQUEST"
                    });
                }
            }

            if (!input.order) {
                const biggestOrder = await (ctx.db
                    .select({ maxOrder: sql<number | null>`MAX(${applicationQuestions.order})` })
                    .from(applicationQuestions)
                    .where(eq(applicationQuestions.cycleId, input.cycleId))
                );
                input.order = (biggestOrder[0]?.maxOrder ?? 0) + 1
            }

            const question = await ctx.db
                .insert(applicationQuestions)
                .values(input);
            return question;
        }),
    delete: adminProcedure
        .input(z.string())
        .mutation(async ({ ctx, input }) => {
            return await ctx.db.delete(applicationQuestions).where(eq(applicationQuestions.id, input));
        }),
    edit: adminProcedure
        .input(createInsertSchema(applicationQuestions))
        .mutation(async ({ ctx, input }) => {
            if (!input.id) {
                throw new TRPCError({
                    message: "No id specified",
                    code: "BAD_REQUEST"
                });
            }

            const updateResult = await ctx.db
                .update(applicationQuestions)
                .set(input)
                .where(eq(applicationQuestions.id, input.id));

            if (updateResult.rowsAffected === 0) {
                throw new TRPCError({
                    message: `Question with id ${input.id} not found`,
                    code: "NOT_FOUND"
                });
            }

            return updateResult;
        })
});
