import { createInsertSchema } from "drizzle-zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import DateTimeInput from "~/components/ui/datetime-input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { recruitmentCycles } from "~/server/db/schema";
import { api } from "~/trpc/react";
import { recruitmentCycleAtom } from "./atoms";
import { useAtom } from "jotai";

export default function CreateRecruitmentCycle({
    setDialogOpen
}: {
    setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
}) {
    const formSchema = createInsertSchema(recruitmentCycles);
    const form = useForm<z.infer<typeof formSchema>>({
        defaultValues: {
            displayName: "",
        }
    });
    const createCycle = api.recruitmentCycle.create.useMutation();
    const getCycles = api.recruitmentCycle.getAll.useQuery(undefined, { enabled: false });

    const [cycles, setCycles] = useAtom(recruitmentCycleAtom);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (values.endTime <= values.startTime) {
            return;
        }
        await createCycle.mutateAsync(values);
        setDialogOpen(false);
        setCycles((await getCycles.refetch()).data || []);
    }

    return (
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
                                <DateTimeInput onChange={field.onChange} value={field.value}></DateTimeInput>
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
                                <DateTimeInput onChange={field.onChange} value={field.value}></DateTimeInput>
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
    )
}
