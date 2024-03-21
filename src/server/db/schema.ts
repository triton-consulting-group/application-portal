import { relations, sql } from "drizzle-orm";
import { index, int, integer, primaryKey, sqliteTableCreator, text } from "drizzle-orm/sqlite-core";
import { type AdapterAccount } from "next-auth/adapters";
import { FieldType, Role } from "./types";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const sqliteTable = sqliteTableCreator((name) => `tcg-application-portal_${name}`);

// im 99% sure that length does not do anything in sqlite. however, 
// it is useful to keep in the code as a reminder of the general length
export const users = sqliteTable("user", {
    id: text("id", { length: 255 }).notNull().primaryKey(),
    name: text("name", { length: 255 }),
    email: text("email", { length: 255 }).notNull(),
    emailVerified: int("emailVerified", {
        mode: "timestamp",
    }).default(sql`CURRENT_TIMESTAMP`),
    image: text("image", { length: 255 }),
    role: text("role", { enum: [Role.APPLICANT, Role.ADMIN, Role.MEMBER] }).default(Role.APPLICANT).notNull()
});

export const usersRelations = relations(users, ({ many }) => ({
    accounts: many(accounts),
    applications: many(applications),
    notes: many(applicationNotes)
}));

export const accounts = sqliteTable(
    "account",
    {
        userId: text("userId", { length: 255 }).notNull(),
        type: text("type", { length: 255 })
            .$type<AdapterAccount["type"]>()
            .notNull(),
        provider: text("provider", { length: 255 }).notNull(),
        providerAccountId: text("providerAccountId", { length: 255 }).notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: int("expires_at"),
        token_type: text("token_type", { length: 255 }),
        scope: text("scope", { length: 255 }),
        id_token: text("id_token"),
        session_state: text("session_state", { length: 255 }),
    },
    (account) => ({
        compoundKey: primaryKey({
            columns: [account.provider, account.providerAccountId],
        }),
        userIdIdx: index("account_userId_idx").on(account.userId),
    })
);


export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = sqliteTable(
    "session",
    {
        sessionToken: text("sessionToken", { length: 255 })
            .notNull()
            .primaryKey(),
        userId: text("userId", { length: 255 }).notNull(),
        expires: int("expires", { mode: "timestamp" }).notNull(),
    },
    (session) => ({
        userIdIdx: index("userId_idx").on(session.userId),
    })
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = sqliteTable(
    "verificationToken",
    {
        identifier: text("identifier", { length: 255 }).notNull(),
        token: text("token", { length: 255 }).notNull(),
        expires: int("expires", { mode: "timestamp" }).notNull(),
    },
    (vt) => ({
        compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
    })
);

export const recruitmentCycles = sqliteTable(
    "recruitmentCycle",
    {
        id: text("id", { length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
        displayName: text("displayName", { length: 255 }).notNull(),
        startTime: int("startTime", { mode: "timestamp" }).notNull(),
        endTime: int("endTime", { mode: "timestamp" }).notNull(),
    }
);

export const recruitmentCyclesRelations = relations(recruitmentCycles, ({ many }) => ({
    applicationQuestions: many(applicationQuestions),
    applications: many(applications),
    recruitmentCyclePhases: many(recruitmentCyclePhases),
}));

export const recruitmentCyclePhases = sqliteTable(
    "recruitmentCyclePhase",
    {
        id: text("id", { length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
        displayName: text("displayName", { length: 255 }).notNull(),
        order: int("order"),
        cycleId: text("cycleId", { length: 255 }).notNull(),
    }
);

export const recruitmentCyclePhasesRelations = relations(recruitmentCyclePhases, ({ many, one }) => ({
    recruitmentCycle: one(recruitmentCycles, {
        fields: [recruitmentCyclePhases.cycleId],
        references: [recruitmentCycles.id]
    }),
    applications: many(applications),
}));

export const applicationQuestions = sqliteTable(
    "applicationQuestion",
    {
        id: text("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
        cycleId: text("cycleId", { length: 255 }).notNull(),
        displayName: text("displayName", { length: 255 }).notNull(),
        description: text("description", { length: 255 }),
        type: text("type",
            {
                enum: [
                    FieldType.STRING,
                    FieldType.BOOLEAN,
                    FieldType.CHECKBOX,
                    FieldType.MULTIPLE_CHOICE,
                    FieldType.DROPDOWN,
                    FieldType.FILE_UPLOAD
                ]
            }
        )
            .notNull(),
        required: integer("required", { mode: "boolean" }).notNull(),
        order: int("order"),
        placeholder: text("placeholder", { length: 255 }),
        // should be stored as json
        options: text("options").$type<string[]>(),
        maxLength: int("maxLength"),
        minLength: int("minLength"),
    }
);

export const applicationQuestionsRelations = relations(applicationQuestions, ({ one, many }) => ({
    recruitmentCycle: one(recruitmentCycles, {
        fields: [applicationQuestions.cycleId],
        references: [recruitmentCycles.id]
    }),
    applicationResponse: many(applicationResponses)
}));

export const applicationResponses = sqliteTable(
    "applicationResponse",
    {
        id: text("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
        questionId: text("questionId", { length: 255 }).notNull(),
        applicationId: text("applicationId", { length: 255 }).notNull(),
        value: text("value", { length: 15000 }).notNull(),
    }
);

export const applicationResponsesRelations = relations(applicationResponses, ({ one }) => ({
    applicationQuestion: one(applicationQuestions, {
        fields: [applicationResponses.questionId],
        references: [applicationQuestions.id]
    }),
    applications: one(applications, {
        fields: [applicationResponses.applicationId],
        references: [applications.id]
    })
}));

export const applications = sqliteTable(
    "application",
    {
        id: text("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
        userId: text("userId", { length: 255 }).notNull(),
        cycleId: text("cycleId", { length: 255 }).notNull(),
        submitted: integer("submitted", { mode: "boolean" }).notNull().default(false),
        phaseId: text("phase", { length: 255 }),
    }
);

export const applicationsRelations = relations(applications, ({ one, many }) => ({
    user: one(users, {
        fields: [applications.userId],
        references: [users.id]
    }),
    recruitmentCycle: one(recruitmentCycles, {
        fields: [applications.cycleId],
        references: [recruitmentCycles.id]
    }),
    recruitmentCyclePhase: one(recruitmentCyclePhases, {
        fields: [applications.phaseId],
        references: [recruitmentCyclePhases.id]
    }),
    applicationResponses: many(applicationResponses),
    notes: many(applicationNotes),
}));

export const applicationNotes = sqliteTable(
    "applicationNote",
    {
        id: text("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
        authorId: text("authorId", { length: 255 }).notNull(),
        applicationId: text("applicationId", { length: 255 }).notNull(),
        content: text("content", { length: 15000 }).notNull(),
        title: text("title", { length: 255 }).notNull()
    }
);

export const applicationNotesRelations = relations(applicationNotes, ({ one }) => ({
    author: one(users, {
        fields: [applicationNotes.authorId],
        references: [users.id]
    }),
    application: one(applications, {
        fields: [applicationNotes.applicationId],
        references: [applications.id]
    })
}));

