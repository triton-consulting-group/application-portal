import { getServerAuthSession } from "~/server/auth";
import AuthButton from "./auth-button";
import Link from "next/link";
import { Role } from "~/server/db/types";
import { api } from "~/trpc/server";
import { Instagram } from "lucide-react";

export default async function Home() {
    const session = await getServerAuthSession();

    async function ActionButton({ role }: { role: Role | undefined }) {
        if (role === Role.APPLICANT) {
            const activeCycle = await api.recruitmentCycle.getActive.query();
            if (!activeCycle) {
                return (
                    <div className="flex flex-col items-center gap-y-2">
                        <h2 className="text-center">
                            We aren't currently accepting applications. <br />
                            Follow us on Instagram to be notified of when our Fall and Winter recruitment begins!
                        </h2>
                        <Link
                            className="flex max-w-xs w-fit flex-row gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
                            href="https://www.instagram.com/ucsdtcg/"
                        >
                            <Instagram />
                            @ucsdtcg
                        </Link>
                    </div>
                )
            }

            const application = await api.application.getUserApplicationByCycleId.query(activeCycle.id);

            return (
                <Link
                    className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
                    href="/apply"
                >
                    {application ? "Continue your application" : "Start your application"}
                </Link>
            );
        } else if (role === Role.ADMIN || role === Role.MEMBER) {
            return (
                <Link
                    className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
                    href="/dashboard"
                >
                    Dashboard
                </Link>
            );
        }
    }

    return (
        <div className="min-h-screen flex flex-col">
            <div className="pl-4 pt-2">
                <img className="h-12" src="/logo.png" />
            </div>
            <main className="flex flex-col grow items-center justify-center text-white">
                <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
                    <h1 className="text-5xl text-center font-extrabold tracking-tight sm:text-[5rem]">
                        Applicant Portal
                    </h1>
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex flex-col items-center justify-center gap-4">
                            <p className="text-center text-2xl text-white">
                                {session && <span>Welcome back {session.user?.name?.split(" ")[0]}</span>}
                            </p>
                        </div>
                        <ActionButton role={session?.user.role}></ActionButton>
                        <AuthButton loggedIn={session !== null}></AuthButton>
                    </div>
                </div>
            </main>
        </div>
    );
}

