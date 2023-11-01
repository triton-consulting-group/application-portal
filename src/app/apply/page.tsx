import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";
import { Role } from "~/server/db/types";
import { api } from "~/trpc/server";
import { ApplicationForm } from "./application-form";
import { Application } from "../types";

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

    const applicationQuestions = await api.applicationQuestion.getByCycle.query(latestCycle.id);
    const applicationResponses = await api.applicationResponse.getUserResponsesByCycleId.query(latestCycle.id);

    return (
        <div className="px-12 py-16">
            <h1 className="text-3xl mb-2">Application</h1>
            <h2 className="mb-6">
                This form autosaves! Feel free to leave and finish your application later. Once you are
                ready to submit, click "Submit Application"
            </h2>
            <ApplicationForm
                questions={applicationQuestions}
                responses={applicationResponses}
                application={application as Application}
            ></ApplicationForm>
        </div>
    )
}

