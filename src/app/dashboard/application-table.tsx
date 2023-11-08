"use client";

import { useAtom } from "jotai";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { applicationQuestionsAtom, selectedRecruitmentCycleAtom } from "./atoms";
import { useEffect, useState } from "react";
import { Application, ApplicationResponse, User } from "../types";
import { api } from "~/trpc/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { MoreVertical, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";

type ApplicationWithResponses = Application & Pick<User, "email" | "name"> & { responses: ApplicationResponse[] };
enum FilterType {
    CONTAIN,
    EQUAL,
    NOT_EQUAL,
};
type Filter = { questionId: string, value: string, type: FilterType };

export default function ApplicationTable() {
    const [cycleId] = useAtom(selectedRecruitmentCycleAtom);
    const [questions, setQuestions] = useAtom(applicationQuestionsAtom);
    const [applications, setApplications] = useState<ApplicationWithResponses[]>([]);
    const [displayedApplications, setDisplayedApplications] = useState<ApplicationWithResponses[]>([]);
    const [filters, setFilters] = useState<Filter[]>([]);
    const getQuestionsByCycleQuery = api.applicationQuestion.getByCycle.useQuery(cycleId, { enabled: false });
    const getApplicationsByCycleQuery = api.application.getApplicationsByCycleId.useQuery(cycleId, { enabled: false });
    const getResponsesByCycleQuery = api.applicationResponse.getResponsesByCycleId.useQuery(cycleId, { enabled: false });

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

    /**
     * Matches if the field contains the value
     */
    const filterApplicationsByNameOrEmail = (
        field: keyof Pick<ApplicationWithResponses, "name" | "email">, value: string
    ) => {
        setDisplayedApplications(applications.filter(a => a[field]?.toLowerCase().includes(value.toLowerCase())));
    }

    return (
        <div>
            <div className="flex flex-col gap-y-2">
                <Input
                    className="w-fit"
                    placeholder="Search by name..."
                    onChange={(event) => filterApplicationsByNameOrEmail("name", event.target.value)}
                />
                <Popover>
                    <PopoverTrigger className="flex gap-x-1 w-fit text-sm">
                        <Plus />
                        Add filter
                    </PopoverTrigger>
                    <PopoverContent>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a question column" />
                            </SelectTrigger>
                            <SelectContent>
                                {questions.map(q => (
                                    <SelectItem key={q.id} value={q.id}>{q.displayName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </PopoverContent>
                </Popover>
            </div>
            <Table>
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

