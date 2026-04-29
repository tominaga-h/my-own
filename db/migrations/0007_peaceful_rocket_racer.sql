ALTER TABLE "links" ADD COLUMN "read_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "links_read_at_idx" ON "links" USING btree ("read_at");