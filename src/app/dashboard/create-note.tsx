import { Dispatch, ReactNode, SetStateAction, useEffect, useState } from "react";
import { ApplicationNote } from "../types";
import { createInsertSchema } from "drizzle-zod";
import { applicationNotes } from "~/server/db/schema";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "~/trpc/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel } from "~/components/ui/form"
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";

const noteSchema = createInsertSchema(applicationNotes, { authorId: z.string().optional() });

export default function CreateNote({
    applicationId,
    setNotes,
    existingNote,
    children,
    asChild,
    disabled
}: {
    applicationId: string,
    setNotes: Dispatch<SetStateAction<(ApplicationNote & { authorName: string | null })[]>>
    existingNote?: ApplicationNote,
    children?: ReactNode,
    asChild?: boolean,
    disabled?: boolean
}) {
    const [open, setOpen] = useState<boolean>(false);
    const setDialogOpen = (val: boolean): void => {
        setOpen(!disabled && val);
    }

    const form = useForm<z.infer<typeof noteSchema>>({
        defaultValues: existingNote ? existingNote : {
            applicationId: applicationId,
        }
    });

    useEffect(() => { form.reset(); }, [existingNote])

    const createNote = api.applicationNote.create.useMutation();
    const updateNote = api.applicationNote.update.useMutation();
    const getNotes = api.applicationNote.getByApplicationId.useQuery(applicationId, {enabled: false});

    const onSubmit = async (values: z.infer<typeof noteSchema>) => {
        if (existingNote) {
            await updateNote.mutateAsync({ noteId: existingNote.id, title: values.title, content: values.content });
        } else {
            await createNote.mutateAsync(values)
        }
        setOpen(false);
        form.reset();
        setNotes((await getNotes.refetch()).data ?? []) 
    }

    return (
        <Dialog open={open} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                {asChild ? children : (
                    <Button>
                        Create New  Note +
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="flex flex-col h-fit max-w-[80%]">
                <DialogHeader>
                    <DialogTitle>Create a new note</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-3">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Title your note"
                                            value={field.value ?? ""}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Content</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Type anything"
                                            value={field.value ?? ""}
                                            onChange={field.onChange}
                                            className="h-32"
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end">
                            <Button type="submit">{existingNote ? "Update" : "Create"}</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}


