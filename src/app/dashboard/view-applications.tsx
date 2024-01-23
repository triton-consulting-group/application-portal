"use client";

import { useAtom } from "jotai";
import { selectedRecruitmentCycleAtom } from "./atoms";
import { useState } from "react";
import { api } from "~/trpc/react";
import { type ApplicationWithResponses } from "../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Check, Copy, Download, KanbanSquare, Loader2, Mails, Plus, Table, X } from "lucide-react";
import ApplicationTable from "./application-table";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Form, FormField, FormItem } from "~/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { useForm } from "react-hook-form";
import { Badge } from "~/components/ui/badge";
import ApplicationBoard from "./application-board";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";
import FlickerButton from "~/components/ui/flicker-button";

enum FilterType {
    CONTAIN = "Contains",
    EQUAL = "Equals",
    NOT_EQUAL = "Doesn't Equal",
};
type Filter = { questionId: string, value: string, type: FilterType };

const filterApplicationsByNameOrEmail = (
    applications: ApplicationWithResponses[],
    field: keyof Pick<ApplicationWithResponses, "name" | "email">,
    value: string
): ApplicationWithResponses[] => {
    return applications.filter(a => a[field]?.toLowerCase().includes(value.toLowerCase())) ?? [];
};

export default function ViewApplications() {
    const [cycleId] = useAtom(selectedRecruitmentCycleAtom);
    const [searchQuery, setSearchQuery] = useState<string>("");

    const [filters, setFilters] = useState<Filter[]>([]);
    const createFilterForm = useForm<Filter>();

    const onFilterFormSave = () => {
        setFilters([createFilterForm.getValues(), ...filters]);
        createFilterForm.reset();
    };
    const removeFilter = (filter: Filter) => setFilters(filters.filter(f => f !== filter));

    const { data: questionsData, isLoading: questionsLoading } = api.applicationQuestion.getByCycle.useQuery(cycleId);
    const { data: applicationsData, isLoading: applicationsLoading } = api.application.getSubmittedApplicationsWithResponsesByCycleId.useQuery(cycleId, {
        select: data =>
            filterApplicationsByNameOrEmail(data, "name", searchQuery)
                .filter(a =>
                    filters.every(f => {
                        const response = a.responses.find(r => r.questionId === f.questionId);
                        if (!response) return false;
                        if (f.type === FilterType.EQUAL) return response.value.trim().toLowerCase() === f.value.toLowerCase();
                        if (f.type === FilterType.NOT_EQUAL) return response.value.trim().toLowerCase() !== f.value.toLowerCase();
                        if (f.type === FilterType.CONTAIN) return response.value.trim().toLowerCase().includes(f.value.toLowerCase());
                    })
                )
    });
    const { data: phasesData, isLoading: phasesLoading } = api.recruitmentCyclePhase.getByCycleId.useQuery(cycleId);

    const copyEmails = () => navigator.clipboard.writeText(applicationsData?.map(a => a.email).join(",") ?? "");
    const copyNames = () => navigator.clipboard.writeText(applicationsData?.map(a => a.name).join(",") ?? "");
    const exportApplications = () => {
        if (!questionsData) return;

        const sanitizeString = (s: string): string => {
            return `"${s.replaceAll('"', '"""')}"`;
        };

        const blob = new Blob([
            [
                ["Name", "Email", "Phase", questionsData.map(q => sanitizeString(q.displayName))].join(","),
                ...applicationsData?.map(a => [
                    sanitizeString(a.name ?? ""),
                    sanitizeString(a.email),
                    sanitizeString(a.phase?.displayName ?? ""),
                    ...a.responses.map(r => sanitizeString(r.value))
                ].join(",")) ?? ""
            ].join("\n")
        ], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style.cssText = "display: none";
        a.href = url;
        a.download = "application-export.csv";
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <>
            {questionsLoading || applicationsLoading || phasesLoading ? (
                <div className="flex justify-center">
                    <Loader2 className="animate-spin" />
                </div>
            ) : (
                <Tabs defaultValue="table">
                    <div className="flex justify-between items-center">
                        <Input
                            className="w-fit"
                            placeholder="Search by name..."
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            id="name-search"
                        />
                        <TabsList>
                            <TabsTrigger value="table">
                                <Table />
                            </TabsTrigger>
                            <TabsTrigger value="board">
                                <KanbanSquare />
                            </TabsTrigger>
                        </TabsList>
                    </div>
                    <div className="flex flex-col gap-y-2 mt-2">
                        <div className="flex justify-between items-center">
                            <div className="flex flex-row gap-x-4">
                                {filters.map(filter => (
                                    <Badge className="flex flex-row gap-x-2" key={filter.value}>
                                        "{questionsData?.find(q => q.id === filter.questionId)?.displayName}" {filter.type} "{filter.value}"
                                        <Button variant="ghost" className="p-0 h-fit" onClick={() => removeFilter(filter)}>
                                            <X className="h-4 w-4"></X>
                                        </Button>
                                    </Badge>
                                ))}
                                <Popover>
                                    <PopoverTrigger className="flex gap-x-1 w-fit text-sm" asChild>
                                        <Button variant="ghost">
                                            <Plus />
                                            Add filter
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="flex-col gap-y-2 w-max ml-8">
                                        <Form {...createFilterForm}>
                                            <form onSubmit={createFilterForm.handleSubmit(onFilterFormSave)} className="flex gap-x-4">
                                                <FormField
                                                    control={createFilterForm.control}
                                                    name="questionId"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Question column..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {questionsData?.map(q => (
                                                                        <SelectItem key={q.id} value={q.id}>{q.displayName}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={createFilterForm.control}
                                                    name="type"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Filter type..." />
                                                                    <SelectContent>
                                                                        {Object.values(FilterType).map(x => (
                                                                            <SelectItem key={x} value={x}>{x}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </SelectTrigger>
                                                            </Select>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={createFilterForm.control}
                                                    name="value"
                                                    render={({ field }) => (
                                                        <FormItem className="w-fit">
                                                            <Input type="text" placeholder="Value..." value={field.value ?? ""} onChange={field.onChange} />
                                                        </FormItem>
                                                    )}
                                                />
                                                <Button type="submit">Save</Button>
                                            </form>
                                        </Form>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div>
                                <TooltipProvider delayDuration={100}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" onClick={exportApplications}>
                                                <Download />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Export displayed applications to CSV</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider delayDuration={100}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <FlickerButton
                                                onClick={copyNames}
                                                defaultContent={<Copy />}
                                                flickerContent={<Check />}
                                                duration={1500}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Copy displayed applicant names</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider delayDuration={100}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <FlickerButton
                                                onClick={copyEmails}
                                                defaultContent={<Mails />}
                                                flickerContent={<Check />}
                                                duration={1500}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Copy displayed applicant emails</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                    </div>
                    <TabsContent value="table">
                        <ApplicationTable
                            displayedApplications={applicationsData!}
                            questions={questionsData ?? []}
                            phases={phasesData ?? []}
                        />
                    </TabsContent>
                    <TabsContent value="board">
                        <ApplicationBoard
                            displayedApplications={applicationsData!}
                            questions={questionsData ?? []}
                            phases={phasesData ?? []}
                        />
                    </TabsContent>
                </Tabs>
            )}
        </>
    );
}
