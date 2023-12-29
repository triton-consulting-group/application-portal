"use client";

import { useAtom } from "jotai";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { applicationQuestionsAtom, recruitmentCyclePhasesAtom, selectedRecruitmentCycleAtom } from "./atoms";
import { useEffect, useState } from "react";
import { Application, ApplicationResponse, RecruitmentCyclePhase, User } from "../types";
import { api } from "~/trpc/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { MoreVertical, Plus, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Form, FormField, FormItem } from "~/components/ui/form";
import { useForm } from "react-hook-form";
import { Badge } from "~/components/ui/badge";
import CreateNote from "./create-note";
import ViewNotes from "./view-notes";

type ApplicationWithResponses = Application & Pick<User, "email" | "name"> & { phase?: RecruitmentCyclePhase, responses: ApplicationResponse[] };
enum FilterType {
    CONTAIN = "Contains",
    EQUAL = "Equals",
    NOT_EQUAL = "Doesn't Equal",
};
type Filter = { questionId: string, value: string, type: FilterType };

export default function ApplicationTable() {
    const [cycleId] = useAtom(selectedRecruitmentCycleAtom);
    const [questions, setQuestions] = useAtom(applicationQuestionsAtom);
    const [phases, setPhases] = useAtom(recruitmentCyclePhasesAtom);
    const [applications, setApplications] = useState<ApplicationWithResponses[]>([]);
    // the applications displayed after filters and search query is applied
    const [displayedApplications, setDisplayedApplications] = useState<ApplicationWithResponses[]>([]);
    const [filters, setFilters] = useState<Filter[]>([]);
    const [sortColumn, setSortColumn] = useState<string>("");
    const getQuestionsByCycleQuery = api.applicationQuestion.getByCycle.useQuery(cycleId, { enabled: false });
    const getApplicationsByCycleQuery = api.application.getApplicationsByCycleId.useQuery(cycleId, { enabled: false });
    const getResponsesByCycleQuery = api.applicationResponse.getResponsesByCycleId.useQuery(cycleId, { enabled: false });
    const getPhasesByCycleQuery = api.recruitmentCyclePhase.getByCycleId.useQuery(cycleId, { enabled: false });
    const setApplicationPhaseIdMutation = api.application.updatePhase.useMutation();

    const createFilterForm = useForm<Filter>();
    const onFilterFormSave = () => {
        setFilters([createFilterForm.getValues(), ...filters]);
        createFilterForm.reset();
    }
    const removeFilter = (filter: Filter) => setFilters(filters.filter(f => f !== filter));

    const setApplicationPhase = async (applicationId: string, phaseId: string) => {
        const updatedApplication = applications.find(a => a.id === applicationId);
        if (!updatedApplication) throw new Error("Application not found");
        updatedApplication.phaseId = phaseId;
        updatedApplication.phase = phases.find(p => p.id === phaseId);
        setApplications([...applications.filter(a => a.id !== applicationId), updatedApplication])
        await setApplicationPhaseIdMutation.mutateAsync({ applicationId: applicationId, phaseId: phaseId });
    };

    useEffect(() => {
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

        fetchData();
    }, [cycleId]);

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
    }, [filters])

    /**
     * Matches if the field contains the value
     */
    const filterApplicationsByNameOrEmail = (
        field: keyof Pick<ApplicationWithResponses, "name" | "email">, value: string
    ): ApplicationWithResponses[] => {
        return applications.filter(a => a[field]?.toLowerCase().includes(value.toLowerCase()));
    }

    return (
        <div>
            <div className="flex flex-col gap-y-2">
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
            <Table className="mt-4">
                <TableHeader>
                    <TableRow>
                        <TableHead className="whitespace-nowrap">Applicant Name</TableHead>
                        <TableHead className="whitespace-nowrap">Applicant Email</TableHead>
                        <TableHead className="whitespace-nowrap">Phase</TableHead>
                        {questions.map(q => (
                            <TableHead key={q.id}>{q.displayName}</TableHead>
                        ))}
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {displayedApplications.map(app => (
                        <TableRow key={app.id}>
                            <TableCell>{app.name}</TableCell>
                            <TableCell>{app.email}</TableCell>
                            <TableCell>{app.phase?.displayName ?? ""}</TableCell>
                            {app.responses.map(res => (
                                <TableCell key={res.id}>{res.value}</TableCell>
                            ))}
                            <TableCell>
                                <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost"><MoreVertical /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>
                                                <span>Set Phase</span>
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuPortal>
                                                <DropdownMenuSubContent className="mr-1">
                                                    {phases.map(p => (
                                                        <DropdownMenuItem 
                                                            key={p.id} 
                                                            onClick={() => setApplicationPhase(app.id, p.id)}
                                                            className="cursor-pointer"
                                                        >
                                                            <span>{p.displayName}</span>
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuSubContent>
                                            </DropdownMenuPortal>
                                        </DropdownMenuSub>
                                        <ViewNotes
                                            applicationId={app.id}
                                            asChild
                                        >
                                            <span className="flex cursor-pointer text-sm py-1.5 px-2">Notes</span>
                                        </ViewNotes>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

