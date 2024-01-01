import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { applicationNotes, applicationQuestions, applicationResponses, applications, recruitmentCyclePhases, recruitmentCycles, users } from "~/server/db/schema";

const recruitmentCycleSchema = createSelectSchema(recruitmentCycles);
export type RecruitmentCycle = z.infer<typeof recruitmentCycleSchema>;

const recruitmentCyclePhaseSchema = createSelectSchema(recruitmentCyclePhases);
export type RecruitmentCyclePhase = z.infer<typeof recruitmentCyclePhaseSchema>;

const applicationQuestionSchema = createSelectSchema(applicationQuestions, { options: z.string().array() });
export type ApplicationQuestion = z.infer<typeof applicationQuestionSchema>;

const applicationSchema = createSelectSchema(applications);
export type Application = z.infer<typeof applicationSchema>;

const applicationNoteSchema = createSelectSchema(applicationNotes);
export type ApplicationNote = z.infer<typeof applicationNoteSchema>;

const applicationResponseSchema = createSelectSchema(applicationResponses);
export type ApplicationResponse = z.infer<typeof applicationResponseSchema>;

const userSchema = createSelectSchema(users);
export type User = z.infer<typeof userSchema>;

export type ApplicationWithResponses = Application & Pick<User, "email" | "name"> & { phase?: RecruitmentCyclePhase, responses: ApplicationResponse[] };

