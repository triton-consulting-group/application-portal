"use client";

import Realistic from "react-canvas-confetti/dist/presets/realistic";
import type { TConductorInstance } from "react-canvas-confetti/dist/types";

/**
 * Cute confetti effect for the application confirmation screen
 */
export default function Confetti() {
    const onInit = ({
        conductor
    }: {
        conductor: TConductorInstance
    }): void => {
        conductor.shoot();
    };

    return (
        <Realistic
            onInit={onInit}
            className="top-0 left-0 h-screen w-screen pointer-events-none fixed"
        />
    );
}
