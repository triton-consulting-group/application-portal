import { type Control, type ControllerRenderProps } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { FieldType } from "~/server/db/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Checkbox } from "./checkbox";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Asterisk } from "lucide-react";
import { ApplicationQuestion } from "~/app/types";

export function ApplicationQuestion({
    question,
    control
}: {
    question: ApplicationQuestion
    control: Control<any>
}) {
    function QuestionContent({ field }: { field: ControllerRenderProps<any, string> }) {
        if (question.type === FieldType.STRING) {
            if ((question.maxLength || 0) < 100) {
                return (
                    <Input placeholder={question.placeholder || ""} {...field} />
                );
            } else {
                return (
                    <Textarea
                        placeholder={question.placeholder || ""}
                        className="resize-none"
                        {...field}
                    />
                );
            }
        } else if (question.type === FieldType.DROPDOWN) {
            return (
                <Select>
                    <SelectTrigger>
                        <SelectValue placeholder={question.placeholder || ""}></SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {(question.options || []).map(o => (
                            <SelectItem value={o} key={o}>{o}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        } else if (question.type === FieldType.MULTIPLE_CHOICE) {
            return (
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
                    {(question.options || []).map(o => (
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
                    {(question.options || []).map(o => (
                        <FormItem key={o} className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                                <Checkbox
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
                <RadioGroup>
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
        }
    }

    return (
        <FormField
            control={control}
            name={question.id || question.displayName}
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="flex text-md text-semibold">
                        {question.displayName}
                        {question.required && <Asterisk className="text-red-500 h-4"></Asterisk>}
                    </FormLabel>
                    <FormControl>
                        <QuestionContent field={field}></QuestionContent>
                    </FormControl>
                    {question.description && <FormDescription>{question.description}</FormDescription>}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

