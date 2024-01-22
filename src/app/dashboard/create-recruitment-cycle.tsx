import { createInsertSchema } from "drizzle-zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";
import { Button } from "~/components/ui/button";
import DateTimeInput from "~/components/ui/datetime-input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { recruitmentCycles } from "~/server/db/schema";
import { api } from "~/trpc/react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { useState } from "react";

export default function CreateRecruitmentCycle() {
    const [open, setOpen] = useState<boolean>(false);

    const formSchema = createInsertSchema(recruitmentCycles);
    const form = useForm<z.infer<typeof formSchema>>({
        defaultValues: {
            displayName: "",
        }
    });
        
    const utils = api.useContext();
    const createCycleMutation = api.recruitmentCycle.create.useMutation({
        onSettled: () => { 
            void utils.recruitmentCycle.getAll.invalidate();
            void utils.recruitmentCycle.getActive.invalidate();
        }
    });

    const startTimeWatch = form.watch("startTime");

    async function onSubmit(values: z.infer<typeof formSchema>) {
        await createCycleMutation.mutateAsync(values);
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>Create New +</DialogTrigger>
            <DialogContent>
                <DialogTitle>Create New Recruitment Cycle</DialogTitle>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" autoComplete="off">
                        <FormField
                            control={form.control}
                            name="displayName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input required placeholder="Cycle name" {...field}></Input>
                                    </FormControl>
                                    <FormDescription>
                                        This is the name of the recruitment cycle. E.g "Winter 2023"
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="startTime"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Start Time</FormLabel>
                                    <FormControl>
                                        <DateTimeInput
                                            afterDate={new Date()}
                                            onChange={field.onChange}
                                            value={field.value}
                                        ></DateTimeInput>
                                    </FormControl>
                                    <FormDescription>
                                        This is the time that the recruitment cycle applications will
                                        open.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="endTime"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>End Time</FormLabel>
                                    <FormControl>
                                        <DateTimeInput
                                            afterDate={startTimeWatch ?? new Date()}
                                            onChange={field.onChange}
                                            value={field.value}
                                        ></DateTimeInput>
                                    </FormControl>
                                    <FormDescription>
                                        This is the time that the recruitment cycle applications will
                                        close.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit">Create</Button>
                    </form>
                </Form>

            </DialogContent>
        </Dialog>
    );
}
