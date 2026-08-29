ALTER TABLE "events" ADD COLUMN "device_id" text;--> statement-breakpoint
CREATE INDEX "events_device_idx" ON "events" USING btree ("device_id");