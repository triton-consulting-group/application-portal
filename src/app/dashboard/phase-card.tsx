"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { GripVertical, Pencil, Trash2, X } from "lucide-react";
import { useAtom } from "jotai";
import { selectedRecruitmentCycleAtom } from "./atoms";
import { api } from "~/trpc/react";
import CreatePhase from "./create-phase";
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RecruitmentCyclePhase } from "../types";

export default function PhaseCard() {
    const [recruitmentCycle] = useAtom(selectedRecruitmentCycleAtom);
    const [editing, setEditing] = useState<boolean>(false);

    const utils = api.useContext();
    const getRecruitmentCyclePhaseQuery = api.recruitmentCyclePhase.getByCycleId.useQuery(recruitmentCycle);
    const reorderPhases = api.recruitmentCyclePhase.reorder.useMutation({
        onMutate: async (orderedIds) => {
            // cancel outgoing refetches that will overwrite data
            await utils.recruitmentCyclePhase.getByCycleId.cancel();
            const previousPhases = utils.recruitmentCyclePhase.getByCycleId.getData(recruitmentCycle) ?? [];

            // optimistically update phase order
            utils.recruitmentCyclePhase.getByCycleId.setData(
                recruitmentCycle,
                orderedIds.map(id => previousPhases.find(p => p.id === id)!)
            );

            return { previousPhases };
        },
        onError: (_err, _orderedIds, context) => {
            utils.recruitmentCyclePhase.getByCycleId.setData(recruitmentCycle, context?.previousPhases);
        },
        onSettled: () => utils.recruitmentCyclePhase.getByCycleId.invalidate()
    });
    const deletePhaseMutation = api.recruitmentCyclePhase.delete.useMutation({
        onMutate: async (deletedId) => {
            // cancel outgoing refetches that will overwrite data
            await utils.recruitmentCyclePhase.getByCycleId.cancel();
            const previousPhases = utils.recruitmentCyclePhase.getByCycleId.getData(recruitmentCycle) ?? [];

            // optimistically update phases
            utils.recruitmentCyclePhase.getByCycleId.setData(
                recruitmentCycle,
                previousPhases.filter(p => p.id !== deletedId)
            );

            return { previousPhases };
        },
        onError: (_err, _deletedId, context) => {
            utils.recruitmentCyclePhase.getByCycleId.setData(recruitmentCycle, context?.previousPhases);
        },
        onSettled: () => utils.recruitmentCyclePhase.getByCycleId.invalidate()
    });

    const sensors = useSensors(useSensor(PointerSensor));
    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        const phases = getRecruitmentCyclePhaseQuery.data ?? [];
        if (over && active.id !== over.id) {
            const activeIdx = phases.findIndex(q => q.id === active.id);
            const overIdx = phases.findIndex(q => q.id === over.id);
            let newQuestions = [...phases];
            // if next to eachother, swap order
            // else insert at hover over position and move everything else back
            if (Math.abs(activeIdx - overIdx) === 1) {
                const tmp = newQuestions[activeIdx];
                newQuestions[activeIdx] = newQuestions[overIdx]!;
                newQuestions[overIdx] = tmp!;
            } else {
                newQuestions = newQuestions.filter(q => q.id !== active.id);
                newQuestions.splice(
                    overIdx,
                    0,
                    phases[activeIdx]!
                );
            }
            void reorderPhases.mutateAsync(newQuestions.map(q => q.id));
        }
    };

    function SortablePhase({ p }: { p: RecruitmentCyclePhase }) {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging
        } = useSortable({ id: p.id ?? "", disabled: !editing });

        const style: React.CSSProperties = {
            transition,
            transform: CSS.Transform.toString(transform ? {
                ...transform,
                scaleX: 1,
                scaleY: 1
            } : transform),
            ...(isDragging ? { border: "none" } : {}),
        };
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="border-zinc-700 pt-2 flex flex-row items-center justify-between"
            >
                <div className="flex flex-row items-center">
                    {editing && (
                        <Button variant="ghost" className="p-0 mr-3 ml-2 h-6 w-6" onClick={() => deletePhaseMutation.mutate(p.id)}>
                            <Trash2 />
                        </Button>
                    )}
                    <CreatePhase asChild existingPhase={p} disabled={!editing}>
                        <div className={"flex flex-col " + (editing && "cursor-pointer")}>
                            <h1 className="flex text-md font-semibold">
                                {p.displayName}
                            </h1>
                        </div>
                    </CreatePhase>
                </div>
                {editing && (
                    <div className="h-6 w-6 ml-3">
                        <GripVertical
                            {...attributes}
                            {...listeners}
                        />
                    </div>
                )}
            </div>
        );
    }

    return (
        <Card className="w-1/3 flex flex-col">
            <CardHeader className="pb-1">
                <CardTitle className="flex justify-between items-center">
                    Recruitment Cycle Phases
                    <Button variant="ghost" onClick={() => setEditing(!editing)}>
                        {editing ? <X /> : <Pencil />}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow gap-y-2 divide-y">
                {getRecruitmentCyclePhaseQuery.isLoading ?
                    <div></div> :
                    <>
                        {!recruitmentCycle && "Select a recruitment cycle first"}
                        {recruitmentCycle && !getRecruitmentCyclePhaseQuery.data?.length && "No phases have been created"}
                        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                            <SortableContext
                                strategy={verticalListSortingStrategy}
                                items={(getRecruitmentCyclePhaseQuery.data ?? []).map(p => p.id)}
                            >
                                {(getRecruitmentCyclePhaseQuery.data ?? []).map(p => (
                                    <SortablePhase p={p} key={p.id}></SortablePhase>
                                ))}
                            </SortableContext>
                        </DndContext>
                    </>
                }
            </CardContent>
            <CardFooter className="flex flex-wrap gap-y-4">
                <CreatePhase></CreatePhase>
            </CardFooter>
        </Card>
    );
}
