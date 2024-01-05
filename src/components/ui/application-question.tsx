import { type FieldValues, type Control, type ControllerRenderProps } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { FieldType } from "~/server/db/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Checkbox } from "./checkbox";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Asterisk } from "lucide-react";
import { type ApplicationQuestion } from "~/app/types";
import FileViewerDialog from "./file-viewer-dialog";

function FileUploadQuestionContent({
    question,
    field,
    disabled
}: {
    question: ApplicationQuestion,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    field: ControllerRenderProps<Record<string, string>, string>,
    disabled?: boolean,
}) {
    return (
        <div className="flex flex-col gap-y-2">
            {typeof field.value === "string" && (
                <FormDescription>
                    You've already uploaded a file. You can view it again by clicking the eye icon or
                    upload a new file with the input below.
                </FormDescription>
            )}
            <div className="flex gap-x-2">
                <Input
                    type="file"
                    accept="image/png, image/jpeg, application/pdf"
                    placeholder={question.placeholder ?? ""}
                    disabled={disabled}
                    className="w-fit"
                    onChange={(e) => {
                        field.onChange(e.target?.files?.[0]);
                    }}
                />
                <FileViewerDialog src={field.value} />
            </div>
        </div>
    )
}

function QuestionContent({
    question,
    field,
    disabled,
}: {
    question: ApplicationQuestion,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    field: ControllerRenderProps<Record<string, string>, string>,
    disabled?: boolean,
}) {
    if (question.type === FieldType.STRING) {
        if ((question.maxLength ?? 0) < 100) {
            return (
                <Input
                    placeholder={question.placeholder ?? ""}
                    disabled={disabled}
                    {...field}
                />
            );
        } else {
            return (
                <Textarea
                    disabled={disabled}
                    placeholder={question.placeholder ?? ""}
                    className="resize-none"
                    {...field}
                />
            );
        }
    } else if (question.type === FieldType.DROPDOWN) {
        return (
            <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={disabled}
            >
                <SelectTrigger className="w-max min-w-[12rem]">
                    <SelectValue placeholder={question.placeholder ?? ""}></SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {(question.options ?? []).map(o => (
                        <SelectItem value={o} key={o}>{o}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    } else if (question.type === FieldType.MULTIPLE_CHOICE) {
        return (
            <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={disabled}
            >
                {(question.options ?? []).map(o => (
                    <FormItem className="flex items-center space-x-3 space-y-0" key={o}>
                        <FormControl>
                            <RadioGroupItem value={o} />
                        </FormControl>
                        <FormLabel className="font-normal">{o}</FormLabel>
                    </FormItem>
                ))}
            </RadioGroup>
        );
    } else if (question.type === FieldType.CHECKBOX) {
        return (
            <>
                {(question.options ?? []).map(o => (
                    <FormItem
                        key={o}
                        className="flex flex-row items-start space-x-3 space-y-0"
                    >
                        <FormControl>
                            <Checkbox
                                disabled={disabled}
                                checked={field.value?.split(",,,")?.includes(o)}
                                onCheckedChange={checked => {
                                    if (checked) {
                                        field.onChange([...(field.value ? field.value.split(",,,") : []), o].join(",,,"));
                                    } else {
                                        field.onChange(field.value
                                            .split(",,,")
                                            .filter((v: string) => v !== o)
                                            .join(",,,")
                                        );
                                    }
                                }}
                            />
                        </FormControl>
                        <FormLabel className="font-normal">{o}</FormLabel>
                    </FormItem>
                ))}
            </>
        );
    } else if (question.type === FieldType.BOOLEAN) {
        return (
            <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={disabled}
            >
                <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                        <RadioGroupItem value="true" />
                    </FormControl>
                    <FormLabel>Yes</FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                        <RadioGroupItem value="false" />
                    </FormControl>
                    <FormLabel>No</FormLabel>
                </FormItem>
            </RadioGroup>
        );
    } else if (question.type === FieldType.FILE_UPLOAD) {
        return (
            <FileUploadQuestionContent question={question} field={field} disabled={disabled} />
        )
    }
}

export function ApplicationQuestion({
    question,
    control,
    disabled,
}: {
    question: ApplicationQuestion
    control: Control<FieldValues>,
    disabled?: boolean,
}) {
    return (
        <FormField
            control={control}
            name={question.id ?? question.displayName}
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex text-md text-semibold">
                        {question.displayName}
                        {question.required && <Asterisk className="text-red-500 h-4"></Asterisk>}
                    </FormLabel>
                    {question.description && <FormDescription>{question.description}</FormDescription>}
                    <FormControl>
                        <QuestionContent
                            disabled={disabled}
                            question={question}
                            field={field}
                        ></QuestionContent>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

