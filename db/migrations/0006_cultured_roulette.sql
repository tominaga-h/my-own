-- task_links/task_notes は my-task-sync 側の taskNumber を参照するように
-- カラムを task_id → task_number にリネーム。Neon に tasks テーブルが
-- 残らないため FK は張れず、孤児行は my-task-sync→my-own の reconciliation
-- ジョブ (将来実装) で掃除する。既存データがある場合は taskNumber が
-- 旧 tasks.id と意味的に一致する保証がないので、必要に応じて事前 truncate 推奨。
ALTER TABLE "task_links" DROP CONSTRAINT "task_links_task_id_tasks_id_fk";--> statement-breakpoint
ALTER TABLE "task_notes" DROP CONSTRAINT "task_notes_task_id_tasks_id_fk";--> statement-breakpoint
ALTER TABLE "task_reminds" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tasks" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "task_reminds" CASCADE;--> statement-breakpoint
DROP TABLE "tasks" CASCADE;--> statement-breakpoint
ALTER TABLE "task_links" RENAME COLUMN "task_id" TO "task_number";--> statement-breakpoint
ALTER TABLE "task_notes" RENAME COLUMN "task_id" TO "task_number";--> statement-breakpoint
ALTER TABLE "task_links" DROP CONSTRAINT "task_links_pkey";--> statement-breakpoint
ALTER TABLE "task_links" ADD CONSTRAINT "task_links_pkey" PRIMARY KEY("task_number","link_id");--> statement-breakpoint
ALTER TABLE "task_notes" DROP CONSTRAINT "task_notes_pkey";--> statement-breakpoint
ALTER TABLE "task_notes" ADD CONSTRAINT "task_notes_pkey" PRIMARY KEY("task_number","note_id");--> statement-breakpoint
CREATE INDEX "task_links_task_number_idx" ON "task_links" USING btree ("task_number");--> statement-breakpoint
CREATE INDEX "task_notes_task_number_idx" ON "task_notes" USING btree ("task_number");
