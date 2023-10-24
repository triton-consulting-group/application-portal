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
import { Pencil, X } from "lucide-react";
import CreateQuestion from "./create-question";

export default function QuestionCard() {
    const [recruitmentCycle] = useAtom(selectedRecruitmentCycleAtom);
    const [questions, setQuestions] = useAtom(applicationQuestionsAtom);
    const [editing, setEditing] = React.useState<boolean>(false);
    const getQuestions = api.applicationQuestion.getByCycle.useQuery(recruitmentCycle, { enabled: false });

    const fetchQuestions = async () => {
        if (recruitmentCycle) {
            setQuestions((await getQuestions.refetch()).data || []);
        }
    }

    React.useEffect(() => {
        fetchQuestions();
    }, [recruitmentCycle]);

    return (
        <Card className="w-1/3">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    Application Questions
                    <Button variant="ghost" onClick={() => setEditing(!editing)}>
                        {editing ? <X /> : <Pencil />}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!recruitmentCycle && "Select a recruitment cycle first"}
                {!questions.length && "No questions have been created"}
                {questions.map(q => (
                    <div>
                        {q.displayName}
                        {q.description}
                    </div>
                ))}
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button>Preview Application</Button>
                <CreateQuestion></CreateQuestion>
            </CardFooter>
        </Card>
    )
}
