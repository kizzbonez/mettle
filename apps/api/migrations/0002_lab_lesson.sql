ALTER TABLE "labs" ADD COLUMN "lesson_id" uuid;--> statement-breakpoint
ALTER TABLE "labs" ADD CONSTRAINT "labs_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "labs_lesson_idx" ON "labs" USING btree ("lesson_id");