/* eslint-disable */
import React, { type ChangeEvent } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { cn } from "src/lib/utils";
import { Calendar } from "./calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Input } from "./input";
import { Label } from "./label";

export default function DateTimeInput({
    onChange,
    value,
    afterDate
}: {
    onChange: (...event: any) => void,
    value: Date,
    afterDate: Date
}) {
    const [time, setTime] = React.useState<string>("");

    const changeTime = (e: ChangeEvent<HTMLInputElement>): void => {
        const date: Date = value;
        const [hours, minutes] = e.target.value.split(":");
        if (!hours || !minutes) {
            throw new Error("Invalid time");
        }
        date.setHours(parseInt(hours));
        date.setMinutes(parseInt(minutes));

        setTime(e.target.value);
        onChange(date);
    };

    const changeDate = (date: Date | undefined): void => {
        if (date) {
            if (!time) {
                setTime("00:00");
            } else {
                const [hours, minutes] = time.split(":");
                if (!hours || !minutes) {
                    throw new Error("Invalid time");
                }
                date.setHours(parseInt(hours));
                date.setMinutes(parseInt(minutes));
            }
        } else {
            setTime("");
        }

        onChange(date);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-[280px] justify-start text-left font-normal",
                        !value && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? format(value, "Pp") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={changeDate}
                    disabled={(date) => date < afterDate}
                    defaultMonth={value ?? afterDate}
                    required
                    initialFocus
                />
                <Label className="ml-4 mb-3">Pick a time</Label>
                <Input
                    type="time"
                    value={time}
                    required
                    onChange={changeTime}
                ></Input>
            </PopoverContent>
        </Popover>
    );
}

