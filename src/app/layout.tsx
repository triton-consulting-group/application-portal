import "~/styles/globals.css";

import { Inter } from "next/font/google";
import { cookies } from "next/headers";

import { TRPCReactProvider } from "~/trpc/react";
import { ThemeProvider } from "~/components/theme-provider";
import JotaiProvider from "./jotai-provider";

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from "~/components/ui/sonner";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
});

export const metadata = {
    title: "Applicant Portal",
    icons: [{ rel: "icon", url: "/favicon.ico" }],
};

/**
 * Root layout for the application that wraps the app with all necessary providers
 */
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`font-sans ${inter.variable}`}>
                {/*
                The nextJS compiler automatically removes the .dark class (unused), which is 
                required for dark mode, so create a fake div to make sure it isn't removed
                */}
                <div className="dark hidden"></div>
                <JotaiProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <TRPCReactProvider cookies={cookies().toString()}>
                            {children}
                        </TRPCReactProvider>
                    </ThemeProvider>
                </JotaiProvider>
                <Toaster />
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
