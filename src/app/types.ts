import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { applicationQuestions, applicationResponses, applications, recruitmentCycles, users } from "~/server/db/schema";

const recruitmentCycleSchema = createSelectSchema(recruitmentCycles);
export type RecruitmentCycle = z.infer<typeof recruitmentCycleSchema>;

const applicationQuestionSchema = createSelectSchema(applicationQuestions, { options: z.string().array() });
export type ApplicationQuestion = z.infer<typeof applicationQuestionSchema>;

const applicationSchema = createSelectSchema(applications);
export type Application = z.infer<typeof applicationSchema>;

const applicationResponseSchema = createSelectSchema(applicationResponses);
export type ApplicationResponse = z.infer<typeof applicationResponseSchema>;

const userSchema = createSelectSchema(users)
export type User = z.infer<typeof userSchema>;

