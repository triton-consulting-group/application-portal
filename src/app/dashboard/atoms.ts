import { atom } from "jotai";
import { ApplicationQuestion, ApplicationWithResponses, RecruitmentCycle, RecruitmentCyclePhase } from "../types";

export const recruitmentCyclesAtom = atom<RecruitmentCycle[]>([]);

// The currently selected recruitment cycle from the combo box
export const selectedRecruitmentCycleAtom = atom<string>("");

export const applicationsAtom = atom<ApplicationWithResponses[]>([]);

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

const recruitmentCyclePhasesPrimitiveAtom = atom<RecruitmentCyclePhase[]>([]);
export const recruitmentCyclePhasesAtom = atom<
    RecruitmentCyclePhase[],
    [RecruitmentCyclePhase[]],
    void
>(
    (get) => get(recruitmentCyclePhasesPrimitiveAtom),
    (get, set, update) => {
        update.sort((a, b) => {
            return (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
        });
        set(recruitmentCyclePhasesPrimitiveAtom, update);
    }
);

