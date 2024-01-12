"use client";

import type { RecruitmentCycle } from "./types";

export default function RecruitmentCycleText({
    activeCycle,
}: {
    activeCycle: RecruitmentCycle | undefined
}) {
    const formatDate = (d: Date): string => {
        return `${d.toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} ${d.toLocaleTimeString()}`;
    };

    if (activeCycle) {
        return (
            <h2 className="text-center text-lg">
                We are currently recruiting for {activeCycle.displayName}! <br />
                Applications are due {formatDate(activeCycle.endTime)}
            </h2>
        );
    } else {
        return (
            <h2 className="text-center text-lg">
                We aren't currently accepting applications. <br />
                Follow us on Instagram to be notified of when our Fall and Winter recruitment begins!
            </h2>
        );
    }
}
