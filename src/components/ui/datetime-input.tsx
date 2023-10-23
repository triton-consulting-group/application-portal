"use client";

import React, { ChangeEvent } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Button } from "./button"
import { cn } from "src/lib/utils"
import { Calendar } from "./calendar"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Input } from "./input"
import { Label } from "./label"
import { ControllerRenderProps } from "react-hook-form"

export default function DateTimeInput(props: { field: ControllerRenderProps<any>}) {
    const [time, setTime] = React.useState<string>();

    const changeTime = (e: ChangeEvent<HTMLInputElement>): void => {
        const date: Date = props.field.value;
        const [hours, minutes] = e.target.value.split(":");
        if (!hours || !minutes) {
            throw new Error("Invalid time")
        }
        date.setHours(parseInt(hours));
        date.setMinutes(parseInt(minutes));

        setTime(e.target.value);
        props.field.onChange(date);
    }

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

        props.field.onChange(date);
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-[280px] justify-start text-left font-normal",
                        !props.field.value && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {props.field.value ? format(props.field.value, "Pp") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={props.field.value}
                    onSelect={changeDate}
                    disabled={(date) => date < new Date() }
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
    )
}

