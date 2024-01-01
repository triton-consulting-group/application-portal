import { type ReactNode, useState } from "react";
import { Button } from "./button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";

export default function FlickerButton({
    onClick,
    defaultContent,
    flickerContent,
    duration,
    tooltipContent,
}: {
    onClick: () => void,
    defaultContent: ReactNode,
    flickerContent: ReactNode,
    duration: number,
    tooltipContent?: ReactNode
}) {
    const [alt, setAlt] = useState<boolean>(false);
    const handleClick = () => {
        setAlt(true);
        setTimeout(() => setAlt(false), duration);
        onClick();
    };

    return (
        <>
            {tooltipContent ? (
                <TooltipProvider delayDuration={100}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" onClick={handleClick}>
                                {alt ? flickerContent : defaultContent}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {tooltipContent}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) : (
                <Button variant="ghost" onClick={handleClick}>
                    {alt ? flickerContent : defaultContent}
                </Button>
            )}
        </>
    );
}
