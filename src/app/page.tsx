import { getServerAuthSession } from "~/server/auth";
import AuthButton from "./auth-button";
import Link from "next/link";
import { Role } from "~/server/db/types";

export default async function Home() {
    const session = await getServerAuthSession();

    function ActionButton(props: { role: Role | undefined }) {
        if (props.role === Role.APPLICANT) {
            return (
                <Link
                    className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
                    href="/apply"
                >
                    Start your application
                </Link>
            );
        } else if (props.role === Role.ADMIN || props.role === Role.MEMBER) {
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
        <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
            <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
                <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
                    Applicant Portal
                </h1>
                <div className="flex flex-col items-center gap-2">
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
    );
}

