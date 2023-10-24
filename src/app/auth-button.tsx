'use client';
import { signIn, signOut } from "next-auth/react";

export default function AuthButton(props: { loggedIn: boolean }) {
    if (props.loggedIn) {
        return (
            <button
                className="flex flex-row rounded-full bg-white text-black px-4 py-2"
                onClick={() => signOut()}
            >
                Sign Out
            </button>
        );
    }

    return (
        <button
            className="flex flex-row rounded-full bg-white text-black px-4 py-2"
            onClick={() => signIn("google")}
        >
            <img
                className="w-6 mr-3"
                loading="lazy"
                src="https://authjs.dev/img/providers/google.svg"
            />
            Sign in with Google
        </button>
    );
}
