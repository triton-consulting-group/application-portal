import { ReactNode, useState } from "react";
import { Button } from "./button";

export default function FlickerButton({
    onClick,
    defaultContent,
    flickerContent,
    duration,
}: {
    onClick: () => void,
    defaultContent: ReactNode,
    flickerContent: ReactNode,
    duration: number
}) {
    const [alt, setAlt] = useState<boolean>(false);
    const handleClick = () => {
        setAlt(true);
        setTimeout(() => setAlt(false), duration)
        onClick();
    };

    return (
        <Button variant="ghost" onClick={handleClick}>
            {alt ? flickerContent : defaultContent}
        </Button>
    )
}
