import { getServerAuthSession } from "~/server/auth";
import AuthButton from "./auth-button";

export default async function Home() {
    const session = await getServerAuthSession();
    console.log(session)

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
                    <AuthButton loggedIn={session !== null}></AuthButton>
                </div>
            </div>
        </main>
    );
}

