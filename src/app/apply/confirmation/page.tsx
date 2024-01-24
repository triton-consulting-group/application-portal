import { permanentRedirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import { getServerAuthSession } from "~/server/auth";
import { Role } from "~/server/db/types";
import { api } from "~/trpc/server";
import Confetti from "./confetti";

/**
 * Confirmation screen for applicants after they submit their application
 * Redirects applicants to the /apply page if they haven't submitted their application yet
 */
export default async function Confirmation() {
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

    const application = await api.application.getUserApplicationByCycleId.query(latestCycle.id);
    if (!application || !application.submitted) {
        permanentRedirect("/apply");
    }
    return (
        <>
            <Confetti />
            <div className="flex flex-col h-screen justify-center items-center gap-y-3">
                <h1 className="text-5xl font-extrabold">Application Submitted!</h1>
                <p className="text-center">
                    Thank you for submitting your application!
                    Application updates will be sent to you via email.<br />
                    If you have any questions regarding your application, email <a href="mailto:board.tcg@gmail.com">board.tcg@gmail.com</a>.
                </p>
                <div className="flex gap-x-2">
                    <Button variant="link" className="py-0">
                        <a href="/">Back to home</a>
                    </Button>
                    <Button variant="link" className="py-0">
                        <a href="/apply">View Your Application</a>
                    </Button>
                </div>
            </div>
        </>
    );
}

