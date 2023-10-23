import { createInsertSchema } from "drizzle-zod";
import { atom } from "jotai";
import { z } from "zod";
import { recruitmentCycles } from "~/server/db/schema";

const formSchema = createInsertSchema(recruitmentCycles);
type RecruitmentCycle = z.infer<typeof formSchema>
export const recruitmentCycleAtom = atom<RecruitmentCycle[]>([]);

