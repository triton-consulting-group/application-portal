import { z } from "zod";
import { applicantProcedure, createTRPCRouter } from "../trpc";
import { applicationQuestions, applicationResponses, applications, recruitmentCycles } from "~/server/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { TRPCError } from "@trpc/server";
import { getValidator } from "~/lib/validate-question";

export const applicationResponseRouter = createTRPCRouter({
    getUserResponsesByCycleId: applicantProcedure 
        .input(z.string())
        .query(({ ctx, input }) => {
            return ctx.db
                .select()
                .from(applicationResponses)
                .leftJoin(applications, eq(applications.id, applicationResponses.id))
                .where(
                    and(
                        eq(applications.userId, ctx.session.user.id),
                        eq(applications.cycleId, input)
                    )
                )
        }),
    create: applicantProcedure 
        .input(createInsertSchema(applicationResponses))
        .mutation(async ({ ctx, input }) => {
            const [latestCycle] = await ctx.db
                .select()
                .from(recruitmentCycles)
                .where(
                    sql`${recruitmentCycles.startTime} <= UTC_TIMESTAMP() AND ${recruitmentCycles.endTime} >= UTC_TIMESTAMP()`
                );
            
            const [application] = await ctx.db
                .select()
                .from(applications)
                .where(and(
                    eq(applications.userId, ctx.session.user.id),
                    eq(applications.id, input.applicationId)
                ));

            if (!latestCycle || latestCycle.id !== application?.cycleId) {
                throw new TRPCError({
                    message: "Invalid cycle id",
                    code: "BAD_REQUEST"
                });
            }

            const [question] = await ctx.db
                .select()
                .from(applicationQuestions)
                .where(and(
                    eq(applicationQuestions.cycleId, application.cycleId),
                    eq(applicationQuestions.id, input.questionId)
                ));
            
            if (!question) {
                throw new TRPCError({
                    message: "Invalid question id",
                    code: "BAD_REQUEST"
                });
            }

            const validationResult = getValidator(question).safeParse(input.value);
            
            if (!validationResult.success) {
                throw new TRPCError({
                    message: validationResult.error.message,
                    code: "BAD_REQUEST"
                }); 
            }
            
            return ctx.db.insert(applicationResponses).values(input);
        }),
    edit: applicantProcedure
        .input(z.object({ responseId: z.string(), value: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const [latestCycle] = await ctx.db
                .select()
                .from(recruitmentCycles)
                .where(
                    sql`${recruitmentCycles.startTime} <= UTC_TIMESTAMP() AND ${recruitmentCycles.endTime} >= UTC_TIMESTAMP()`
                );

            if (!latestCycle) {
                throw new TRPCError({
                    message: "Can't edit responses outside of the latest recruitment cycle",
                    code: "BAD_REQUEST"
                });
            }
            
            const [response] = await ctx.db
                .select()
                .from(applicationResponses)
                .where(eq(applicationResponses.id, input.responseId))

            const [application] = await ctx.db
                .select()
                .from(applications)
                .where(and(
                    eq(applications.userId, ctx.session.user.id),
                    eq(applications.cycleId, latestCycle.id)
                ));
            
            if (!application || application.id !== response?.applicationId) {
                throw new TRPCError({
                    message: "Can't edit responses outside of the latest recruitment cycle",
                    code: "BAD_REQUEST"
                });
            }

            const [question] = await ctx.db
                .select()
                .from(applicationQuestions)
                .where(and(
                    eq(applicationQuestions.id, response.questionId)
                ));
            
            if (!question) {
                throw new TRPCError({
                    message: "The response's associated question can't be found",
                    code: "BAD_REQUEST"
                });
            }

            const validationResult = getValidator(question).safeParse(input.value);
            
            if (!validationResult.success) {
                throw new TRPCError({
                    message: validationResult.error.message,
                    code: "BAD_REQUEST"
                }); 
            }
            
            return ctx.db
                .update(applicationResponses)
                .set(input)
                .where(eq(applicationResponses.id, input.responseId));
        })
});
