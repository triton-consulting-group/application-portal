"use client";

import { useAtom } from "jotai";
import { applicationQuestionsAtom, applicationsAtom, recruitmentCyclePhasesAtom, selectedRecruitmentCycleAtom } from "./atoms";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { ApplicationWithResponses } from "../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { KanbanSquare, Plus, Table, X } from "lucide-react";
import ApplicationTable from "./application-table";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Form, FormField, FormItem } from "~/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { useForm } from "react-hook-form";
import { Badge } from "~/components/ui/badge";
import ApplicationBoard from "./application-board";

enum FilterType {
    CONTAIN = "Contains",
    EQUAL = "Equals",
    NOT_EQUAL = "Doesn't Equal",
};
type Filter = { questionId: string, value: string, type: FilterType };

export default function ViewApplications() {
    const [cycleId] = useAtom(selectedRecruitmentCycleAtom);
    const [questions, setQuestions] = useAtom(applicationQuestionsAtom);
    const [, setPhases] = useAtom(recruitmentCyclePhasesAtom);
    const [applications, setApplications] = useAtom(applicationsAtom);
    const [displayedApplications, setDisplayedApplications] = useState<ApplicationWithResponses[]>([]);

    const getQuestionsByCycleQuery = api.applicationQuestion.getByCycle.useQuery(cycleId, { enabled: false });
    const getApplicationsByCycleQuery = api.application.getApplicationsByCycleId.useQuery(cycleId, { enabled: false });
    const getResponsesByCycleQuery = api.applicationResponse.getResponsesByCycleId.useQuery(cycleId, { enabled: false });
    const getPhasesByCycleQuery = api.recruitmentCyclePhase.getByCycleId.useQuery(cycleId, { enabled: false });

    const fetchData = async () => {
        const [{ data: questions = [] }, { data: responses = [] }, { data: phases = [] }] = await Promise.all([
            getQuestionsByCycleQuery.refetch(),
            getResponsesByCycleQuery.refetch(),
            getPhasesByCycleQuery.refetch()
        ]);

        setQuestions(questions);
        setPhases(phases);

        const applications = ((await getApplicationsByCycleQuery.refetch()).data ?? [])
            .map((app): ApplicationWithResponses => ({
                ...app.application,
                email: app?.user?.email ?? "",
                name: app?.user?.name ?? "",
                phase: phases.find(p => p.id === app.application.phaseId),
                responses: responses
                    .filter(r => r.applicationId === app.application.id)
                    .sort((a, b) => {
                        const questionA = questions.find(q => q.id === a.questionId);
                        const questionB = questions.find(q => q.id === b.questionId);
                        return (questionA?.order ?? Number.MAX_SAFE_INTEGER) - (questionB?.order ?? Number.MAX_SAFE_INTEGER)
                    })
            }));
        setApplications(applications);
        setDisplayedApplications(applications);
    };

    useEffect(() => {
        fetchData();
    }, [cycleId]);

    const [filters, setFilters] = useState<Filter[]>([]);
    const createFilterForm = useForm<Filter>();

    const onFilterFormSave = () => {
        setFilters([createFilterForm.getValues(), ...filters]);
        createFilterForm.reset();
    }
    const removeFilter = (filter: Filter) => setFilters(filters.filter(f => f !== filter));
    const filterApplicationsByNameOrEmail = (
        field: keyof Pick<ApplicationWithResponses, "name" | "email">, value: string
    ): ApplicationWithResponses[] => {
        return applications.filter(a => a[field]?.toLowerCase().includes(value.toLowerCase()));
    }

    useEffect(() => {
        setDisplayedApplications(
            filterApplicationsByNameOrEmail("name", (document.getElementById("name-search") as HTMLInputElement).value)
                .filter(a =>
                    filters.every(f => {
                        const response = a.responses.find(r => r.questionId === f.questionId)
                        if (!response) return false;
                        if (f.type === FilterType.EQUAL) return response.value.trim().toLowerCase() === f.value.toLowerCase();
                        if (f.type === FilterType.NOT_EQUAL) return response.value.trim().toLowerCase() !== f.value.toLowerCase();
                        if (f.type === FilterType.CONTAIN) return response.value.trim().toLowerCase().includes(f.value.toLowerCase());
                    })
                )
        )
    }, [filters, applications])

    return (
        <Tabs defaultValue="table">
            <TabsList>
                <TabsTrigger value="table">
                    <Table />
                </TabsTrigger>
                <TabsTrigger value="board">
                    <KanbanSquare />
                </TabsTrigger>
            </TabsList>
            <div className="flex flex-col gap-y-2 mt-2">
                <Input
                    className="w-fit"
                    placeholder="Search by name..."
                    onChange={(event) => setDisplayedApplications(filterApplicationsByNameOrEmail("name", event.target.value))}
                    id="name-search"
                />
                <div className="flex flex-row gap-x-4">
                    {filters.map(filter => (
                        <Badge className="flex flex-row gap-x-2" key={filter.value}>
                            "{questions.find(q => q.id === filter.questionId)?.displayName}" {filter.type} "{filter.value}"
                            <Button variant="ghost" className="p-0 h-fit" onClick={() => removeFilter(filter)}>
                                <X className="h-4 w-4"></X>
                            </Button>
                        </Badge>
                    ))}
                    <Popover>
                        <PopoverTrigger className="flex gap-x-1 w-fit text-sm">
                            <Plus />
                            Add filter
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
                                                        {questions.map(q => (
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
            </div>
            <TabsContent value="table">
                <ApplicationTable displayedApplications={displayedApplications}></ApplicationTable>
            </TabsContent>
            <TabsContent value="board">
                <ApplicationBoard displayedApplications={displayedApplications}></ApplicationBoard>
            </TabsContent>
        </Tabs>
    )
}
