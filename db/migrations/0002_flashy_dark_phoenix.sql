ALTER TABLE "links" ADD COLUMN "posted_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "posted_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
UPDATE "notes" SET "posted_at" = to_timestamp(slack_ts::double precision) WHERE slack_ts IS NOT NULL;--> statement-breakpoint
UPDATE "links" SET "posted_at" = to_timestamp(slack_ts::double precision) WHERE slack_ts IS NOT NULL;