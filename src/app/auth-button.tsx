'use client';
import { signIn, signOut } from "next-auth/react";
import Image from "next/image";
import { Button } from "~/components/ui/button";

export default function AuthButton(props: { loggedIn: boolean }) {
    if (props.loggedIn) {
        return (
            <Button onClick={() => signOut()}>
                Sign Out
            </Button>
        );
    }

    return (
        <Button
            className="flex flex-row "
            onClick={() => signIn("google")}
        >
            <Image
                width={24}
                height={24}
                alt="Google Logo"
                className="w-6 mr-3"
                loading="lazy"
                src="https://authjs.dev/img/providers/google.svg"
            />
            Sign in with Google
        </Button>
    );
}
