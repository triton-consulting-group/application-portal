"use client";

import { useAtom } from "jotai";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { applicationQuestionsAtom, selectedRecruitmentCycleAtom } from "./atoms";
import { useEffect, useState } from "react";
import { Application, ApplicationResponse, User } from "../types";
import { api } from "~/trpc/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { MoreVertical, Plus, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Form, FormField, FormItem } from "~/components/ui/form";
import { useForm } from "react-hook-form";
import { Badge } from "~/components/ui/badge";

type ApplicationWithResponses = Application & Pick<User, "email" | "name"> & { responses: ApplicationResponse[] };
enum FilterType {
    CONTAIN = "Contains",
    EQUAL = "Equals",
    NOT_EQUAL = "Doesn't Equal",
};
type Filter = { questionId: string, value: string, type: FilterType };

export default function ApplicationTable() {
    const [cycleId] = useAtom(selectedRecruitmentCycleAtom);
    const [questions, setQuestions] = useAtom(applicationQuestionsAtom);
    const [applications, setApplications] = useState<ApplicationWithResponses[]>([]);
    // the applications displayed after filters and search query is applied
    const [displayedApplications, setDisplayedApplications] = useState<ApplicationWithResponses[]>([]);
    const [filters, setFilters] = useState<Filter[]>([]);
    const getQuestionsByCycleQuery = api.applicationQuestion.getByCycle.useQuery(cycleId, { enabled: false });
    const getApplicationsByCycleQuery = api.application.getApplicationsByCycleId.useQuery(cycleId, { enabled: false });
    const getResponsesByCycleQuery = api.applicationResponse.getResponsesByCycleId.useQuery(cycleId, { enabled: false });

    const createFilterForm = useForm<Filter>();
    const onFilterFormSave = () => {
        setFilters([createFilterForm.getValues(), ...filters]);
        createFilterForm.reset();
    }
    const removeFilter = (filter: Filter) => setFilters(filters.filter(f => f !== filter));

    useEffect(() => {
        const fetchData = async () => {
            const questions = (await getQuestionsByCycleQuery.refetch()).data ?? []
            setQuestions(questions);
            const responses = (await getResponsesByCycleQuery.refetch()).data as ApplicationResponse[];
            const applications = ((await getApplicationsByCycleQuery.refetch()).data ?? [])
                .map(app => ({
                    ...app.application,
                    email: app?.user?.email ?? "",
                    name: app?.user?.name ?? "",
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
                    { filters.map(filter => (
                        <Badge className="flex flex-row gap-x-2" key={filter.value}>
                            "{questions.find(q => q.id === filter.questionId)?.displayName}" {filter.type} "{filter.value}"
                            <Button variant="ghost" className="p-0 h-fit" onClick={() => removeFilter(filter)}>
                                <X className="h-4 w-4"></X>
                            </Button>
                        </Badge>
                    )) }
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
                            {app.responses.map(res => (
                                <TableCell key={res.id}>{res.value}</TableCell>
                            ))}
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost"><MoreVertical /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        Hello
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

