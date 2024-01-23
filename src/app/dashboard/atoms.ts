import { atom } from "jotai";
import type { ApplicationWithResponses, RecruitmentCycle } from "../types";

export const recruitmentCyclesAtom = atom<RecruitmentCycle[]>([]);

// The currently selected recruitment cycle from the combo box
export const selectedRecruitmentCycleAtom = atom<string>("");

export const applicationsAtom = atom<ApplicationWithResponses[]>([]);

