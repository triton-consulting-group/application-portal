"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import type { ApplicationQuestion, ApplicationWithResponses, RecruitmentCyclePhase } from "../types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { Check, MoreVertical } from "lucide-react";
import { Button } from "~/components/ui/button";
import ViewNotes from "./view-notes";
import ApplicationDisplayDialog from "./application-display-dialog";
import { FieldType } from "~/server/db/types";
import FileViewerDialog from "~/components/ui/file-viewer-dialog";
import type { api } from "~/trpc/react";

/**
 * Displays ApplicationWithResponses[] in a table
 *
 * @param displayedApplications the applications to display
 * @param questions the recruitment cycle questions. used as column headers
 * @param phases the recruitment cycle phases. used to display the phase name in each row
 * @param setApplicationPhaseIdMutation the mutation needed to update the phase of an application
 */
export default function ApplicationTable({
    displayedApplications,
    questions,
    phases,
    setApplicationPhaseIdMutation
}: {
    displayedApplications: ApplicationWithResponses[],
    questions: ApplicationQuestion[],
    phases: RecruitmentCyclePhase[],
    setApplicationPhaseIdMutation: ReturnType<typeof api.application.updatePhase.useMutation>
}) {
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
                            <TableCell>{phases.find(p => p.id === app.phaseId)?.displayName ?? ""}</TableCell>
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
                                                            onClick={() => setApplicationPhaseIdMutation.mutateAsync({ applicationId: app.id, phaseId: p.id })}
                                                            className="cursor-pointer"
                                                        >
                                                            {
                                                                p.id === app.phaseId &&
                                                                <Check
                                                                    className="mr-2 h-4 w-4"
                                                                />
                                                            }
                                                            {p.displayName}
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

