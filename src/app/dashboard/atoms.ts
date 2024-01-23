import { atom } from "jotai";
import type { RecruitmentCycle } from "../types";

// all the recruitment cycles 
export const recruitmentCyclesAtom = atom<RecruitmentCycle[]>([]);

// The currently selected recruitment cycle from the combo box
export const selectedRecruitmentCycleAtom = atom<string>("");

