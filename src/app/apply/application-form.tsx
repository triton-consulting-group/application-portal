"use client";

import { Form } from "~/components/ui/form";
import type { Application, ApplicationQuestion as ApplicationQuestionType, ApplicationResponse, RecruitmentCycle } from "../types";
import { Button } from "~/components/ui/button";
import { useForm } from "react-hook-form";
import { ApplicationQuestion } from "~/components/ui/application-question";
import { z } from "zod";
import { getValidator } from "~/lib/validate-question";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { applicationResponses } from "~/server/db/schema";
import { createInsertSchema } from "drizzle-zod";
import { api } from "~/trpc/react";
import { FieldType } from "~/server/db/types";

const insertResponseSchema = createInsertSchema(applicationResponses);
type ApplicationResponseInsert = z.infer<typeof insertResponseSchema>;
const UPDATE_INTERVAL = 1000;

export function ApplicationForm({
    questions,
    responses,
    application,
    cycle,
}: {
    questions: ApplicationQuestionType[],
    responses: ApplicationResponse[],
    application: Application,
    cycle: RecruitmentCycle
}) {
    const [fileUploadQueue, setFileUploadQueue] = useState<string[]>([]);
    const [submitted, setSubmitted] = useState<boolean>(application.submitted);
    const submitApplicationMutation = api.application.submit.useMutation();
    const submitApplication = async () => {
        setSubmitted(true);
        await submitApplicationMutation.mutateAsync(application.id);
    };

    const formSchema = z.object(Object.fromEntries(questions.map(q => {
        const validator = getValidator(q);
        if (q.type === FieldType.FILE_UPLOAD && responses.find(r => r.questionId === q.id)?.value) {
            return [q.id, validator.nullish()];
        };

        return [q.id, validator];
    })));

    const defaultValues = questions.reduce((accumulator, question) => {
        return {
            [question.id]: responses.find(r => r.questionId === question.id)?.value ?? "",
            ...accumulator
        };
    }, {});

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultValues
    });
    const formWatch: Record<string, string> = form.watch();
    const prevSavedForm = useRef(defaultValues);
    const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
    const updateQueue = useRef<Record<string, { value: string | FileList[number] } & ApplicationResponseInsert>>({});
    const createOrUpdateResponseMutation = api.applicationResponse.createOrUpdate.useMutation();
    const getPresignedUploadMutation = api.applicationResponse.getS3UploadUrl.useMutation();

    useEffect(() => {
        for (const questionId of Object.keys(formWatch)) {
            if (formWatch[questionId] !== prevSavedForm.current[questionId as keyof typeof defaultValues]) {
                const response = responses.find(r => r.questionId === questionId);
                updateQueue.current[questionId] = {
                    questionId: questionId,
                    applicationId: application.id,
                    value: formWatch[questionId]!,
                    ... (response ? { id: response.id } : {})
                };
            }
        }

        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            void (async () => {
                for (const key in updateQueue.current) {
                    const update = updateQueue.current[key]!;
                    const question = questions.find(q => q.id === key);
                    if (!question) throw new Error("Question not found");
                    if (question.type === FieldType.FILE_UPLOAD) {
                        // pre-emptively delete key off queue so it doesn't re-run and re-upload on long uploads
                        setFileUploadQueue([...fileUploadQueue, key]);
                        delete updateQueue.current[key];
                        const { url: presignedUrl, key: fileName } = await getPresignedUploadMutation.mutateAsync((update.value as File).name);
                        await fetch(presignedUrl, { method: "PUT", body: update.value });
                        update.value = fileName;
                        setFileUploadQueue(fileUploadQueue.filter(k => k !== key));
                    }
                    createOrUpdateResponseMutation.mutate(update);
                }
                updateQueue.current = {};
            })();
        }, UPDATE_INTERVAL);
        prevSavedForm.current = formWatch;
    }, [formWatch]);

    const formatDate = (d: Date): string => {
        return `${d.toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} ${d.toLocaleTimeString()}`;
    };

    return (
        <div>
            <div className="flex flex-col gap-y-2 mb-4">
                <h1 className="text-3xl">Application</h1>
                <h2 className="mb-2">
                    {submitted ?
                        "You've already submitted your application. Keep an eye on your email for any updates to your application." :
                        `This form autosaves! Feel free to leave and finish your application later. Once you are
                        ready to submit, click "Submit Application".`
                    }
                </h2>
                {!submitted && <h2>You have until {formatDate(cycle.endTime)} to submit your application.</h2>}
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(submitApplication)} className="space-y-8">
                    {questions.map(q => (
                        <ApplicationQuestion
                            disabled={submitted}
                            question={q}
                            control={form.control}
                            key={q.id}
                        ></ApplicationQuestion>
                    ))}
                    {!submitted && <Button type="submit" disabled={fileUploadQueue.length > 0}>Submit Application</Button>}
                </form>
            </Form>
        </div>
    );
}

