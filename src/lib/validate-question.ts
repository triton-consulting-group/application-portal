import { ZodSchema, z } from "zod";
import { ApplicationQuestion } from "~/app/types";
import { FieldType } from "~/server/db/types";

export const getValidator = (question: ApplicationQuestion): ZodSchema => {
    let schema: ZodSchema;
    switch (question.type) {
        case FieldType.STRING:
            schema = z.string()
                .min(question.minLength as number)
                .max(question.maxLength as number)
        case FieldType.BOOLEAN:
            schema = z.string()
                .refine(
                    val => val !== "true" && val !== "false", 
                    { message: "Invalid value for boolean field" }
                )
        case FieldType.CHECKBOX:
            schema = z.string()
                .refine(
                    val => val.split(",,,").every(v => (question.options as string[]).includes(v)),
                    { message: "Invalid value for checkbox field" }
                )
        case FieldType.MULTIPLE_CHOICE:
        case FieldType.DROPDOWN:
            schema = z.string()
                .refine(
                    val => !(question.options as string[]).includes(val),
                    { message: `Invalid value for ${question.type} field` }
                )
    }
    
    if (!question.required) schema.optional();

    return schema;
}

