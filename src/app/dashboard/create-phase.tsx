import { ReactNode, useEffect, useState } from "react"
import { RecruitmentCyclePhase } from "../types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { createInsertSchema } from "drizzle-zod";
import { recruitmentCyclePhases } from "~/server/db/schema";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAtom } from "jotai";
import { recruitmentCyclePhasesAtom, selectedRecruitmentCycleAtom } from "./atoms";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";

const phaseSchema = createInsertSchema(recruitmentCyclePhases);

export default function CreatePhase({
    existingPhase,
    children,
    asChild,
    disabled
}: {
    existingPhase?: RecruitmentCyclePhase,
    children?: ReactNode,
    asChild?: boolean,
    disabled?: boolean
}) {
    const [, setPhases] = useAtom(recruitmentCyclePhasesAtom);
    const [recruitmentCycle] = useAtom(selectedRecruitmentCycleAtom);
    const [open, setOpen] = useState<boolean>(false);
    const setDialogOpen = (val: boolean): void => {
        setOpen(!disabled && val);
    }

    const form = useForm<z.infer<typeof phaseSchema>>({
        defaultValues: existingPhase ? existingPhase : {
            cycleId: recruitmentCycle
        }
    })

    useEffect(() => { form.reset(); }, [existingPhase])
    useEffect(() => { form.setValue("cycleId", recruitmentCycle) }, [recruitmentCycle]);

    const createPhase = api.recruitmentCyclePhase.create.useMutation();
    const updatePhase = api.recruitmentCyclePhase.update.useMutation();
    const getPhases = api.recruitmentCyclePhase.getByCycleId.useQuery(recruitmentCycle, { enabled: false });
    const onSubmit = async (values: z.infer<typeof phaseSchema>) => {
        if (existingPhase) {
            await updatePhase.mutateAsync(values);
        } else {
            await createPhase.mutateAsync(values);
        }
        setOpen(false);
        setPhases((await getPhases.refetch()).data || []);
        form.reset();
    }

    return (
        <Dialog open={open} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                {asChild ? children : (
                    <Button>
                        Create New Phase +
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="flex flex-col h-fit w-max">
                <DialogHeader>
                    <DialogTitle >Create a new recruitment cycle phase</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
                        <FormField
                            control={form.control}
                            name="displayName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Name here"
                                            required
                                            value={field.value ?? ''}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        This is the name of the recruitment cycle phase.
                                    </FormDescription>
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end">
                            <Button type="submit" form="form">{existingPhase ? "Update" : "Create"}</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
