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
import { Asterisk, Pencil, Trash2, X } from "lucide-react";
import CreateQuestion from "./create-question";

export default function QuestionCard() {
    const [recruitmentCycle] = useAtom(selectedRecruitmentCycleAtom);
    const [questions, setQuestions] = useAtom(applicationQuestionsAtom);
    const [editing, setEditing] = React.useState<boolean>(false);
    const getQuestions = api.applicationQuestion.getByCycle.useQuery(recruitmentCycle, { enabled: false });
    const deleteQuestionMutation = api.applicationQuestion.delete.useMutation();

    const fetchQuestions = async () => {
        if (recruitmentCycle) {
            const questions = (await getQuestions.refetch()).data || [];
            setQuestions(questions);
        }
    };

    const deleteQuestion = async (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
        await deleteQuestionMutation.mutateAsync(id);
    }

    React.useEffect(() => {
        fetchQuestions();
    }, [recruitmentCycle]);

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
                {questions.map(q => (
                    <div className="border-zinc-700 pt-2 flex flex-row items-center" key={q.id}>
                        {editing && (
                            <Button variant="ghost" className="p-0 mr-3 ml-2" onClick={() => deleteQuestion(q.id ?? "")}>
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
                ))}
            </CardContent>
            <CardFooter className="flex justify-between flex-wrap gap-y-4">
                <Button>Preview Application</Button>
                <CreateQuestion></CreateQuestion>
            </CardFooter>
        </Card>
    );
}
