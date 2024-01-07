import { z } from "zod";
import { applicantProcedure, createTRPCRouter, memberProcedure, publicProcedure } from "../trpc";
import { applicationQuestions, applicationResponses, applications, recruitmentCycles } from "~/server/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { TRPCError } from "@trpc/server";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { FieldType } from "~/server/db/types";

const s3Client = new S3Client({ region: "us-west-1" });
const BUCKET_NAME = "tcg-application-portal-uploads";
export const applicationResponseRouter = createTRPCRouter({
    getUserResponsesByCycleId: applicantProcedure
        .input(z.string())
        .query(({ ctx, input }) => {
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
    getResponsesByCycleId: memberProcedure
        .input(z.string())
        .query(({ ctx, input }) => {
            return ctx.db
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

            if (application.userId !== ctx.session.user.id) {
                throw new TRPCError({
                    code: "FORBIDDEN"
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
            // if file upload has a previous response, delete it from s3
            if (response && question.type === FieldType.FILE_UPLOAD && response.value) {
                await s3Client.send(new DeleteObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: response.value,
                }));
            }

            return ctx.db
                .insert(applicationResponses)
                .values(input)
                .onDuplicateKeyUpdate({ set: { value: input.value } });
        }),
    getS3UploadUrl: applicantProcedure
        .input(z.string())
        .mutation(async ({ input }) => {
            const key = +(new Date()) + input;
            const url = await getSignedUrl(s3Client, new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key
            }), { expiresIn: 3600 });
            return { key, url };
        }),
    getS3DownloadUrl: publicProcedure
        .input(z.string())
        .query(async ({ input }) => {
            // ok theoretically applicants can access eachother's files if they know the file key 
            // given that the file key is a file name + time stamp, i think it is unlikely this happens
            return getSignedUrl(s3Client, new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: input
            }));
        })
});
