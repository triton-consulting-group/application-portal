import { Loader2 } from "lucide-react";

/**
 * Loading spinner page displayed while data is fetched in /dashboard/page.tsx
 */
export default function Loading() {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="animate-spin" />
        </div>
    );
}
