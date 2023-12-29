import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import {
    createTRPCRouter,
    memberProcedure,
} from "~/server/api/trpc";
import { applicationNotes, applications, users } from "~/server/db/schema";

export const applicationNoteRouter = createTRPCRouter({
    getByApplicationId: memberProcedure
        .input(z.string())
        .query(async ({ ctx, input }) => {
            const results = await ctx.db
                .select()
                .from(applicationNotes)
                .innerJoin(users, eq(users.id, applicationNotes.authorId))
                .where(eq(applicationNotes.applicationId, input))
            
            return results.map(r => ({
                ...r.applicationNote,
                authorName: r.user.name
            }))
        }),
    create: memberProcedure
        .input(createInsertSchema(applicationNotes, { authorId: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
            const [application] = await ctx.db
                .select()
                .from(applications)
                .where(eq(applications.id, input.applicationId));

            if (!application) {
                throw new TRPCError({
                    message: "Invalid applicationId",
                    code: "BAD_REQUEST"
                });
            }

            input.authorId = ctx.session.user.id;

            return ctx.db.insert(applicationNotes).values(input as (typeof input & { authorId: string }));
        }),
    update: memberProcedure
        .input(z.object({ noteId: z.string(), title: z.string().max(255), content: z.string().max(15000) }))
        .mutation(async ({ ctx, input }) => {
            const result = await ctx.db
                .update(applicationNotes)
                .set({ content: input.content, title: input.title })
                .where(and(
                    eq(applicationNotes.authorId, ctx.session.user.id),
                    eq(applicationNotes.id, input.noteId)
                ));

            if (result.rowsAffected === 0) {
                throw new TRPCError({
                    message: `Note with id ${input.noteId} owned by user ${ctx.session.user.id} not found`,
                    code: "NOT_FOUND"
                });
            };

            return result;
        }),
    delete: memberProcedure
        .input(z.string())
        .mutation(async ({ ctx, input }) => {
            const result = await ctx.db
                .delete(applicationNotes)
                .where(and(
                    eq(applicationNotes.authorId, ctx.session.user.id),
                    eq(applicationNotes.id, input)
                ))

            if (result.rowsAffected === 0) {
                throw new TRPCError({
                    message: `Note with id ${input} owned by user ${ctx.session.user.id} not found`,
                    code: "NOT_FOUND"
                });
            };

            return result;
        })
});

