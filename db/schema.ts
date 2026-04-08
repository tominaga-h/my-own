import {
  check,
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
