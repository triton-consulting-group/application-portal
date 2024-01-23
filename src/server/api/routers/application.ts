import { z } from "zod";
import { applicantProcedure, createTRPCRouter, memberProcedure } from "../trpc";
import { applicationQuestions, applicationResponses, applications, recruitmentCyclePhases, recruitmentCycles, users } from "~/server/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getValidator } from "~/lib/validate-question";
import { SESClient, SendTemplatedEmailCommand } from "@aws-sdk/client-ses";
import { ApplicationWithResponses } from "~/app/types";

const client = new SESClient();
const EMAIL_TEMPLATE_NAME = "confirmation_template";

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
    getSubmittedApplicationsWithResponsesByCycleId: memberProcedure
        .input(z.string())
        .query(async ({ ctx, input }) => {
            const [questions, applicationsWithUser, responses] = await Promise.all([
                ctx.db
                    .select()
                    .from(applicationQuestions)
                    .where(eq(applicationQuestions.cycleId, input))
                    .orderBy(applicationQuestions.order),
                ctx.db
                    .select()
                    .from(applications)
                    .where(and(
                        eq(applications.cycleId, input),
                        eq(applications.submitted, true)
                    ))
                    .leftJoin(users, eq(users.id, applications.userId))
                    .leftJoin(recruitmentCyclePhases, eq(applications.phaseId, recruitmentCyclePhases.id)),
                ctx.db
                    .select({
                        id: applicationResponses.id,
                        questionId: applicationResponses.questionId,
                        value: applicationResponses.value,
                        applicationId: applicationResponses.applicationId
                    })
                    .from(applicationResponses)
                    .leftJoin(applications, and(
                        eq(applications.id, applicationResponses.applicationId),
                        eq(applications.cycleId, input)
                    ))
            ]);

            return applicationsWithUser.map((app): ApplicationWithResponses => ({
                ...app.application,
                email: app?.user?.email ?? "",
                name: app?.user?.name ?? "",
                phase: app?.recruitmentCyclePhase,
                responses: questions.map(q =>
                    responses.find(r => r.applicationId === app.application.id && r.questionId === q.id) ??
                    {
                        value: "",
                        questionId: q.id,
                        applicationId: app.application.id,
                        id: app.application.id + q.id
                    }
                )
            }));
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
            const [[latestCycle], [application]] = await Promise.all([
                ctx.db
                    .select()
                    .from(recruitmentCycles)
                    .where(
                        sql`${recruitmentCycles.startTime} <= UTC_TIMESTAMP() AND ${recruitmentCycles.endTime} >= UTC_TIMESTAMP()`
                    )
                    .limit(1),
                ctx.db
                    .select()
                    .from(applications)
                    .where(and(
                        eq(applications.id, input),
                        eq(applications.userId, ctx.session.user.id)
                    ))
            ]);

            if (!application) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            if (application.cycleId !== latestCycle?.id) {
                throw new TRPCError({
                    message: "Recruitment cycle is over, so applications can't be submitted",
                    code: "BAD_REQUEST"
                });
            }

            const [questions, responses] = await Promise.all([
                ctx.db
                    .select()
                    .from(applicationQuestions)
                    .where(eq(applicationQuestions.cycleId, latestCycle.id)),
                ctx.db
                    .select()
                    .from(applicationResponses)
                    .where(and(
                        eq(applicationResponses.applicationId, application.id),
                    ))
            ]);

            // validate recruitment cycle questions
            for (const question of questions) {
                const responseVal = (responses.find(r => r.questionId === question.id))?.value;
                const parsedResult = getValidator(question, true).safeParse(responseVal);
                if (!parsedResult.success) {
                    throw new TRPCError({
                        message: parsedResult.error.message,
                        code: "BAD_REQUEST"
                    });
                }
            }

            const res = await ctx.db.update(applications).set({ submitted: true }).where(eq(applications.id, input));
            if (ctx.session.user.email) {
                void client.send(new SendTemplatedEmailCommand({
                    Source: "no-reply@ucsdtcg.org",
                    Destination: {
                        ToAddresses: [ctx.session.user.email]
                    },
                    Template: EMAIL_TEMPLATE_NAME,
                    TemplateData: JSON.stringify({
                        cycleName: latestCycle.displayName
                    })
                }));
            }

            return res;
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

