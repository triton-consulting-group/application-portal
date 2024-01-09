import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import { getServerAuthSession } from "~/server/auth";
import { Role } from "~/server/db/types";
import { api } from "~/trpc/server";
import Confetti from "./confetti";

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
    if (!application || !application.submitted) {
        redirect("/apply");
    }

    return (
        <>
            <Confetti/>
            <div className="flex flex-col h-screen justify-center items-center gap-y-3">
                <h1 className="text-5xl font-extrabold">Application Submitted!</h1>
                <p className="text-center">
                    Thank you for submitting your application!
                    Application updates will be sent to you via email.<br />
                    If you have any questions regarding your application, email <a href="mailto:board.tcg@gmail.com">board.tcg@gmail.com</a>.
                </p>
                <div className="flex gap-x-2">
                    <Button variant="link" className="py-0">
                        <Link href="/">Back to home</Link>
                    </Button>
                    <Button variant="link" className="py-0">
                        <Link href="/apply">View Your Application</Link>
                    </Button>
                </div>
            </div>
        </>
    );
}

