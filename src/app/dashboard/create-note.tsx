import { type ReactNode, useEffect, useState } from "react";
import { type ApplicationNote } from "../types";
import { createInsertSchema } from "drizzle-zod";
import { applicationNotes } from "~/server/db/schema";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "~/trpc/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "~/components/ui/form";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import { getSession } from "next-auth/react";

const noteSchema = createInsertSchema(applicationNotes, { authorId: z.string().optional() });

export default function CreateNote({
    applicationId,
    existingNote,
    children,
    asChild,
    disabled
}: {
    applicationId: string,
    existingNote?: ApplicationNote,
    children?: ReactNode,
    asChild?: boolean,
    disabled?: boolean
}) {
    const [open, setOpen] = useState<boolean>(false);
    const setDialogOpen = (val: boolean): void => {
        setOpen(!disabled && val);
    };

    const form = useForm<z.infer<typeof noteSchema>>({
        defaultValues: existingNote ? existingNote : {
            applicationId: applicationId,
        }
    });

    useEffect(() => form.reset(existingNote), [existingNote, form]);

    const utils = api.useContext();

    const createNoteMutation = api.applicationNote.create.useMutation({
        onMutate: async (newNote) => {
            // cancel outgoing refetches that will overwrite data
            await utils.applicationNote.getByApplicationId.cancel();
            const previousNotes = utils.applicationNote.getByApplicationId.getData(applicationId) ?? [];

            // optimistically update notes
            const user = (await getSession())?.user;
            utils.applicationNote.getByApplicationId.setData(
                applicationId,
                [{ ...newNote, authorName: user?.name ?? "", authorId: user?.id ?? "", id: "" }, ...previousNotes]
            );

            return { previousNotes };
        },
        onError: (_err, _newNote, context) => {
            utils.applicationNote.getByApplicationId.setData(applicationId, context?.previousNotes);
        },
        onSettled: () => utils.applicationNote.getByApplicationId.invalidate(applicationId)
    });
    const updateNoteMutation = api.applicationNote.update.useMutation({
        onMutate: async (updatedNote) => {
            // cancel outgoing refetches that will overwrite data
            await utils.applicationNote.getByApplicationId.cancel();
            const previousNotes = utils.applicationNote.getByApplicationId.getData(applicationId) ?? [];

            // optimistically update notes
            const newNote = { ...previousNotes.find(n => n.id === updatedNote.noteId)!, ...updatedNote };
            utils.applicationNote.getByApplicationId.setData(
                applicationId,
                [newNote, ...previousNotes.filter(n => n.id !== updatedNote.noteId)],
            );

            return { previousNotes };
        },
        onError: (_err, _newNote, context) => {
            utils.applicationNote.getByApplicationId.setData(applicationId, context?.previousNotes);
        },
        onSettled: () => utils.applicationNote.getByApplicationId.invalidate(applicationId)
    });

    const onSubmit = (values: z.infer<typeof noteSchema>) => {
        setOpen(false);
        if (existingNote) {
            void updateNoteMutation.mutateAsync({ noteId: existingNote.id, title: values.title, content: values.content });
        } else {
            void createNoteMutation.mutateAsync(values);
            form.reset({ applicationId: applicationId, title: "", content: "" });
        }
    };

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
    );
}


