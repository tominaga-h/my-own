import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userNameUnique: unique("projects_user_name_unique").on(table.userId, table.name),
  }),
);

export const notes = pgTable(
  "notes",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").notNull(),
    body: text("body").notNull(),
    source: text("source").notNull().default("manual"),
    slackTs: text("slack_ts"),
    projectId: integer("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    postedAt: timestamp("posted_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("notes_user_id_idx").on(table.userId),
    projectIdIdx: index("notes_project_id_idx").on(table.projectId),
    slackTsIdx: index("notes_slack_ts_idx").on(table.slackTs),
    userSlackTsUnique: unique("notes_user_slack_ts_unique").on(table.userId, table.slackTs),
    sourceCheck: check("notes_source_check", sql`${table.source} in ('slack', 'manual')`),
  }),
);

export const links = pgTable(
  "links",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").notNull(),
    url: text("url").notNull(),
    title: text("title"),
    description: text("description"),
    slackAttachments: jsonb("slack_attachments").$type<unknown[] | null>(),
    source: text("source").notNull().default("manual"),
    slackTs: text("slack_ts"),
    projectId: integer("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    postedAt: timestamp("posted_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("links_user_id_idx").on(table.userId),
    projectIdIdx: index("links_project_id_idx").on(table.projectId),
    slackTsIdx: index("links_slack_ts_idx").on(table.slackTs),
    userSlackTsUnique: unique("links_user_slack_ts_unique").on(table.userId, table.slackTs),
    sourceCheck: check("links_source_check", sql`${table.source} in ('slack', 'manual')`),
  }),
);

export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").notNull(),
    title: text("title").notNull(),
    status: text("status").notNull().default("open"),
    projectId: integer("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    source: text("source").notNull().default("cli"),
    important: boolean("important").notNull().default(false),
    due: date("due"),
    doneAt: date("done_at"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("tasks_user_id_idx").on(table.userId),
    projectIdIdx: index("tasks_project_id_idx").on(table.projectId),
    statusCheck: check("tasks_status_check", sql`${table.status} in ('open', 'done', 'closed')`),
  }),
);

export const taskReminds = pgTable(
  "task_reminds",
  {
    id: serial("id").primaryKey(),
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    remindAt: date("remind_at").notNull(),
  },
  (table) => ({
    taskIdIdx: index("idx_task_reminds_task_id").on(table.taskId),
    remindAtIdx: index("idx_task_reminds_remind_at").on(table.remindAt),
  }),
);

export const syncStates = pgTable(
  "sync_states",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").notNull(),
    key: text("key").notNull(),
    value: text("value").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userKeyUnique: unique("sync_states_user_key_unique").on(table.userId, table.key),
    userIdIdx: index("sync_states_user_id_idx").on(table.userId),
  }),
);

export const noteLinks = pgTable(
  "note_links",
  {
    noteId: integer("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    linkId: integer("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.noteId, table.linkId], name: "note_links_pkey" }),
  }),
);

export const taskNotes = pgTable(
  "task_notes",
  {
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    noteId: integer("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.taskId, table.noteId], name: "task_notes_pkey" }),
  }),
);

export const taskLinks = pgTable(
  "task_links",
  {
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    linkId: integer("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.taskId, table.linkId], name: "task_links_pkey" }),
  }),
);
