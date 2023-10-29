import { atom } from "jotai";
import { ApplicationQuestion, RecruitmentCycle } from "../types";

export const recruitmentCyclesAtom = atom<RecruitmentCycle[]>([]);

/**
 * The currently selected recruitment cycle from the combo box
 */
export const selectedRecruitmentCycleAtom = atom<string>("");

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


