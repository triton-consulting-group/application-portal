import { type ReactNode, useState, forwardRef, type MouseEventHandler, type MouseEvent } from "react";
import { Button, type ButtonProps } from "./button";

export interface FlickerButtonProps extends ButtonProps {
    defaultContent: ReactNode,
    flickerContent: ReactNode,
    duration: number
}

/**
 * Button that when pressed, changes its content to flickerContent for duration, then changes back
 * to the defaultContent
 */
const FlickerButton = forwardRef<HTMLButtonElement, FlickerButtonProps>(function FlickerButton({
    onClick,
    defaultContent,
    flickerContent,
    duration,
    ...props
}: {
    onClick?: MouseEventHandler<HTMLButtonElement>,
    defaultContent: ReactNode,
    flickerContent: ReactNode,
    duration: number,
}, ref) {
    const [alt, setAlt] = useState<boolean>(false);
    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
        setAlt(true);
        setTimeout(() => setAlt(false), duration);
        if (onClick) onClick(e);
    };

    return (
        <Button variant="ghost" onClick={handleClick} ref={ref} {...props}>
            {alt ? flickerContent : defaultContent}
        </Button>
    );
});

export default FlickerButton;
