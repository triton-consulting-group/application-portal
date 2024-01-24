"use client";

import { DndContext, type DragEndEvent, type DragOverEvent, DragOverlay, type DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { ApplicationQuestion, ApplicationWithResponses, RecruitmentCyclePhase } from "../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Copy, Eye, GripVertical, Mails, StickyNote } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import FlickerButton from "~/components/ui/flicker-button";
import ApplicationDisplayDialog from "./application-display-dialog";
import ViewNotes from "./view-notes";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAtom } from "jotai";
import { selectedRecruitmentCycleAtom } from "./atoms";

/**
 * The individual application item that can be dragged and dropped into the PhaseCard SortableContext
 *
 * @param application the application to display
 * @param disabled this flag is used to change the appearance of the item if it is being
 * used in the DragOverlay.
 * @param questions the questions to pass to ApplicationDisplayDialog
 */
function SortableApplication({
    application,
    disabled,
    questions
}: {
    application: ApplicationWithResponses,
    disabled?: boolean,
    questions: ApplicationQuestion[]
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
                <TooltipProvider delayDuration={100}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <ApplicationDisplayDialog
                                application={application}
                                questions={questions}
                                asChild
                            >
                                <Button variant="ghost" className="p-2">
                                    <Eye />
                                </Button>
                            </ApplicationDisplayDialog>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>View application</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                    <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                            <ViewNotes
                                applicationId={application.id}
                                asChild
                            >
                                <Button variant="ghost" className="p-2">
                                    <StickyNote />
                                </Button>
                            </ViewNotes>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>View notes</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <Button
                    variant="ghost"
                    className="-mr-8 p-2"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical />
                </Button>
            </div>
        </div>
    );
}

/**
 * Card component that displays all the applications in the given specified phase.
 * Implements a sortable context for applications to be dropped into.
 * The applications in the card are in a virtualized list to reduce performance issues
 * with large numbers of applications.
 *
 * @param applications all the available applications. the component will filter them
 * to choose which ones get displayed.
 * @param phase the phase this card represents. a null value represents the uncategorized applications
 * @param questions the recruitment cycle questions. Eventually passed to ApplicationDisplayDialog
 */
