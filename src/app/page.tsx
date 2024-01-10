import { getServerAuthSession } from "~/server/auth";
import AuthButton from "./auth-button";
import Link from "next/link";
import { Role } from "~/server/db/types";
import { api } from "~/trpc/server";
import { Instagram } from "lucide-react";
import Image from "next/image";
import { Button } from "~/components/ui/button";

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
                        <Button>
                            <Link href="https://www.instagram.com/ucsdtcg/">
                                <Instagram />
                                @ucsdtcg
                            </Link>
                        </Button>
                    </div>
                );
            }

            const application = await api.application.getUserApplicationByCycleId.query(activeCycle.id);

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

    return (
        <div className="min-h-screen flex flex-col">
            <div className="pl-4 pt-2">
                <Image alt="TCG Logo" height={48} width={136} src="/logo.png" />
            </div>
            <main className="flex flex-col grow items-center justify-center text-primary-background">
                <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
                    <h1 className="text-5xl text-center font-extrabold tracking-tight sm:text-[5rem]">
                        Applicant Portal
                    </h1>
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex flex-col items-center justify-center gap-4">
                            <p className="text-center text-2xl">
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

