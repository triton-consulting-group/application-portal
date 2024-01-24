import { useAtom } from "jotai";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "src/components/ui/dialog";
import { selectedRecruitmentCycleAtom } from "./atoms";
import { Button } from "~/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { applicationQuestions } from "~/server/db/schema";
import { api } from "~/trpc/react";
import { type ReactNode, type KeyboardEvent, useState, useEffect } from "react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { FieldType } from "~/server/db/types";
import { Checkbox } from "~/components/ui/checkbox";
import { Badge } from "~/components/ui/badge";
import { X } from "lucide-react";
import { ApplicationQuestion } from "~/components/ui/application-question";
import { type ApplicationQuestion as ApplicationQuestionType } from "../types";
import { ScrollArea } from "~/components/ui/scroll-area";

const questionSchema = createInsertSchema(applicationQuestions, { options: z.string().array() });


/**
 * Dialog for creating an application question for the currently selected recruitment cycle
 * Practically the same as CreatePhase
 *
 * @param existingPhase specify this to make the dialog edit a pre-existing question instead of making
 * a new one
 * @param children the node children to use as a DialogTrigger
 * @param asChild whether children are specified to use as a DialogTrigger
 * @param disabled whether the button should be disabled
 */
export default function CreateQuestion({
    existingQuestion,
    children,
    asChild,
    disabled
}: {
    existingQuestion?: z.infer<typeof questionSchema>,
    children?: ReactNode,
    asChild?: boolean
    disabled?: boolean
}) {
    const [open, setOpen] = useState<boolean>(false);
    const [recruitmentCycle] = useAtom(selectedRecruitmentCycleAtom);

    const questionTypes: { value: FieldType, name: string }[] = Object.values(FieldType).map(type => ({
        value: type,
        name: type.replaceAll("_", " ").split(" ").map(s => s[0]?.toUpperCase() + s.substring(1)).join(" ")
    }));
    const form = useForm<z.infer<typeof questionSchema>>({
        defaultValues: existingQuestion ? existingQuestion : {
            required: false,
            cycleId: recruitmentCycle,
        }
    });

    useEffect(() => { form.reset(); }, [existingQuestion, form]);
    useEffect(() => { form.setValue("cycleId", recruitmentCycle); }, [recruitmentCycle, form]);

    const type = form.watch("type");
    const options = form.watch("options");
    const formValues = form.watch();
    const [option, setOption] = useState<string>("");
    function onOptionFieldKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            e.preventDefault();
            const opts: string[] = form.getValues("options") ?? [];
            if (!opts.includes(option)) {
                opts.push(option);
            }
            form.setValue("options", opts);
            setOption("");
        }
    }
    function deleteOption(option: string) {
        form.setValue("options", (form.getValues("options") ?? []).filter(o => o !== option));
    }

    const dummyForm = useForm<Record<string, string>>({ defaultValues: { "test": "" } });

    const utils = api.useContext();
    const createQuestion = api.applicationQuestion.create.useMutation({
        onMutate: async (newQuestion) => {
            // cancel outgoing refetches that will overwrite data
            await utils.applicationQuestion.getByCycle.cancel();
            const previousQuestions = utils.applicationQuestion.getByCycle.getData(recruitmentCycle);

            // optimistically update questions, adding the new question to the end
            utils.applicationQuestion.getByCycle.setData(
                recruitmentCycle,
                [
                    ...(previousQuestions ?? []),
                    {
                        description: null,
                        placeholder: null,
                        options: null,
                        maxLength: null,
                        minLength: null,
                        ...newQuestion,
                        id: "",
                        order: Number.MAX_SAFE_INTEGER
                    }
                ]
            );

            return { previousQuestions };
        },
        onError: (_err, _newQuestion, context) => {
            utils.applicationQuestion.getByCycle.setData(recruitmentCycle, context?.previousQuestions);
        },
        onSettled: () => utils.applicationQuestion.getByCycle.invalidate(recruitmentCycle)
    });
    const updateQuestion = api.applicationQuestion.update.useMutation({
        onMutate: async (updatedQuestion) => {
            // cancel outgoing refetches that will overwrite data
            await utils.applicationQuestion.getByCycle.cancel();
            const previousQuestions = utils.applicationQuestion.getByCycle.getData(recruitmentCycle) ?? [];

            // optimistically update questions and preserve order
            const updatedQuestionIndex = previousQuestions.findIndex(q => q.id === updatedQuestion.id);
            const updatedQuestions = [...previousQuestions];
            updatedQuestions[updatedQuestionIndex] = { ...previousQuestions[updatedQuestionIndex]!, ...updatedQuestion };
            utils.applicationQuestion.getByCycle.setData(
                recruitmentCycle,
                updatedQuestions
            );

            return { previousQuestions };
        },
        onError: (_err, _newQuestion, context) => {
            utils.applicationQuestion.getByCycle.setData(recruitmentCycle, context?.previousQuestions);
        },
        onSettled: () => utils.applicationQuestion.invalidate()
    });
    const onSubmit = (values: z.infer<typeof questionSchema>) => {
        if (existingQuestion) {
            void updateQuestion.mutateAsync(values);
        } else {
            void createQuestion.mutateAsync(values);
        }
        setOpen(false);
        setOption("");
        form.reset();
    };

    const setDialogOpen = (val: boolean): void => {
        setOpen(!disabled && val);
    };

    return (
        <Dialog open={open} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                {asChild ? children : (
                    <Button>
                        Create New Question +
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="flex flex-col h-[80%] w-max overflow-x-visible z-50">
                <DialogHeader>
                    <DialogTitle className="pl-2">Create a new application question</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[100%] overflow-x-visible">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 px-2" autoComplete="off" id="form">
                            <FormField
                                control={form.control}
                                name="displayName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Question Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Name here"
                                                required
                                                value={field.value ?? ''}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormDescription>This is your question name. E.g "Why TCG?"</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Question Description</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Description here"
                                                value={field.value ?? ''}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            This is your question description. E.g "Why do you want to join TCG? (100 characters minimum)"
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="placeholder"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Question Placeholder</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Placeholder here"
                                                value={field.value ?? ''}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            This is your question placeholder that appears when the question field
                                            has no input.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Question Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a question type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {questionTypes.map(q => (
                                                    <SelectItem key={q.value} value={q.value}>{q.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            This is your question type. E.g "String" or "Multiple Choice"
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {type === FieldType.STRING && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="minLength"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Minimum Length</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        required
                                                        type="number"
                                                        placeholder="0-15,000"
                                                        value={field.value ?? ''}
                                                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    This is your question's minimum response length in characters.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="maxLength"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Maximum Length</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        required
                                                        type="number"
                                                        placeholder="0-15,000"
                                                        value={field.value ?? ''}
                                                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    This is your question's maximum response length in characters.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}
                            {
                                (type === FieldType.MULTIPLE_CHOICE || type === FieldType.CHECKBOX || type === FieldType.DROPDOWN) && (
                                    <FormField
                                        control={form.control}
                                        name="options"
                                        render={() => (
                                            <FormItem>
                                                <FormLabel>Response Options</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Option here"
                                                        value={option}
                                                        onChange={(e) => setOption(e.target.value)}
                                                        onKeyDown={onOptionFieldKeyDown}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    This is your question's response options. Press enter after each option.
                                                    Click the "X" on the option badge to delete it.
                                                </FormDescription>
                                                <div className="flex gap-x-2 flex-wrap gap-y-2">
                                                    {(options ?? []).map(o => (
                                                        <Badge className="flex flex-row gap-x-2" key={o}>
                                                            {o}
                                                            <Button variant="ghost" className="p-0 h-fit" onClick={() => deleteOption(o)}>
                                                                <X className="h-4 w-4"></X>
                                                            </Button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )
                            }
                            <FormField
                                control={form.control}
                                name="required"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Required?</FormLabel>
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            This is whether the question is required.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </form>
                    </Form>
                </ScrollArea>
                <div className="text-sm pl-2 mb-2">
                    <h1 className="text-lg">Preview</h1>
                    {formValues.type && (
                        <Form {...dummyForm}>
                            <form>
                                <ApplicationQuestion
                                    question={{ id: "test", ...formValues } as ApplicationQuestionType}
                                    control={dummyForm.control}
                                ></ApplicationQuestion>
                            </form>
                        </Form>
                    )}
                    {!formValues.type && "Select a question type to see a preview"}
                </div>
                <div className="flex justify-end">
                    <Button type="submit" form="form">{existingQuestion ? "Update" : "Create"}</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
