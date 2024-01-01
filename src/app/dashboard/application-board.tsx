"use client";

import { DndContext, type DragEndEvent, type DragOverEvent, DragOverlay, type DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { ApplicationWithResponses, RecruitmentCyclePhase } from "../types";
import { applicationQuestionsAtom, applicationsAtom, recruitmentCyclePhasesAtom } from "./atoms";
import { useAtom } from "jotai";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Copy, Eye, GripVertical, Mails } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import FlickerButton from "~/components/ui/flicker-button";
import ApplicationDisplayDialog from "./application-display-dialog";

function SortableApplication({
    application,
    disabled
}: {
    application: ApplicationWithResponses,
    disabled?: boolean
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: application.id ?? "", });

    const style: React.CSSProperties = disabled ? {} : {
        transition,
        transform: CSS.Transform.toString(transform ? {
            ...transform,
            scaleX: 1,
            scaleY: 1
        } : transform),
    };

    const [questions] = useAtom(applicationQuestionsAtom);

    return (
        <div
            className="flex flex-row items-center w-full justify-between bg-card rounded-md -ml-4 px-4 py-2"
            style={style}
            ref={setNodeRef}
        >
            <div className="flex flex-col overflow-x-hidden">
                <h3>{application.name}</h3>
                <h3>{application.email}</h3>
            </div>
            <div className="flex">
                <ApplicationDisplayDialog
                    application={application}
                    questions={questions}
                    asChild
                >
                    <Button variant="ghost">
                        <Eye/>
                    </Button>
                </ApplicationDisplayDialog>
                <Button
                    variant="ghost"
                    className="-mr-8"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical />
                </Button>
            </div>
        </div>
    );
}

function PhaseCard({
    displayedApplications,
    phase
}: {
    displayedApplications: ApplicationWithResponses[],
    phase: RecruitmentCyclePhase | null
}) {
    const [applications, setApplications] = useState<ApplicationWithResponses[]>([]);
    const { setNodeRef } = useSortable({ id: phase?.id ?? "null", data: { type: "container" } });

    const copyEmails = () => navigator.clipboard.writeText(applications.map(a => a.email).join(","));
    const copyNames = () => navigator.clipboard.writeText(applications.map(a => a.name).join(","));

    useEffect(() => {
        setApplications(displayedApplications.filter(a => a.phaseId === (phase?.id ?? null)));
    }, [displayedApplications, phase]);

    return (
        <Card className="grow min-w-[28rem] min-h-[28rem] flex flex-col">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    {phase ? phase.displayName : "Uncategorized"}
                    <div className="flex">
                        <FlickerButton
                            onClick={copyNames}
                            defaultContent={<Copy />}
                            flickerContent={<Check />}
                            tooltipContent={<p>Copy applicant names from this phase</p>}
                            duration={1500}
                        />
                        <FlickerButton
                            onClick={copyEmails}
                            defaultContent={<Mails />}
                            flickerContent={<Check />}
                            tooltipContent={<p>Copy applicant emails from this phase</p>}
                            duration={1500}
                        />
                    </div>
                </CardTitle>
                <CardDescription>
                    {phase ? `All applications in phase "${phase.displayName}"` : "All applications without a phase"}
                </CardDescription>
            </CardHeader>
            <CardContent className="grow">
                <SortableContext
                    items={applications.map(a => a.id)}
                >
                    <div ref={setNodeRef} className="flex flex-col h-full divide-y">
                        {applications.length === 0 ? (
                            <div>
                                No applications are in this phase yet.
                            </div>
                        ) : (
                            <>
                                {applications.map(application => (
                                    <div key={application.id}>
                                        <SortableApplication
                                            application={application}
                                        />
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </SortableContext>
            </CardContent>
        </Card>
    );
}

export default function ApplicationBoard({
    displayedApplications,
}: {
    displayedApplications: ApplicationWithResponses[],
}) {
    const [applications, setApplications] = useAtom(applicationsAtom);
    const [phases] = useAtom(recruitmentCyclePhasesAtom);
    const sensors = useSensors(useSensor(PointerSensor));
    const [active, setActive] = useState<ApplicationWithResponses | null>(null);
    const setApplicationPhaseIdMutation = api.application.updatePhase.useMutation();

    const handleDragEnd = ({ active }: { active: DragEndEvent['active'], over: DragEndEvent['over'] }) => {
        setActive(null);
        // handle drag over already set the phase id, so now just commit the change 
        const application = applications.find(a => a.id === active.id);
        if (!application) throw new Error("Dragged application not found");
        void setApplicationPhaseIdMutation.mutateAsync(
            { applicationId: application.id, phaseId: application.phaseId }
        );
    };

    const handleDragStart = ({ active }: { active: DragStartEvent["active"] }) => {
        const activeApplication = displayedApplications.find(a => a.id === active.id);
        if (!activeApplication) throw new Error("Active application not found");
        setActive(activeApplication);
    };

    const handleDragOver = ({ active, over }: { active: DragOverEvent['active'], over: DragOverEvent['over'] }) => {
        if (!over) return;
        const modifiedApplication = applications.find(a => a.id === active.id);
        if (!modifiedApplication) throw new Error("Dragged application not found");
        if (over.id === active.id) return;

        // over.id can be an app or phase id, this finds the phase no matter what
        const overApp = applications.find(a => a.id === over.id);
        const phase = overApp ? phases.find(p => p.id === overApp.phaseId) : phases.find(p => p.id === over.id);
        modifiedApplication.phaseId = phase?.id ?? null;
        modifiedApplication.phase = phases.find(p => p.id === over.id);


        setApplications([
            modifiedApplication,
            ...applications.filter(a => a.id !== active.id)
        ]);
    };

    return (
        <div className="flex flex-row shrink-0 gap-x-5 mb-2 overflow-x-scroll">
            <DndContext
                sensors={sensors}
                onDragEnd={handleDragEnd}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
            >
                <PhaseCard displayedApplications={displayedApplications} phase={null} />
                {phases.map(phase => (
                    <PhaseCard key={phase.id} displayedApplications={displayedApplications} phase={phase} />
                ))}
                <DragOverlay>
                    {active ? (
                        <SortableApplication application={active} disabled />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
