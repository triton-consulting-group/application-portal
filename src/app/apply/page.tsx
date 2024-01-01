import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";
import { Role } from "~/server/db/types";
import { api } from "~/trpc/server";
import { ApplicationForm } from "./application-form";
import { type Application } from "../types";

export default async function Apply() {
    const session = await getServerAuthSession();

    if (!session) {
        redirect("/api/auth/signin");
    } else if (session.user.role !== Role.APPLICANT) {
        redirect("/dashboard");
    }

    const latestCycle = await api.recruitmentCycle.getActive.query();

    if (!latestCycle) {
        redirect("/");
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

