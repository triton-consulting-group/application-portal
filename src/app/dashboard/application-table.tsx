"use client";

import { useAtom } from "jotai";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { applicationQuestionsAtom, selectedRecruitmentCycleAtom } from "./atoms";
import { useEffect, useState } from "react";
import { Application, ApplicationResponse, User } from "../types";
import { api } from "~/trpc/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Button } from "~/components/ui/button";

type ApplicationWithResponses = Application & Pick<User, "email" | "name"> & { responses: ApplicationResponse[] };

export default function ApplicationTable() {
    const [cycleId] = useAtom(selectedRecruitmentCycleAtom);
    const [questions, setQuestions] = useAtom(applicationQuestionsAtom);
    const [applications, setApplications] = useState<ApplicationWithResponses[]>([]);
    const getQuestionsByCycleQuery = api.applicationQuestion.getByCycle.useQuery(cycleId, { enabled: false });
    const getApplicationsByCycleQuery = api.application.getApplicationsByCycleId.useQuery(cycleId, { enabled: false });
    const getResponsesByCycleQuery = api.applicationResponse.getResponsesByCycleId.useQuery(cycleId, { enabled: false });

    useEffect(() => {
        const fetchData = async () => {
            const questions = (await getQuestionsByCycleQuery.refetch()).data ?? []
            setQuestions(questions);
            const applications = (await getApplicationsByCycleQuery.refetch()).data ?? [];
            const responses = (await getResponsesByCycleQuery.refetch()).data as ApplicationResponse[];
            setApplications(applications.map(app => ({
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
            })));
        };

        fetchData();
    }, [cycleId]);

    return (
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
                {applications.map(app => (
                    <TableRow key={app.id}>
                        <TableCell>{app.name}</TableCell>
                        <TableCell>{app.email}</TableCell>
                        {app.responses.map(res => (
                            <TableCell key={res.id}>{res.value}</TableCell>
                        ))}
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost"><MoreVertical/></Button>
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
    )
}

