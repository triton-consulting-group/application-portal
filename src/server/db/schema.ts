import { relations, sql } from "drizzle-orm";
import {
    index,
    int,
    mysqlTableCreator,
    primaryKey,
    text,
    timestamp,
    varchar,
    mysqlEnum,
    datetime,
    json,
    boolean
} from "drizzle-orm/mysql-core";
import { type AdapterAccount } from "next-auth/adapters";
import { FieldType, Role } from "./types";
import { db } from ".";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const mysqlTable = mysqlTableCreator((name) => `tcg-application-portal_${name}`);

export const users = mysqlTable("user", {
    id: varchar("id", { length: 255 }).notNull().primaryKey(),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }).notNull(),
    emailVerified: timestamp("emailVerified", {
        mode: "date",
        fsp: 3,
    }).default(sql`CURRENT_TIMESTAMP(3)`),
    image: varchar("image", { length: 255 }),
    role: mysqlEnum("role", [Role.APPLICANT, Role.ADMIN, Role.MEMBER]).default(Role.APPLICANT).notNull()
});

export const usersRelations = relations(users, ({ many }) => ({
    accounts: many(accounts),
    applications: many(applications)
}));

export const accounts = mysqlTable(
    "account",
    {
        userId: varchar("userId", { length: 255 }).notNull(),
        type: varchar("type", { length: 255 })
            .$type<AdapterAccount["type"]>()
            .notNull(),
        provider: varchar("provider", { length: 255 }).notNull(),
        providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: int("expires_at"),
        token_type: varchar("token_type", { length: 255 }),
        scope: varchar("scope", { length: 255 }),
        id_token: text("id_token"),
        session_state: varchar("session_state", { length: 255 }),
    },
    (account) => ({
        compoundKey: primaryKey(account.provider, account.providerAccountId),
        userIdIdx: index("userId_idx").on(account.userId),
    })
);

export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = mysqlTable(
    "session",
    {
        sessionToken: varchar("sessionToken", { length: 255 })
            .notNull()
            .primaryKey(),
        userId: varchar("userId", { length: 255 }).notNull(),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (session) => ({
        userIdIdx: index("userId_idx").on(session.userId),
    })
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = mysqlTable(
    "verificationToken",
    {
        identifier: varchar("identifier", { length: 255 }).notNull(),
        token: varchar("token", { length: 255 }).notNull(),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (vt) => ({
        compoundKey: primaryKey(vt.identifier, vt.token),
    })
);

export const recruitmentCycles = mysqlTable(
    "recruitmentCycle",
    {
        id: varchar("id", { length: 255 }).notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
        displayName: varchar("displayName", { length: 255 }).notNull(),
        startTime: datetime("startTime", { mode: "date" }).notNull(),
        endTime: datetime("endTime", { mode: "date" }).notNull(),
    }
);

export const recruitmentCyclesRelations = relations(recruitmentCycles, ({ many }) => ({
    applicationQuestions: many(applicationQuestions),
    applications: many(applications)
}));

export const applicationQuestions = mysqlTable(
    "applicationQuestion",
    {
        id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
        cycleId: varchar("cycleId", { length: 255 }).notNull(),
        displayName: varchar("displayName", { length: 255 }).notNull(),
        description: varchar("description", { length: 255 }).notNull(),
        type: mysqlEnum("type",
            [FieldType.STRING, FieldType.BOOLEAN, FieldType.CHECKBOX, FieldType.MULTIPLE_CHOICE, FieldType.DROPDOWN]
        )
            .notNull(),
        required: boolean("required").notNull(),
        order: int("order"),
        placeholder: varchar("placeholder", { length: 255 }),
        options: json("options").$type<string[]>(),
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

export const applicationResponses = mysqlTable(
    "applicationResponse",
    {
        id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
        questionId: varchar("questionId", { length: 255 }).notNull(),
        value: varchar("value", { length: 15000 }).notNull(),
    }
);

export const applicationResponsesRelations = relations(applicationResponses, ({ one }) => ({
    applicationQuestion: one(applicationQuestions, {
        fields: [applicationResponses.questionId],
        references: [applicationQuestions.id]
    }),
}));

export const applications = mysqlTable(
    "application",
    {
        id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
        userId: varchar("userId", { length: 255 }).notNull(),
        cycleId: varchar("cycleId", { length: 255 }).notNull(),
    }
);

export const applicationsRelations = relations(applications, ({ one }) => ({
    user: one(users, {
        fields: [applications.userId],
        references: [users.id]
    }),
    recruitmentCycle: one(recruitmentCycles, {
        fields: [applications.cycleId],
        references: [recruitmentCycles.id]
    })
}));

