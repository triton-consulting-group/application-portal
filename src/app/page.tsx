import { getServerAuthSession } from "~/server/auth";
import AuthButton from "./auth-button";
import Link from "next/link";
import { Role } from "~/server/db/types";
import { api } from "~/trpc/server";
import { Instagram } from "lucide-react";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { Application, RecruitmentCycle } from "./types";

function RecruitmentCycleText({
    activeCycle,
}: {
    activeCycle: RecruitmentCycle | undefined
}) {
    const formatDate = (d: Date): string => {
        return `${d.toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} ${d.toLocaleTimeString()}`;
    };

    if (activeCycle) {
        return (
            <h2 className="text-center text-lg">
                We are currently recruiting for {activeCycle.displayName}! <br />
                Applications are due {formatDate(activeCycle.endTime)}
            </h2>
        );
    } else {
        return (
            <h2 className="text-center text-lg">
                We aren't currently accepting applications. <br />
                Follow us on Instagram to be notified of when our Fall and Winter recruitment begins!
            </h2>
        );
    }
}

function ActionButton({
    role,
    application,
    activeCycle
}: {
    role: Role | undefined,
    application: Application | undefined,
    activeCycle: RecruitmentCycle | undefined
}) {
    if (role === Role.APPLICANT) {
        if (!activeCycle) {
            return (
                <Button>
                    <Link href="https://www.instagram.com/ucsdtcg/" className="flex items-center gap-x-2">
                        <Instagram />
                        @ucsdtcg
                    </Link>
                </Button>
            );
        }

        return (
            <Button>
                <Link href="/apply">
                    {!application
                        ? "Start your application"
                        : application.submitted
                            ? "View your submitted application"
                            : "Continue your application"
                    }
                </Link>
            </Button>
        );
    } else if (role === Role.ADMIN || role === Role.MEMBER) {
        return (
            <Button>
                <Link href="/dashboard">
                    Dashboard
                </Link>
            </Button>
        );
    }
}

export default async function Home() {
    const session = await getServerAuthSession();
    const activeCycle = await api.recruitmentCycle.getActive.query();
    const application = (session?.user.role === Role.APPLICANT && activeCycle) ? await api.application.getUserApplicationByCycleId.query(activeCycle.id) : undefined;

    return (
        <div className="min-h-screen flex flex-col">
            <div className="pl-4 pt-2">
                <Image alt="TCG Logo" height={48} width={136} src="/logo.png" />
            </div>
            <main className="flex flex-col grow items-center justify-center text-primary-background">
                <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
                    <div className="flex flex-col gap-y-4">
                        <h1 className="text-5xl text-center font-extrabold tracking-tight sm:text-[5rem]">
                            Applicant Portal
                        </h1>
                    </div>
                    <div className="flex flex-col items-center gap-y-3">
                        <p className="text-center text-2xl">
                            {session && <span>Welcome back {session.user?.name?.split(" ")[0]}</span>}
                        </p>
                        {session?.user.role === Role.APPLICANT &&
                            <RecruitmentCycleText activeCycle={activeCycle} />
                        }
                        <div className="flex gap-x-3">
                            <ActionButton
                                activeCycle={activeCycle}
                                application={application}
                                role={session?.user.role}
                            ></ActionButton>
                            <AuthButton loggedIn={session !== null}></AuthButton>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

