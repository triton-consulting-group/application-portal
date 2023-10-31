"use client";

import { Form } from "~/components/ui/form";
import { ApplicationQuestion as ApplicationQuestionType } from "../types";
import { Button } from "~/components/ui/button";
import { useForm } from "react-hook-form";
import { ApplicationQuestion } from "~/components/ui/application-question";
import { z } from "zod";
import { getValidator } from "~/lib/validate-question";
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react";

export function ApplicationForm( { questions } : { questions: ApplicationQuestionType[]  } ) {
    const submitApplication = () => {
        
    };
    
    const formSchema = z.object(Object.fromEntries(questions.map(q => [q.id, getValidator(q)])));
    const form = useForm<z.infer<typeof formSchema>>({ resolver: zodResolver(formSchema) });
    
    useEffect(() => {
        console.log(form.formState.dirtyFields) 
    }, [form.formState])

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(submitApplication)} className="space-y-8">
                { questions.map(q => (
                    <ApplicationQuestion question={q} control={form.control} key={q.id}></ApplicationQuestion>
                )) }
                <Button type="submit">Submit Application</Button>
            </form>
        </Form> 
    )
}