function PhaseCard({
    applications,
    phase,
    questions,
}: {
    applications: ApplicationWithResponses[],
    phase: RecruitmentCyclePhase | null,
    questions: ApplicationQuestion[],
}) {
    const [displayedApplications, setDisplayedApplications] = useState<ApplicationWithResponses[]>([]);
    const { setNodeRef } = useSortable({ id: phase?.id ?? "null", data: { type: "container" } });
    const virtualRef = useRef<HTMLDivElement>(null);
    const virtualizer = useVirtualizer({
        count: displayedApplications.length,
        getScrollElement: () => virtualRef.current,
        // the height of each SortableApplication in px
        estimateSize: () => 64,
    });

    const copyEmails = () => navigator.clipboard.writeText(displayedApplications.map(a => a.email).join(","));
    const copyNames = () => navigator.clipboard.writeText(displayedApplications.map(a => a.name).join(","));

    /**
     * Get the list of applications to display from applications and set displayedApplications
     */
    useEffect(() => {
        setDisplayedApplications(applications.filter(a => a.phaseId === (phase?.id ?? null)));
    }, [displayedApplications, phase]);

    return (
        <Card className="grow max-h-[28rem] min-w-[28rem] min-h-[28rem] flex flex-col">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    {phase ? phase.displayName : "Uncategorized"} {`(${displayedApplications.length})`}
                    <div className="flex">
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
                                    <p>Copy applicant names from this phase</p>
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
                                    <p>Copy applicant emails from this phase</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </CardTitle>
                <CardDescription>
                    {phase ? `All applications in phase "${phase.displayName}"` : "All applications without a phase"}
                </CardDescription>
            </CardHeader>
            <CardContent className="grow">
                <SortableContext
                    strategy={verticalListSortingStrategy}
                    items={displayedApplications.map(a => a.id)}
                >
                    <div ref={setNodeRef}>
                        <div ref={virtualRef} className="h-[300px] overflow-auto">
                            <div
                                className="divide-y"
                                style={{
                                    height: `${virtualizer.getTotalSize()}px`,
                                    width: "100%",
                                    position: "relative"
                                }}
                            >
                                {displayedApplications.length === 0 &&
                                    <div>
                                        No applications are in this phase yet.
                                    </div>
                                }
                                {virtualizer.getVirtualItems().map(virtualRow => (
                                    <div
                                        key={virtualRow.index}
                                        style={{
                                            position: 'absolute',
                                            top: '0',
                                            left: '0',
                                            width: "100%",
                                            height: `${virtualRow.size}px`,
                                            transform: `translateY(${virtualRow.start}px)`
                                        }}
                                    >
                                        <SortableApplication
                                            application={displayedApplications[virtualRow.index]!}
                                            questions={questions}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </SortableContext>
            </CardContent>
        </Card>
    );
}

/**
 * Displays ApplicationWithResponses[] in a trello board view with cards. There is a board for each
 * recruitment cycle phase + a default card for applications where phase is null.
 * There is drag and drop functionality with dnd-kit for dragging applications between phase cards.
 *
 * @param applications the applications to display
 * @param questions the recruitment cycle questions. Eventually passed to ApplicationDisplayDialog
 * @param phases the recruitment cycle phases. Each phase gets its own card
 * @param setApplicationPhaseIdMutation the mutation needed to update the phase of an application
 */
export default function ApplicationBoard({
    applications,
    questions,
    phases,
    setApplicationPhaseIdMutation
}: {
    applications: ApplicationWithResponses[],
    questions: ApplicationQuestion[],
    phases: RecruitmentCyclePhase[],
    setApplicationPhaseIdMutation: ReturnType<typeof api.application.updatePhase.useMutation>
}) {
    const [cycleId] = useAtom(selectedRecruitmentCycleAtom);
    // the current actively dragged application. null when no actively dragging application
    // used to determine whether to display DragOverlay
    const [active, setActive] = useState<ApplicationWithResponses | null>(null);
    const sensors = useSensors(useSensor(PointerSensor));

    const utils = api.useContext();

    /**
     * Triggers when the actively dragged application gets dropped (DragEndEvent)
     * Commits the phase update to the server. 
     */
    const handleDragEnd = ({ active }: { active: DragEndEvent['active'] }) => {
        setActive(null);
        // handle drag over already set the phase id, so now just commit the change 
        const application = applications.find(a => a.id === active.id);
        if (!application) throw new Error("Dragged application not found");
        void setApplicationPhaseIdMutation.mutateAsync(
            { applicationId: application.id, phaseId: application.phaseId }
        );
    };

    /**
     * Triggers when an application starts to get dragged. 
     * Just sets the active application as 
     */
    const handleDragStart = ({ active }: { active: DragStartEvent["active"] }) => {
        setActive(applications.find(a => a.id === active.id)!);
    };

    /**
     * Triggers when the actively dragged application drags over either another application
     * or a phase card. Updates the query data from getSubmittedApplicationsWithResponsesByCycleId
     * with the active applications new phase. 
     */
    const handleDragOver = ({ active, over }: { active: DragOverEvent['active'], over: DragOverEvent['over'] }) => {
        if (!over) return;
        if (over.id === active.id) return;

        // over.id can be an app or phase id, this finds the phase no matter what
        const overApp = applications.find(a => a.id === over.id);
        const phaseId = (overApp ? phases.find(p => p.id === overApp.phaseId) : phases.find(p => p.id === over.id))?.id ?? null;

        const previousApplications = utils.application.getSubmittedApplicationsWithResponsesByCycleId.getData(cycleId)!;
        // in order for react query to trigger a state change, need to create a brand new ApplicationWithResponses array 
        const updatedApplications = [...previousApplications];
        const updatedApplicationIndex = updatedApplications.findIndex(a => a.id === active.id);
        updatedApplications[updatedApplicationIndex] = {
            ...previousApplications.find(a => a.id === active.id)!,
            phaseId: phaseId
        };
        utils.application.getSubmittedApplicationsWithResponsesByCycleId.setData(
            cycleId,
            updatedApplications
        );
    };

    return (
        <div className="flex flex-row shrink-0 gap-x-5 mb-2 overflow-x-scroll">
            <DndContext
                sensors={sensors}
                onDragEnd={handleDragEnd}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
            >
                <PhaseCard
                    applications={applications}
                    phase={null}
                    questions={questions}
                />
                {phases.map(phase => (
                    <PhaseCard
                        key={phase.id}
                        applications={applications}
                        phase={phase}
                        questions={questions}
                    />
                ))}
                <DragOverlay>
                    {active ? (
                        <SortableApplication
                            application={active}
                            disabled
                            questions={questions}
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
