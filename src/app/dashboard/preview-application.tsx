import { ApplicationQuestion as ApplicationQuestionType } from "../types"
import { Form } from "~/components/ui/form";
import { Button } from "~/components/ui/button";
import { ApplicationQuestion } from "~/components/ui/application-question";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getValidator } from "~/lib/validate-question";

export function PreviewApplication({
    questions
}: {
    questions: ApplicationQuestionType[]
}) {
    const formSchema = z.object(Object.fromEntries(questions.map(q => [q.id, getValidator(q)])));
    const defaultValues = questions.reduce((accumulator, question) => {
        return { [question.id]: "", ...accumulator };
    }, {});
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultValues
    });

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button>Preview Application</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Application Preview</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form className="space-y-8">
                        {questions.map(q => (
                            <ApplicationQuestion
                                question={q}
                                control={form.control}
                                key={q.id}
                            ></ApplicationQuestion>
                        ))}
                        <Button type="submit">Submit Application</Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
