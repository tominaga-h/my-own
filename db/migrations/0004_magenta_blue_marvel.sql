CREATE TABLE "task_reminds" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"remind_at" date NOT NULL
);
--> statement-breakpoint
ALTER TABLE "task_reminds" ADD CONSTRAINT "task_reminds_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_task_reminds_task_id" ON "task_reminds" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_task_reminds_remind_at" ON "task_reminds" USING btree ("remind_at");