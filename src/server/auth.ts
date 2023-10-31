import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import {
    getServerSession,
    type DefaultSession,
    type NextAuthOptions,
} from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { env } from "~/env.mjs";
import { db } from "~/server/db";
import { mysqlTable, sessions, users } from "~/server/db/schema";
import { Role } from "./db/types";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
    interface Session extends DefaultSession {
        user: {
            id: string;
            role: Role;
        } & DefaultSession["user"];
    }

    interface User {
        role: Role;
    }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
    callbacks: {
        session: ({ session, user }) => ({
            ...session,
            user: {
                ...session.user,
                id: user.id,
                role: user.role
            },
        }),
    },
    adapter: {
        ...DrizzleAdapter(db, mysqlTable),
        // https://github.com/nextauthjs/next-auth/pull/8561
        async getSessionAndUser(data) {
            const sessionAndUsers = await db
                .select({
                    session: sessions,
                    user: users
                })
                .from(sessions)
                .where(eq(sessions.sessionToken, data))
                .innerJoin(users, eq(users.id, sessions.userId));
            return sessionAndUsers[0] ?? null;
        }
    },
    providers: [
        GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET
        })
        /**
         * ...add more providers here.
         *
         * Most other providers require a bit more work than the Discord provider. For example, the
         * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
         * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
         *
         * @see https://next-auth.js.org/providers/github
         */
    ],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => getServerSession(authOptions);
