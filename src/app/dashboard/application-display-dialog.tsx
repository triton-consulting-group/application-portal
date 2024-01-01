"use client";

import { type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import type { ApplicationQuestion as ApplicationQuestionType, ApplicationWithResponses } from "../types";
import { ApplicationQuestion } from "~/components/ui/application-question";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getValidator } from "~/lib/validate-question";
import { Button } from "react-day-picker";
import { Form } from "~/components/ui/form";

export default function ApplicationDisplayDialog({
    application,
    questions,
    asChild,
    children,
}: {
    application: ApplicationWithResponses,
    questions: ApplicationQuestionType[],
    asChild?: boolean,
    children?: ReactNode,
}) {

    const formSchema = z.object(Object.fromEntries(questions.map(q => [q.id, getValidator(q)])));
    const defaultValues = questions.reduce((accumulator, question) => {
        return { [question.id]: application.responses.find(r => r.questionId === question.id)?.value ?? "", ...accumulator };
    }, {});
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultValues
    });

    return (
        <Dialog>
            <DialogTrigger asChild={asChild}>
                {asChild ? children : <Button>View Application</Button>}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{application.name}'s Application</DialogTitle>
                    <DialogDescription>{application.email}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form className="space-y-4">
                        {questions.map(q => (
                            <ApplicationQuestion
                                disabled={true}
                                question={q}
                                control={form.control}
                                key={q.id}
                            ></ApplicationQuestion>
                        ))}
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

