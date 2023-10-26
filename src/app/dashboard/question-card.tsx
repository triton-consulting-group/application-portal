"use client";

import { useAtom } from "jotai";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "src/components/ui/card";
import { applicationQuestionsAtom, selectedRecruitmentCycleAtom } from "./atoms";
import React from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Asterisk, GripVertical, Pencil, Trash2, X } from "lucide-react";
import CreateQuestion from "./create-question";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function QuestionCard() {
    const [recruitmentCycle] = useAtom(selectedRecruitmentCycleAtom);
    const [questions, setQuestions] = useAtom(applicationQuestionsAtom);
    const [editing, setEditing] = React.useState<boolean>(false);
    const getQuestions = api.applicationQuestion.getByCycle.useQuery(recruitmentCycle, { enabled: false });
    const deleteQuestionMutation = api.applicationQuestion.delete.useMutation();
    const reorderQuestionMutation = api.applicationQuestion.reorder.useMutation();
    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        if (over && active.id !== over.id) {
            const activeIdx = questions.findIndex(q => q.id === active.id);
            const overIdx = questions.findIndex(q => q.id === over.id);
            let newQuestions = [...questions]
            // if next to eachother, swap order
            // else insert at hover over position and move everything else back
            if (Math.abs(activeIdx - overIdx) === 1) {
                const tmp = newQuestions[activeIdx];
                newQuestions[activeIdx] = newQuestions[overIdx] as typeof questions[number];
                newQuestions[overIdx] = tmp as typeof questions[number];
            } else {
                newQuestions = newQuestions.filter(q => q.id !== active.id);
                newQuestions.splice(
                    overIdx, 
                    0,
                    questions[activeIdx] as typeof questions[number]
                );
            }
            setQuestions(newQuestions.map((q, idx) => {
                q.order = idx;
                return q;
            }));
            reorderQuestionMutation.mutateAsync(newQuestions.map(q => q.id ?? ""));
        }
    };

    const fetchQuestions = async () => {
        if (recruitmentCycle) {
            const questions = (await getQuestions.refetch()).data || [];
            setQuestions(questions);
        }
    };

    const deleteQuestion = async (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
        await deleteQuestionMutation.mutateAsync(id);
    };

    React.useEffect(() => {
        fetchQuestions();
    }, [recruitmentCycle]);

    function SortableQuestion({ q }: { q: typeof questions[number] }) {
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
                    <div className="flex flex-col">
                        <h1 className="flex text-md font-semibold">
                            {q.displayName}
                            {q.required && <Asterisk className="text-red-500 h-4"></Asterisk>}
                        </h1>
                        <h2 className="text-sm">{q.description}</h2>
                    </div>
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
        )
    }

    return (
        <Card className="w-1/3">
            <CardHeader className="pb-1">
                <CardTitle className="flex justify-between items-center">
                    Application Questions
                    <Button variant="ghost" onClick={() => setEditing(!editing)}>
                        {editing ? <X /> : <Pencil />}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-y-2 divide-y">
                {!recruitmentCycle && "Select a recruitment cycle first"}
                {!questions.length && "No questions have been created"}
                <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                    <SortableContext
                        strategy={verticalListSortingStrategy}
                        items={questions.map(q => q.id ?? "")}
                    >
                        {questions.map(q => (
                            <SortableQuestion q={q} key={q.id}></SortableQuestion>
                        ))}
                    </SortableContext>
                </DndContext>
            </CardContent>
            <CardFooter className="flex justify-between flex-wrap gap-y-4">
                <Button>Preview Application</Button>
                <CreateQuestion></CreateQuestion>
            </CardFooter>
        </Card>
    );
}
