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

const questionSchema = createInsertSchema(applicationQuestions, { options: z.string().array() });
type ApplicationQuestion = z.infer<typeof questionSchema>;
const applicationQuestionsPrimitiveAtom = atom<ApplicationQuestion[]>([]);
export const applicationQuestionsAtom = atom<
    ApplicationQuestion[],
    [ApplicationQuestion[]],
    void
>(
    (get) => get(applicationQuestionsPrimitiveAtom),
    (get, set, update) => {
        update.sort((a, b) => {
            return (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
        });
        set(applicationQuestionsPrimitiveAtom, update);
    }
);


