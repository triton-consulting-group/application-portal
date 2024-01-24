import { Loader2 } from "lucide-react";

/**
 * Displayed while data is being fetched in the home component. Simple loading spinner 
 */
export default function Loading() {
    return (
        <div className="flex justify-center items-center h-screen w-screen fixed top-0 left-0">
            <Loader2 className="animate-spin" />
        </div>
    );
}
