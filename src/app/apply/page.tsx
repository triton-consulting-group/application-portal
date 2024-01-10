import { permanentRedirect } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";
import { Role } from "~/server/db/types";
import { api } from "~/trpc/server";
import { ApplicationForm } from "./application-form";
import { type Application } from "../types";

export default async function Apply() {
    // TODO: Replace permanentRedirect with redirect 
    // https://github.com/vercel/next.js/issues/59800
    const session = await getServerAuthSession();

    if (!session) {
        permanentRedirect("/api/auth/signin");
    } else if (session.user.role !== Role.APPLICANT) {
        permanentRedirect("/dashboard");
    }

    const latestCycle = await api.recruitmentCycle.getActive.query();

    if (!latestCycle) {
        permanentRedirect("/");
    }

    let application = await api.application.getUserApplicationByCycleId.query(latestCycle.id);
    if (!application) {
        await api.application.create.mutate();
        application = await api.application.getUserApplicationByCycleId.query(latestCycle.id);
    }

    const [applicationQuestions, applicationResponses] = await Promise.all([
        api.applicationQuestion.getByCycle.query(latestCycle.id),
        api.applicationResponse.getUserResponsesByCycleId.query(latestCycle.id)
    ]);

    return (
        <div className="px-12 py-16">
            <ApplicationForm
                questions={applicationQuestions}
                responses={applicationResponses}
                application={application as Application}
                cycle={latestCycle}
            ></ApplicationForm>
        </div>
    );
}

