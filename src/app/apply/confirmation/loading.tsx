import { Loader2 } from "lucide-react";

/**
 * Loading screen for the application confirmation page
 */
export default function Loading() {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="animate-spin" />
        </div>
    );
}
