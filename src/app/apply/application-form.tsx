"use client";

import { Form } from "~/components/ui/form";
import { Application, ApplicationQuestion as ApplicationQuestionType, ApplicationResponse } from "../types";
import { Button } from "~/components/ui/button";
import { useForm } from "react-hook-form";
import { ApplicationQuestion } from "~/components/ui/application-question";
import { z } from "zod";
import { getValidator } from "~/lib/validate-question";
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useRef } from "react";
import { applicationResponses } from "~/server/db/schema";
import { createInsertSchema } from "drizzle-zod";
import { api } from "~/trpc/react";

const insertResponseSchema = createInsertSchema(applicationResponses)
type ApplicationResponseInsert = z.infer<typeof insertResponseSchema>;
const UPDATE_INTERVAL = 1000;

export function ApplicationForm({
    questions,
    responses,
    application,
}: {
    questions: ApplicationQuestionType[],
    responses: ApplicationResponse[],
    application: Application,
}) {
    const submitApplication = () => {

    };

    const formSchema = z.object(Object.fromEntries(questions.map(q => [q.id, getValidator(q)])));
    const defaultValues = questions.reduce((accumulator, question) => {
        return { [question.id]: responses.find(r => r.questionId === question.id)?.value ?? "", ...accumulator };
    }, {});

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultValues
    });
    const formWatch = form.watch();
    const prevSavedForm = useRef(defaultValues);
    const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
    const updateQueue = useRef<{ [key: string]: ApplicationResponseInsert }>({});
    const createOrUpdateResponse = api.applicationResponse.createOrUpdate.useMutation();

    useEffect(() => {
        for (const questionId of Object.keys(formWatch)) {
            if (formWatch[questionId] !== prevSavedForm.current[questionId as keyof typeof defaultValues]) {
                const response = responses.find(r => r.questionId === questionId);
                updateQueue.current[questionId] = {
                    questionId: questionId,
                    applicationId: application.id,
                    value: formWatch[questionId],
                    ... (response ? { id: response.id } : {})
                };
            }
        }

        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            for (const key in updateQueue.current) {
                createOrUpdateResponse.mutate(updateQueue.current[key] as ApplicationResponseInsert);
            }
            updateQueue.current = {}
        }, UPDATE_INTERVAL);
        prevSavedForm.current = formWatch;
    }, [formWatch]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(submitApplication)} className="space-y-8">
                {questions.map(q => (
                    <ApplicationQuestion question={q} control={form.control} key={q.id}></ApplicationQuestion>
                ))}
                <Button type="submit">Submit Application</Button>
            </form>
        </Form>
    )
}

