"use client";

import { useAtom } from "jotai";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import type { ApplicationQuestion, ApplicationWithResponses, RecruitmentCyclePhase } from "../types";
import { api } from "~/trpc/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Button } from "~/components/ui/button";
import ViewNotes from "./view-notes";
import ApplicationDisplayDialog from "./application-display-dialog";
import { FieldType } from "~/server/db/types";
import FileViewerDialog from "~/components/ui/file-viewer-dialog";
import { selectedRecruitmentCycleAtom } from "./atoms";

export default function ApplicationTable({
    displayedApplications,
    questions,
    phases
}: {
    displayedApplications: ApplicationWithResponses[],
    questions: ApplicationQuestion[],
    phases: RecruitmentCyclePhase[]
}) {
    const [cycleId] = useAtom(selectedRecruitmentCycleAtom);
    const utils = api.useContext();
    const setApplicationPhaseIdMutation = api.application.updatePhase.useMutation({
        onMutate: async (update) => {
            // cancel outgoing refetches that will overwrite data
            await utils.application.getSubmittedApplicationsWithResponsesByCycleId.invalidate(cycleId);
            const previousApplications = utils.application.getSubmittedApplicationsWithResponsesByCycleId.getData(cycleId)!;

            // optimistically update application phase
            const updatedApplication = { ...previousApplications.find(a => a.id === update.applicationId)! };
            updatedApplication.phaseId = update.phaseId;
            utils.application.getSubmittedApplicationsWithResponsesByCycleId.setData(
                cycleId,
                [
                    updatedApplication,
                    ...previousApplications.filter(a => a.id !== update.applicationId)
                ]
            );

            return { previousApplications };
        },
        onError: (_err, _update, context) => {
            utils.application.getSubmittedApplicationsWithResponsesByCycleId.setData(cycleId, context?.previousApplications);
        },
        onSettled: () => utils.application.getSubmittedApplicationsWithResponsesByCycleId.invalidate(cycleId)
    });
    const setApplicationPhase = (applicationId: string, phaseId: string) => {
        const updatedApplication = displayedApplications.find(a => a.id === applicationId);
        if (!updatedApplication) throw new Error("Application not found");
        updatedApplication.phaseId = phaseId;
        updatedApplication.phase = phases.find(p => p.id === phaseId) ?? null;
        void setApplicationPhaseIdMutation.mutateAsync({ applicationId: applicationId, phaseId: phaseId });
    };

    return (
        <div className="w-full h-[600px] overflow-auto">
            <Table>
                <TableHeader className="sticky top-0 bg-secondary">
                    <TableRow>
                        <TableHead className="whitespace-nowrap">Applicant Name</TableHead>
                        <TableHead className="whitespace-nowrap">Applicant Email</TableHead>
                        <TableHead className="whitespace-nowrap">Phase</TableHead>
                        {questions.map(q => (
                            <TableHead
                                className={q.type === FieldType.STRING ? "min-w-[240px]" : "min-w-[160px]"}
                                key={q.id}
                            >
                                <p className="line-clamp-3">{q.displayName}</p>
                            </TableHead>
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
                            {app.responses.map((res, index) => (
                                <TableCell key={res.id}>
                                    <div className="flex px-2 items-center">
                                        <p className="line-clamp-3 text-ellipsis ">
                                            {res.value}
                                        </p>
                                        {questions[index]?.type === FieldType.FILE_UPLOAD && <FileViewerDialog src={res.value} />}
                                    </div>
                                </TableCell>
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
                                        <ApplicationDisplayDialog
                                            application={app}
                                            questions={questions}
                                            asChild
                                        >
                                            <span className="flex cursor-pointer text-sm py-1.5 px-2">View Application</span>
                                        </ApplicationDisplayDialog>
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
    );
}

