ALTER TABLE "tasks" ADD COLUMN "source" text DEFAULT 'cli' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "important" boolean DEFAULT false NOT NULL;