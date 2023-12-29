"use client";

import { useAtom } from "jotai";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { applicationQuestionsAtom, applicationsAtom, recruitmentCyclePhasesAtom } from "./atoms";
import { ApplicationWithResponses } from "../types";
import { api } from "~/trpc/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Button } from "~/components/ui/button";
import ViewNotes from "./view-notes";

export default function ApplicationTable({ 
    displayedApplications 
}: { 
    displayedApplications: ApplicationWithResponses[] 
}) {
    const [questions] = useAtom(applicationQuestionsAtom);
    const [phases] = useAtom(recruitmentCyclePhasesAtom);
    const [applications, setApplications] = useAtom(applicationsAtom)

    const setApplicationPhaseIdMutation = api.application.updatePhase.useMutation();
    const setApplicationPhase = async (applicationId: string, phaseId: string) => {
        const updatedApplication = applications.find(a => a.id === applicationId);
        if (!updatedApplication) throw new Error("Application not found");
        updatedApplication.phaseId = phaseId;
        updatedApplication.phase = phases.find(p => p.id === phaseId);
        setApplications([...applications.filter(a => a.id !== applicationId), updatedApplication])
        await setApplicationPhaseIdMutation.mutateAsync({ applicationId: applicationId, phaseId: phaseId });
    };

    return (
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
    )
}

