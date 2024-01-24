import { type ZodSchema, z } from "zod";
import { type ApplicationQuestion } from "~/app/types";
import { FieldType } from "~/server/db/types";
/**
 * Creates the appropriate Zod validator for an ApplicationQuestion
 *
 * @param question the question to create a validator for
 * @param server whether the validator is being used on the server
 * This changes the validation for file inputs because on the client, file inputs
 * should be File objects. However, on the server, File uploads are strings representing
 * the s3 key
 */
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

    if (!question.required) schema = schema.optional().or(z.string().max(0));

    return schema;
};

