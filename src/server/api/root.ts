import { recruitmentCycleRouter } from "~/server/api/routers/recruitment-cycle";
import { createTRPCRouter } from "~/server/api/trpc";
import { applicationQuestionRouter } from "./routers/application-question";
import { applicationRouter } from "./routers/application";
import { applicationResponseRouter } from "./routers/application-response";
import { recruitmentCyclePhaseRouter } from "./routers/recruitment-cycle-phase";
import { applicationNoteRouter } from "./routers/application-note";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
    recruitmentCycle: recruitmentCycleRouter,
    recruitmentCyclePhase: recruitmentCyclePhaseRouter,
    applicationQuestion: applicationQuestionRouter,
    application: applicationRouter,
    applicationResponse: applicationResponseRouter,
    applicationNote: applicationNoteRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
