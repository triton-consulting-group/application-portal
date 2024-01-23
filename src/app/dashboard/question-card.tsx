"use client";

import { useAtom } from "jotai";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "src/components/ui/card";
import { selectedRecruitmentCycleAtom } from "./atoms";
import React from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Asterisk, GripVertical, Pencil, Trash2, X } from "lucide-react";
import CreateQuestion from "./create-question";
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PreviewApplication } from "./preview-application";
import { ApplicationQuestion } from "../types";

export default function QuestionCard() {
    const [recruitmentCycle] = useAtom(selectedRecruitmentCycleAtom);
    const [editing, setEditing] = React.useState<boolean>(false);

    const utils = api.useContext();
    const { data: questions, isLoading: loading } = api.applicationQuestion.getByCycle.useQuery(recruitmentCycle);
    const deleteQuestionMutation = api.applicationQuestion.delete.useMutation({
        onMutate: async (deletedId) => {
            // cancel outgoing refetches that will overwrite data
            await utils.applicationQuestion.getByCycle.cancel();
            const previousQuestions = utils.applicationQuestion.getByCycle.getData(recruitmentCycle) ?? [];

            // optimistically update phases
            utils.applicationQuestion.getByCycle.setData(
                recruitmentCycle,
                previousQuestions.filter(q => q.id !== deletedId)
            );

            return { previousQuestions };
        },
        onError: (_err, _deletedId, context) => {
            utils.applicationQuestion.getByCycle.setData(recruitmentCycle, context?.previousQuestions);
        },
        onSettled: () => utils.applicationQuestion.getByCycle.invalidate()
    });
    const reorderQuestionMutation = api.applicationQuestion.reorder.useMutation({
        onMutate: async (orderedIds) => {
            // cancel outgoing refetches that will overwrite data
            await utils.applicationQuestion.getByCycle.cancel();
            const previousQuestions = utils.applicationQuestion.getByCycle.getData(recruitmentCycle) ?? [];

            // optimistically update phase order
            utils.applicationQuestion.getByCycle.setData(
                recruitmentCycle,
                orderedIds.map(id => previousQuestions.find(q => q.id === id)!)
            );

            return { previousQuestions };
        },
        onError: (_err, _orderedIds, context) => {
            utils.applicationQuestion.getByCycle.setData(recruitmentCycle, context?.previousQuestions);
        },
        onSettled: () => utils.applicationQuestion.getByCycle.invalidate()
    });
    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragEnd = (e: DragEndEvent) => {
        if (!questions) return;
        const { active, over } = e;
        if (over && active.id !== over.id) {
            const activeIdx = questions.findIndex(q => q.id === active.id);
            const overIdx = questions.findIndex(q => q.id === over.id);
            let newQuestions = [...questions];
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
                    questions[activeIdx]!
                );
            }
            void reorderQuestionMutation.mutateAsync(newQuestions.map(q => q.id ?? ""));
        }
    };

    const deleteQuestion = (id: string) => {
        void deleteQuestionMutation.mutateAsync(id);
    };

    function SortableQuestion({ q }: { q: ApplicationQuestion }) {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging
        } = useSortable({ id: q.id ?? "", disabled: !editing });

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
                        <Button variant="ghost" className="p-0 mr-3 ml-2 h-6 w-6" onClick={() => deleteQuestion(q.id ?? "")}>
                            <Trash2 />
                        </Button>
                    )}
                    <CreateQuestion asChild existingQuestion={q} disabled={!editing}>
                        <div className={"flex flex-col " + (editing && "cursor-pointer")}>
                            <h1 className="flex text-md font-semibold">
                                {q.displayName}
                                {q.required && <Asterisk className="text-red-500 h-4"></Asterisk>}
                            </h1>
                            <h2 className="text-sm">{q.description}</h2>
                        </div>
                    </CreateQuestion>
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
                    Application Questions
                    <Button variant="ghost" onClick={() => setEditing(!editing)}>
                        {editing ? <X /> : <Pencil />}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow gap-y-2 divide-y">
                {!recruitmentCycle && "Select a recruitment cycle first"}
                {recruitmentCycle && !questions?.length && "No questions have been created"}
                <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                    <SortableContext
                        strategy={verticalListSortingStrategy}
                        items={questions?.map(q => q.id ?? "") ?? []}
                    >
                        {questions?.map(q => (
                            <SortableQuestion q={q} key={q.id}></SortableQuestion>
                        ))}
                    </SortableContext>
                </DndContext>
            </CardContent>
            <CardFooter className="flex justify-between flex-wrap gap-y-4">
                <PreviewApplication questions={questions ?? []}></PreviewApplication>
                <CreateQuestion></CreateQuestion>
            </CardFooter>
        </Card>
    );
}
