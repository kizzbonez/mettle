CREATE TYPE "public"."attempt_status" AS ENUM('in_progress', 'submitted', 'expired');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('basic', 'medium', 'advanced', 'professional');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."exam_mode" AS ENUM('fixed', 'dynamic');--> statement-breakpoint
CREATE TYPE "public"."lab_language" AS ENUM('rust', 'python', 'bash');--> statement-breakpoint
CREATE TYPE "public"."publish_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('single', 'multiple', 'true_false');--> statement-breakpoint
CREATE TYPE "public"."submission_kind" AS ENUM('run', 'submit');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('queued', 'running', 'passed', 'failed', 'compile_error', 'timeout', 'error');--> statement-breakpoint
CREATE TYPE "public"."token_purpose" AS ENUM('password_reset');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('learner', 'instructor', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'banned');--> statement-breakpoint
CREATE TABLE "attempt_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"sort_order" integer NOT NULL,
	"option_order" jsonb NOT NULL,
	"selected_option_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"flagged" boolean DEFAULT false NOT NULL,
	"is_correct" boolean,
	"answered_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "attempt_status" DEFAULT 'in_progress' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"submitted_at" timestamp with time zone,
	"correct_count" integer,
	"total_count" integer NOT NULL,
	"score_percent" numeric(5, 2),
	"passed" boolean
);
--> statement-breakpoint
CREATE TABLE "exam_questions" (
	"exam_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "exam_questions_exam_id_question_id_pk" PRIMARY KEY("exam_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "exam_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"track_id" uuid,
	"category_id" uuid,
	"difficulty" "difficulty",
	"tag" text,
	"count" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"track_id" uuid NOT NULL,
	"course_id" uuid,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"mode" "exam_mode" DEFAULT 'dynamic' NOT NULL,
	"time_limit_minutes" integer DEFAULT 15 NOT NULL,
	"pass_percent" integer DEFAULT 70 NOT NULL,
	"shuffle_options" boolean DEFAULT true NOT NULL,
	"max_attempts" integer,
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"body_md" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text,
	"track_id" uuid,
	"category_id" uuid,
	"difficulty" "difficulty" NOT NULL,
	"type" "question_type" DEFAULT 'single' NOT NULL,
	"prompt_md" text NOT NULL,
	"explanation_md" text DEFAULT '' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"track_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"level" "difficulty" NOT NULL,
	"title" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"outcomes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"objectives" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"body_md" text DEFAULT '' NOT NULL,
	"est_minutes" integer DEFAULT 15 NOT NULL,
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"tagline" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"icon" text DEFAULT 'Boxes' NOT NULL,
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"purpose" "token_purpose" NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code_hash" text NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"user_agent" text,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'learner' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"ban_reason" text,
	"totp_secret" text,
	"totp_enabled_at" timestamp with time zone,
	"failed_logins" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lab_drafts" (
	"user_id" uuid NOT NULL,
	"lab_id" uuid NOT NULL,
	"code" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lab_drafts_user_id_lab_id_pk" PRIMARY KEY("user_id","lab_id")
);
--> statement-breakpoint
CREATE TABLE "lab_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lab_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "submission_kind" NOT NULL,
	"code" text NOT NULL,
	"status" "submission_status" DEFAULT 'queued' NOT NULL,
	"passed_count" integer DEFAULT 0 NOT NULL,
	"total_count" integer DEFAULT 0 NOT NULL,
	"duration_ms" integer,
	"compile_output" text DEFAULT '' NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "lab_test_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lab_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"hidden" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "labs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"scenario_md" text DEFAULT '' NOT NULL,
	"instructions_md" text DEFAULT '' NOT NULL,
	"language" "lab_language" NOT NULL,
	"starter_code" text DEFAULT '' NOT NULL,
	"solution_code" text DEFAULT '' NOT NULL,
	"fixtures" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"time_limit_ms" integer DEFAULT 5000 NOT NULL,
	"memory_mb" integer DEFAULT 256 NOT NULL,
	"est_minutes" integer DEFAULT 30 NOT NULL,
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"test_case_id" uuid,
	"name" text NOT NULL,
	"hidden" boolean NOT NULL,
	"passed" boolean NOT NULL,
	"timed_out" boolean DEFAULT false NOT NULL,
	"exit_code" integer,
	"duration_ms" integer DEFAULT 0 NOT NULL,
	"stdout" text DEFAULT '' NOT NULL,
	"stderr" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"href" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "enrollments_user_id_course_id_pk" PRIMARY KEY("user_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"user_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_progress_user_id_lesson_id_pk" PRIMARY KEY("user_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"to_email" text NOT NULL,
	"template" text NOT NULL,
	"subject" text NOT NULL,
	"status" "email_status" NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attempt_questions" ADD CONSTRAINT "attempt_questions_attempt_id_exam_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."exam_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_questions" ADD CONSTRAINT "attempt_questions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_rules" ADD CONSTRAINT "exam_rules_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_rules" ADD CONSTRAINT "exam_rules_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_rules" ADD CONSTRAINT "exam_rules_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_codes" ADD CONSTRAINT "recovery_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_drafts" ADD CONSTRAINT "lab_drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_drafts" ADD CONSTRAINT "lab_drafts_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_submissions" ADD CONSTRAINT "lab_submissions_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_submissions" ADD CONSTRAINT "lab_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_test_cases" ADD CONSTRAINT "lab_test_cases_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labs" ADD CONSTRAINT "labs_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_results" ADD CONSTRAINT "submission_results_submission_id_lab_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."lab_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_results" ADD CONSTRAINT "submission_results_test_case_id_lab_test_cases_id_fk" FOREIGN KEY ("test_case_id") REFERENCES "public"."lab_test_cases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attempt_questions_key" ON "attempt_questions" USING btree ("attempt_id","question_id");--> statement-breakpoint
CREATE INDEX "attempt_questions_question_idx" ON "attempt_questions" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_key" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "exam_attempts_user_idx" ON "exam_attempts" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE INDEX "exam_attempts_exam_idx" ON "exam_attempts" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "exam_attempts_submitted_idx" ON "exam_attempts" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "exam_rules_exam_idx" ON "exam_rules" USING btree ("exam_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exams_track_slug_key" ON "exams" USING btree ("track_id","slug");--> statement-breakpoint
CREATE INDEX "exams_course_idx" ON "exams" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "question_options_question_idx" ON "question_options" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "questions_key_key" ON "questions" USING btree ("key");--> statement-breakpoint
CREATE INDEX "questions_pool_idx" ON "questions" USING btree ("status","track_id","difficulty");--> statement-breakpoint
CREATE INDEX "questions_category_idx" ON "questions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "questions_tags_idx" ON "questions" USING gin ("tags");--> statement-breakpoint
CREATE UNIQUE INDEX "courses_track_slug_key" ON "courses" USING btree ("track_id","slug");--> statement-breakpoint
CREATE INDEX "courses_track_idx" ON "courses" USING btree ("track_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lessons_course_slug_key" ON "lessons" USING btree ("course_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "tracks_slug_key" ON "tracks" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_tokens_hash_key" ON "auth_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "auth_tokens_user_idx" ON "auth_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recovery_codes_user_idx" ON "recovery_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_status_idx" ON "users" USING btree ("role","status");--> statement-breakpoint
CREATE INDEX "users_created_idx" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "users_last_seen_idx" ON "users" USING btree ("last_seen_at");--> statement-breakpoint
CREATE INDEX "lab_submissions_user_lab_idx" ON "lab_submissions" USING btree ("user_id","lab_id","created_at");--> statement-breakpoint
CREATE INDEX "lab_submissions_created_idx" ON "lab_submissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "lab_submissions_status_idx" ON "lab_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lab_test_cases_lab_idx" ON "lab_test_cases" USING btree ("lab_id");--> statement-breakpoint
CREATE UNIQUE INDEX "labs_course_slug_key" ON "labs" USING btree ("course_id","slug");--> statement-breakpoint
CREATE INDEX "submission_results_submission_idx" ON "submission_results" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "activity_events_user_idx" ON "activity_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "enrollments_course_idx" ON "enrollments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_log_actor_idx" ON "audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "email_log_created_idx" ON "email_log" USING btree ("created_at");