import { type ZodSchema, z } from "zod";
import { type ApplicationQuestion } from "~/app/types";
import { FieldType } from "~/server/db/types";

export const getValidator = (question: ApplicationQuestion, server?: boolean): ZodSchema => {
    let schema: ZodSchema;
    switch (question.type) {
        case FieldType.STRING:
            schema = z.string()
                .min(question.minLength!)
                .max(question.maxLength!);
            break;
        case FieldType.FILE_UPLOAD:
            schema = server ? z.string().min(5) : z.string().or(z.instanceof(File));
            break;
        case FieldType.BOOLEAN:
            schema = z.string()
                .refine(
                    val => val === "true" || val === "false",
                    { message: "Invalid value for boolean field" }
                );
            break;
        case FieldType.CHECKBOX:
            schema = z.string()
                .refine(
                    val => (!question.required || val.trim().length > 0),
                    { message: "Question is required" }
                )
                .refine(
                    val => val.split(",,,").every(v => (question.options!).includes(v)),
                    { message: "Invalid value for checkbox field" }
                );
            break;
        case FieldType.MULTIPLE_CHOICE:
        case FieldType.DROPDOWN:
            schema = z.string()
                .refine(
                    val => (!question.required || val.trim().length > 0),
                    { message: "Question is required" }
                )
                .refine(
                    val =>
                        (question.options!).includes(val),
                    { message: `Invalid value for ${question.type} field` }
                );
            break;
    }

    if (!question.required) schema = schema.optional();

    return schema;
};

