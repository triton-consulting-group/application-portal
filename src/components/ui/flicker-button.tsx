import { type ReactNode, useState, forwardRef, type ForwardedRef } from "react";
import { Button } from "./button";

const FlickerButton = forwardRef(function FlickerButton({
    onClick,
    defaultContent,
    flickerContent,
    duration,
    ...props
}: {
    onClick: () => void,
    defaultContent: ReactNode,
    flickerContent: ReactNode,
    duration: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
}, ref: ForwardedRef<any>) {
    const [alt, setAlt] = useState<boolean>(false);
    const handleClick = () => {
        setAlt(true);
        setTimeout(() => setAlt(false), duration);
        onClick();
    };

    return (
        <Button variant="ghost" onClick={handleClick} ref={ref} {...props}>
            {alt ? flickerContent : defaultContent}
        </Button>
    );
});

export default FlickerButton;
