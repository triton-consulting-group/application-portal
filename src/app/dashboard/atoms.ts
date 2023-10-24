import { createInsertSchema } from "drizzle-zod";
import { atom } from "jotai";
import { z } from "zod";
import { applicationQuestions, recruitmentCycles } from "~/server/db/schema";

const formSchema = createInsertSchema(recruitmentCycles);
type RecruitmentCycle = z.infer<typeof formSchema>
export const recruitmentCyclesAtom = atom<RecruitmentCycle[]>([]);

/**
 * The currently selected recruitment cycle from the combo box
 */
export const selectedRecruitmentCycleAtom = atom<string>("");


const questionSchema = createInsertSchema(applicationQuestions);
export const applicationQuestionsAtom = atom<z.infer<typeof questionSchema>[]>([]);


