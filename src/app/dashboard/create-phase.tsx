import { type ReactNode, useEffect, useState } from "react";
import { type RecruitmentCyclePhase } from "../types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { createInsertSchema } from "drizzle-zod";
import { recruitmentCyclePhases } from "~/server/db/schema";
import { useForm } from "react-hook-form";
import { type z } from "zod";
import { useAtom } from "jotai";
import { selectedRecruitmentCycleAtom } from "./atoms";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";

const phaseSchema = createInsertSchema(recruitmentCyclePhases);


/**
 * Dialog for creating a recruitment cycle phase for the currently selected recruitment cycle
 * Practically the same as CreateQuestion
 *
 * @param existingPhase specify this to make the dialog edit a pre-existing phase instead of making
 * a new one
 * @param children the node children to use as a DialogTrigger
 * @param asChild whether children are specified to use as a DialogTrigger
 * @param disabled whether the button should be disabled
 */
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
    const [recruitmentCycle] = useAtom(selectedRecruitmentCycleAtom);
    const [open, setOpen] = useState<boolean>(false);
    const setDialogOpen = (val: boolean): void => {
        setOpen(!disabled && val);
    };

    const form = useForm<z.infer<typeof phaseSchema>>({
        defaultValues: existingPhase ? existingPhase : {
            cycleId: recruitmentCycle
        }
    });

    // reset the form to process any changes to the recruitmentCycle or existing phase
    useEffect(() => { form.reset(); }, [existingPhase, form]);
    useEffect(() => { form.setValue("cycleId", recruitmentCycle); }, [recruitmentCycle, form]);

    const utils = api.useContext();
    const createPhase = api.recruitmentCyclePhase.create.useMutation({
        onMutate: async (newPhase) => {
            // cancel outgoing refetches that will overwrite data
            await utils.recruitmentCyclePhase.getByCycleId.cancel();
            const previousPhases = utils.recruitmentCyclePhase.getByCycleId.getData(recruitmentCycle);

            // optimistically update phases 
            utils.recruitmentCyclePhase.getByCycleId.setData(
                recruitmentCycle,
                [...(previousPhases ?? []), { ...newPhase, id: "", order: Number.MAX_SAFE_INTEGER }]
            );

            return { previousPhases };
        },
        onError: (_err, _newPhase, context) => {
            utils.recruitmentCyclePhase.getByCycleId.setData(recruitmentCycle, context?.previousPhases);
        },
        onSettled: () => utils.recruitmentCyclePhase.invalidate()
    });
    const updatePhase = api.recruitmentCyclePhase.update.useMutation({
        onMutate: async (updatedPhase) => {
            // cancel outgoing refetches that will overwrite data
            await utils.recruitmentCyclePhase.getByCycleId.cancel();
            const previousPhases = utils.recruitmentCyclePhase.getByCycleId.getData(recruitmentCycle) ?? [];

            // optimistically update phases and make sure to preserve phase order
            const updatedPhaseIndex = previousPhases.findIndex(p => p.id === updatedPhase.id);
            const updatedPhases = [...previousPhases];
            updatedPhases[updatedPhaseIndex] = { ...previousPhases[updatedPhaseIndex]!, ...updatedPhase };
            utils.recruitmentCyclePhase.getByCycleId.setData(
                recruitmentCycle,
                updatedPhases
            );

            return { previousPhases };
        },
        onError: (_err, _newPhase, context) => {
            utils.recruitmentCyclePhase.getByCycleId.setData(recruitmentCycle, context?.previousPhases);
        },
        onSettled: () => utils.recruitmentCyclePhase.invalidate()
    });
    const onSubmit = (values: z.infer<typeof phaseSchema>) => {
        if (existingPhase) {
            void updatePhase.mutateAsync(values);
        } else {
            void createPhase.mutateAsync(values);
        }
        setOpen(false);
        form.reset();
    };

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
                    <DialogTitle>
                        {existingPhase ? "Edit recruitment cycle phase" : "Create a new recruitment cycle phase"}
                    </DialogTitle>
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
                            <Button type="submit">{existingPhase ? "Update" : "Create"}</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
