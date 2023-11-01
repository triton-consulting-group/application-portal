import { late, z } from "zod";
import { applicantProcedure, createTRPCRouter } from "../trpc";
import { applicationQuestions, applicationResponses, applications, recruitmentCycles } from "~/server/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { TRPCError } from "@trpc/server";

export const applicationResponseRouter = createTRPCRouter({
    getUserResponsesByCycleId: applicantProcedure
        .input(z.string())
        .query(async ({ ctx, input }) => {
            return ctx.db
                .select({
                    id: applicationResponses.id,
                    questionId: applicationResponses.questionId,
                    value: applicationResponses.value,
                    applicationId: applicationResponses.questionId
                })
                .from(applicationResponses)
                .innerJoin(applications, and(
                    eq(applications.id, applicationResponses.applicationId),
                    eq(applications.cycleId, input),
                    eq(applications.userId, ctx.session.user.id)
                ));
        }),
    createOrUpdate: applicantProcedure
        .input(createInsertSchema(applicationResponses))
        .mutation(async ({ ctx, input }) => {
            const [[latestCycle], [application], [question], [response]] = await Promise.all([
                ctx.db
                    .select()
                    .from(recruitmentCycles)
                    .where(
                        sql`${recruitmentCycles.startTime} <= UTC_TIMESTAMP() AND ${recruitmentCycles.endTime} >= UTC_TIMESTAMP()`
                    ),
                ctx.db
                    .select()
                    .from(applications)
                    .where(and(
                        eq(applications.userId, ctx.session.user.id),
                        eq(applications.id, input.applicationId)
                    )),
                ctx.db
                    .select()
                    .from(applicationQuestions)
                    .where(and(
                        eq(applicationQuestions.id, input.questionId)
                    )),
                ctx.db
                    .select()
                    .from(applicationResponses)
                    .where(and(
                        eq(applicationResponses.applicationId, input.applicationId),
                        eq(applicationResponses.questionId, input.questionId)
                    )),
            ]);

            if (!latestCycle || latestCycle.id !== application?.cycleId) {
                throw new TRPCError({
                    message: "Invalid cycle id",
                    code: "BAD_REQUEST"
                });
            }

            if (application.submitted) {
                throw new TRPCError({
                    message: "Can't update response when the assosciated application is submitted",
                    code: "BAD_REQUEST"
                });
            }

            if (!question || question.cycleId !== latestCycle.id) {
                throw new TRPCError({
                    message: "Invalid question id",
                    code: "BAD_REQUEST"
                });
            }

            if (response) {
                return ctx.db
                    .update(applicationResponses)
                    .set(input)
                    .where(eq(applicationResponses.id, response.id))
            } else {
                return ctx.db
                    .insert(applicationResponses)
                    .values(input)
                    .onDuplicateKeyUpdate({ set: { value: input.value } })
            }
        }),
});
