"use client";

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "src/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "src/components/ui/popover";
import { cn } from "src/lib/utils";
import { useEffect, useState } from "react";
import { Button } from "src/components/ui/button";
import CreateRecruitmentCycle from "./create-recruitment-cycle";
import { useHydrateAtoms } from 'jotai/utils';
import { recruitmentCyclesAtom, selectedRecruitmentCycleAtom } from "./atoms";
import { useAtom } from "jotai";
import { type RecruitmentCycle } from "../types";
import { api } from "~/trpc/react";

export default function RecruitmentCycleCombobox({
    createOption, recruitmentCycles, className
}: {
    createOption: boolean,
    recruitmentCycles: RecruitmentCycle[],
    className: string
}) {
    useHydrateAtoms([[recruitmentCyclesAtom, recruitmentCycles]]);
    const [cycles, setCycles] = useAtom(recruitmentCyclesAtom);
    const [open, setOpen] = useState(false);
    const [value, setValue] = useAtom(selectedRecruitmentCycleAtom);
    // this query will keep the atom updated
    api.recruitmentCycle.getAll.useQuery(undefined, {
        onSuccess: data => setCycles(data)
    });

    useEffect(() => {
        setValue(cycles?.[0]?.id ?? "");
    }, [setValue, cycles]);


    function CreateNew({ createOption }: { createOption: boolean }) {
        if (!createOption) {
            return null;
        }

        return (
            <CommandItem className="cursor-pointer">
                <CreateRecruitmentCycle />
            </CommandItem>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild className={className}>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[240px] justify-between"
                >
                    {value
                        ? cycles.find((cycle) => cycle.id === value)?.displayName
                        : "Select recruitment cycle..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-0">
                <Command>
                    <CommandInput placeholder="Search recruitment cycle..." />
                    <CommandEmpty>No recruitment cycle found.</CommandEmpty>
                    <CommandGroup>
                        {cycles.map((cycle) => (
                            <CommandItem
                                key={cycle.id}
                                value={cycle.id}
                                onSelect={(currentValue) => {
                                    setValue(currentValue === value ? "" : currentValue);
                                    setOpen(false);
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value === cycle.id ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {cycle.displayName}
                            </CommandItem>
                        ))}
                        <CreateNew createOption={createOption}></CreateNew>
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

