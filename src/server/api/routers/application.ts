import { z } from "zod";
import { applicantProcedure, createTRPCRouter, memberProcedure } from "../trpc";
import { applicationQuestions, applicationResponses, applications, recruitmentCyclePhases, recruitmentCycles, users } from "~/server/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getValidator } from "~/lib/validate-question";

export const applicationRouter = createTRPCRouter({
    getUserApplicationByCycleId: applicantProcedure
        .input(z.string())
        .query(async ({ ctx, input }) => {
            const [application] = await ctx.db
                .select()
                .from(applications)
                .where(
                    and(
                        eq(applications.userId, ctx.session.user.id),
                        eq(applications.cycleId, input)
                    )
                );
            return application;
        }),
    getApplicationsByCycleId: memberProcedure
        .input(z.string())
        .query(({ ctx, input }) => {
            return ctx.db
                .select()
                .from(applications)
                .where(eq(applications.cycleId, input))
                .leftJoin(users, eq(users.id, applications.userId))
        }),
    create: applicantProcedure
        .mutation(async ({ ctx }) => {
            const [latestCycle] = await ctx.db
                .select()
                .from(recruitmentCycles)
                .where(
                    sql`${recruitmentCycles.startTime} <= UTC_TIMESTAMP() AND ${recruitmentCycles.endTime} >= UTC_TIMESTAMP()`
                )
                .limit(1);

            if (!latestCycle) {
                throw new TRPCError({ message: "No active application cycle", code: "BAD_REQUEST" });
            }

            const existingApplication = await ctx.db
                .select()
                .from(applications)
                .where(
                    and(
                        eq(applications.userId, ctx.session.user.id),
                        eq(applications.cycleId, latestCycle.id)
                    )
                );

            if (existingApplication.length > 0) {
                throw new TRPCError({ message: "Application already exists", code: "BAD_REQUEST" });
            }

            return ctx.db.insert(applications).values({ cycleId: latestCycle.id, userId: ctx.session.user.id });
        }),
    submit: applicantProcedure
        .input(z.string())
        .mutation(async ({ ctx, input }) => {
            const [latestCycle] = await ctx.db
                .select()
                .from(recruitmentCycles)
                .where(
                    sql`${recruitmentCycles.startTime} <= UTC_TIMESTAMP() AND ${recruitmentCycles.endTime} >= UTC_TIMESTAMP()`
                )
                .limit(1);
            const [application] = await ctx.db
                .select()
                .from(applications)
                .where(and(
                    eq(applications.id, input),
                    eq(applications.userId, ctx.session.user.id)
                ));

            if (!application) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            if (application.cycleId !== latestCycle?.id) {
                throw new TRPCError({
                    message: "Recruitment cycle is over, so applications can't be submitted",
                    code: "BAD_REQUEST"
                });
            }

            const questions = await ctx.db
                .select()
                .from(applicationQuestions)
                .where(eq(applicationQuestions.cycleId, latestCycle.id));

            const responses = await ctx.db
                .select()
                .from(applicationResponses)
                .where(and(
                    eq(applicationResponses.applicationId, application.id),
                ));

            // validate recruitment cycle questions
            for (const question of questions) {
                const responseVal = (responses.find(r => r.questionId === question.id))?.value;
                const parsedResult = getValidator(question).safeParse(responseVal);
                if (!parsedResult.success) {
                    throw new TRPCError({
                        message: parsedResult.error.message,
                        code: "BAD_REQUEST"
                    })
                }
            }

            return ctx.db.update(applications).set({ submitted: true }).where(eq(applications.id, input));
        }),
    updatePhase: memberProcedure
        .input(z.object({ applicationId: z.string(), phaseId: z.string().nullable() }))
        .mutation(async ({ ctx, input }) => {
            if (input.phaseId) {
                const [[application], [phase]] = await Promise.all([
                    ctx.db
                        .select()
                        .from(applications)
                        .where(eq(applications.id, input.applicationId)),
                    ctx.db
                        .select()
                        .from(recruitmentCyclePhases)
                        .where(eq(recruitmentCyclePhases.id, input.phaseId)),
                ]);

                if (!application) {
                    throw new TRPCError({
                        message: "Application not found",
                        code: "NOT_FOUND"
                    });
                }

                if (!phase) {
                    throw new TRPCError({
                        message: "Recruitment cycle phase not found",
                        code: "NOT_FOUND"
                    });
                }

                if (application.cycleId !== phase.cycleId) {
                    throw new TRPCError({
                        message: "The application and phase do not belong to the same recruitment cycle",
                        code: "BAD_REQUEST"
                    });
                }
            }

            return ctx.db
                .update(applications)
                .set({ phaseId: input.phaseId })
                .where(eq(applications.id, input.applicationId));
        })
});

