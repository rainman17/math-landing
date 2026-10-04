import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_applications_schedule" AS ENUM('weekday_afternoon', 'weekday_evening', 'weekend', 'flexible');
  CREATE TYPE "public"."enum_applications_status" AS ENUM('new', 'in_review', 'contacted', 'waitlist', 'enrolled', 'declined');
  CREATE TYPE "public"."enum_applications_stage" AS ENUM('step1', 'complete');
  CREATE TYPE "public"."enum_applications_contact_type" AS ENUM('phone', 'telegram');
  CREATE TYPE "public"."enum_applications_goal" AS ENUM('start', 'understand', 'olympiad', 'confidence', 'other');
  CREATE TYPE "public"."enum_applications_timezone" AS ENUM('Europe/Kaliningrad', 'Europe/Moscow', 'Europe/Samara', 'Asia/Yekaterinburg', 'Asia/Omsk', 'Asia/Novosibirsk', 'Asia/Irkutsk', 'Asia/Yakutsk', 'Asia/Vladivostok', 'Asia/Magadan', 'Asia/Kamchatka', 'other');
  CREATE TYPE "public"."enum_applications_personal_route" AS ENUM('yes', 'maybe', 'no');
  CREATE TYPE "public"."enum_applications_device" AS ENUM('mobile', 'tablet', 'desktop');
  CREATE TYPE "public"."enum_levels_enrollment_status" AS ENUM('open', 'few_left', 'waitlist', 'closed');
  CREATE TYPE "public"."enum_legal_pages_slug" AS ENUM('privacy', 'consent', 'offer');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'teacher', 'editor');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'notifyTeacher', 'deliverWebhook');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'notifyTeacher', 'deliverWebhook');
  CREATE TABLE "applications_schedule" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_applications_schedule",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "applications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_applications_status" DEFAULT 'new' NOT NULL,
  	"stage" "enum_applications_stage" DEFAULT 'step1' NOT NULL,
  	"waitlist" boolean DEFAULT false,
  	"admin_notes" varchar,
  	"parent_name" varchar NOT NULL,
  	"grade" numeric NOT NULL,
  	"contact" varchar NOT NULL,
  	"contact_type" "enum_applications_contact_type",
  	"email" varchar NOT NULL,
  	"level_hint" varchar,
  	"child_name" varchar,
  	"goal" "enum_applications_goal",
  	"goal_other" varchar,
  	"desired_result" varchar,
  	"difficulties" varchar,
  	"schedule_comment" varchar,
  	"timezone" "enum_applications_timezone",
  	"personal_route" "enum_applications_personal_route",
  	"consent_personal_data_accepted" boolean,
  	"consent_personal_data_version" varchar,
  	"consent_personal_data_accepted_at" timestamp(3) with time zone,
  	"consent_marketing_accepted" boolean,
  	"consent_marketing_version" varchar,
  	"consent_marketing_accepted_at" timestamp(3) with time zone,
  	"utm_source" varchar,
  	"utm_medium" varchar,
  	"utm_campaign" varchar,
  	"utm_term" varchar,
  	"utm_content" varchar,
  	"referrer" varchar,
  	"landing_page" varchar,
  	"device" "enum_applications_device",
  	"step1_at" timestamp(3) with time zone,
  	"completed_at" timestamp(3) with time zone,
  	"teacher_notified_at" timestamp(3) with time zone,
  	"webhook_delivered_at" timestamp(3) with time zone,
  	"last_delivery_error" varchar,
  	"resume_token_hash" varchar,
  	"idempotency_key" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "levels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"badge" varchar,
  	"grades" varchar NOT NULL,
  	"for_whom" varchar NOT NULL,
  	"what_happens" varchar NOT NULL,
  	"outcome" varchar NOT NULL,
  	"lessons_count" numeric NOT NULL,
  	"lesson_minutes" numeric DEFAULT 60 NOT NULL,
  	"duration_label" varchar NOT NULL,
  	"price" numeric NOT NULL,
  	"installment_note" varchar,
  	"personal_route_surcharge" varchar,
  	"enrollment_status" "enum_levels_enrollment_status" DEFAULT 'open' NOT NULL,
  	"next_start" varchar,
  	"cta_label" varchar DEFAULT 'Подобрать группу',
  	"highlighted" boolean,
  	"sort_order" numeric DEFAULT 10,
  	"published" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "faq" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL,
  	"sort_order" numeric DEFAULT 10,
  	"published" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "testimonials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"author" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"consent_confirmed" boolean,
  	"published" boolean DEFAULT false,
  	"sort_order" numeric DEFAULT 10,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "legal_pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" "enum_legal_pages_slug" NOT NULL,
  	"title" varchar NOT NULL,
  	"version" varchar NOT NULL,
  	"effective_date" timestamp(3) with time zone,
  	"content" jsonb NOT NULL,
  	"is_draft" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_large_url" varchar,
  	"sizes_large_width" numeric,
  	"sizes_large_height" numeric,
  	"sizes_large_mime_type" varchar,
  	"sizes_large_filesize" numeric,
  	"sizes_large_filename" varchar
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" "enum_users_role" DEFAULT 'teacher' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"applications_id" integer,
  	"levels_id" integer,
  	"faq_id" integer,
  	"testimonials_id" integer,
  	"legal_pages_id" integer,
  	"media_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "landing_hero_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "landing_problems_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "landing_method_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar,
  	"example" varchar
  );
  
  CREATE TABLE "landing_levels_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "landing_format_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "landing_format_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "landing_teacher_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "landing_personal_route_included" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "landing_personal_route_added" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "landing_community_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "landing_how_to_join_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "landing_trust_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "landing" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_eyebrow" varchar,
  	"hero_title" varchar NOT NULL,
  	"hero_subtitle" varchar NOT NULL,
  	"hero_primary_cta" varchar NOT NULL,
  	"hero_secondary_cta" varchar,
  	"hero_visual_eyebrow" varchar,
  	"hero_visual_title" varchar,
  	"hero_visual_text" varchar,
  	"problems_eyebrow" varchar,
  	"problems_title" varchar NOT NULL,
  	"problems_intro" varchar,
  	"method_eyebrow" varchar,
  	"method_title" varchar NOT NULL,
  	"method_intro" varchar,
  	"levels_eyebrow" varchar,
  	"levels_title" varchar NOT NULL,
  	"levels_intro" varchar,
  	"format_eyebrow" varchar,
  	"format_title" varchar NOT NULL,
  	"format_intro" varchar,
  	"teacher_eyebrow" varchar,
  	"teacher_name" varchar NOT NULL,
  	"teacher_role" varchar,
  	"teacher_photo_id" integer,
  	"teacher_bio" varchar,
  	"teacher_quote" varchar,
  	"personal_route_eyebrow" varchar,
  	"personal_route_title" varchar NOT NULL,
  	"personal_route_intro" varchar,
  	"personal_route_limit_note" varchar,
  	"community_eyebrow" varchar,
  	"community_title" varchar NOT NULL,
  	"community_intro" varchar,
  	"community_cta" varchar NOT NULL,
  	"how_to_join_eyebrow" varchar,
  	"how_to_join_title" varchar NOT NULL,
  	"how_to_join_intro" varchar,
  	"trust_eyebrow" varchar,
  	"trust_title" varchar NOT NULL,
  	"trust_intro" varchar,
  	"faq_eyebrow" varchar,
  	"faq_title" varchar NOT NULL,
  	"faq_intro" varchar,
  	"final_cta_title" varchar NOT NULL,
  	"final_cta_text" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "apply_form_next_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "apply_form" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"step1_heading" varchar NOT NULL,
  	"step1_lead" varchar,
  	"step1_promise" varchar,
  	"step1_submit_label" varchar NOT NULL,
  	"step2_heading" varchar NOT NULL,
  	"step2_lead" varchar,
  	"step2_submit_label" varchar NOT NULL,
  	"success_heading" varchar NOT NULL,
  	"success_subheading" varchar,
  	"success_next_text" varchar,
  	"success_waitlist_text" varchar,
  	"success_contact_prompt" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"brand_name" varchar DEFAULT 'Мысли как математик' NOT NULL,
  	"course_name" varchar DEFAULT 'Как рождается алгебра' NOT NULL,
  	"response_time" varchar NOT NULL,
  	"operator_details" varchar,
  	"telegram_url" varchar,
  	"telegram_label" varchar DEFAULT 'Написать в Telegram',
  	"email" varchar,
  	"phone" varchar,
  	"seo_title" varchar NOT NULL,
  	"seo_description" varchar NOT NULL,
  	"og_image_id" integer,
  	"yandex_metrika_id" varchar,
  	"require_cookie_consent" boolean DEFAULT true,
  	"show_test_cta" boolean DEFAULT false,
  	"show_teachers_block" boolean DEFAULT false,
  	"consent_version" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "applications_schedule" ADD CONSTRAINT "applications_schedule_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_applications_fk" FOREIGN KEY ("applications_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_levels_fk" FOREIGN KEY ("levels_id") REFERENCES "public"."levels"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faq_fk" FOREIGN KEY ("faq_id") REFERENCES "public"."faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_legal_pages_fk" FOREIGN KEY ("legal_pages_id") REFERENCES "public"."legal_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing_hero_facts" ADD CONSTRAINT "landing_hero_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing_problems_items" ADD CONSTRAINT "landing_problems_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing_method_steps" ADD CONSTRAINT "landing_method_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing_levels_notes" ADD CONSTRAINT "landing_levels_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing_format_facts" ADD CONSTRAINT "landing_format_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing_format_steps" ADD CONSTRAINT "landing_format_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing_teacher_facts" ADD CONSTRAINT "landing_teacher_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing_personal_route_included" ADD CONSTRAINT "landing_personal_route_included_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing_personal_route_added" ADD CONSTRAINT "landing_personal_route_added_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing_community_points" ADD CONSTRAINT "landing_community_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing_how_to_join_steps" ADD CONSTRAINT "landing_how_to_join_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing_trust_facts" ADD CONSTRAINT "landing_trust_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing" ADD CONSTRAINT "landing_teacher_photo_id_media_id_fk" FOREIGN KEY ("teacher_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "apply_form_next_steps" ADD CONSTRAINT "apply_form_next_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."apply_form"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_og_image_id_media_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "applications_schedule_order_idx" ON "applications_schedule" USING btree ("order");
  CREATE INDEX "applications_schedule_parent_idx" ON "applications_schedule" USING btree ("parent_id");
  CREATE INDEX "applications_resume_token_hash_idx" ON "applications" USING btree ("resume_token_hash");
  CREATE UNIQUE INDEX "applications_idempotency_key_idx" ON "applications" USING btree ("idempotency_key");
  CREATE INDEX "applications_updated_at_idx" ON "applications" USING btree ("updated_at");
  CREATE INDEX "applications_created_at_idx" ON "applications" USING btree ("created_at");
  CREATE UNIQUE INDEX "levels_slug_idx" ON "levels" USING btree ("slug");
  CREATE INDEX "levels_updated_at_idx" ON "levels" USING btree ("updated_at");
  CREATE INDEX "levels_created_at_idx" ON "levels" USING btree ("created_at");
  CREATE INDEX "faq_updated_at_idx" ON "faq" USING btree ("updated_at");
  CREATE INDEX "faq_created_at_idx" ON "faq" USING btree ("created_at");
  CREATE INDEX "testimonials_updated_at_idx" ON "testimonials" USING btree ("updated_at");
  CREATE INDEX "testimonials_created_at_idx" ON "testimonials" USING btree ("created_at");
  CREATE UNIQUE INDEX "legal_pages_slug_idx" ON "legal_pages" USING btree ("slug");
  CREATE INDEX "legal_pages_updated_at_idx" ON "legal_pages" USING btree ("updated_at");
  CREATE INDEX "legal_pages_created_at_idx" ON "legal_pages" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_large_sizes_large_filename_idx" ON "media" USING btree ("sizes_large_filename");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_applications_id_idx" ON "payload_locked_documents_rels" USING btree ("applications_id");
  CREATE INDEX "payload_locked_documents_rels_levels_id_idx" ON "payload_locked_documents_rels" USING btree ("levels_id");
  CREATE INDEX "payload_locked_documents_rels_faq_id_idx" ON "payload_locked_documents_rels" USING btree ("faq_id");
  CREATE INDEX "payload_locked_documents_rels_testimonials_id_idx" ON "payload_locked_documents_rels" USING btree ("testimonials_id");
  CREATE INDEX "payload_locked_documents_rels_legal_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("legal_pages_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "landing_hero_facts_order_idx" ON "landing_hero_facts" USING btree ("_order");
  CREATE INDEX "landing_hero_facts_parent_id_idx" ON "landing_hero_facts" USING btree ("_parent_id");
  CREATE INDEX "landing_problems_items_order_idx" ON "landing_problems_items" USING btree ("_order");
  CREATE INDEX "landing_problems_items_parent_id_idx" ON "landing_problems_items" USING btree ("_parent_id");
  CREATE INDEX "landing_method_steps_order_idx" ON "landing_method_steps" USING btree ("_order");
  CREATE INDEX "landing_method_steps_parent_id_idx" ON "landing_method_steps" USING btree ("_parent_id");
  CREATE INDEX "landing_levels_notes_order_idx" ON "landing_levels_notes" USING btree ("_order");
  CREATE INDEX "landing_levels_notes_parent_id_idx" ON "landing_levels_notes" USING btree ("_parent_id");
  CREATE INDEX "landing_format_facts_order_idx" ON "landing_format_facts" USING btree ("_order");
  CREATE INDEX "landing_format_facts_parent_id_idx" ON "landing_format_facts" USING btree ("_parent_id");
  CREATE INDEX "landing_format_steps_order_idx" ON "landing_format_steps" USING btree ("_order");
  CREATE INDEX "landing_format_steps_parent_id_idx" ON "landing_format_steps" USING btree ("_parent_id");
  CREATE INDEX "landing_teacher_facts_order_idx" ON "landing_teacher_facts" USING btree ("_order");
  CREATE INDEX "landing_teacher_facts_parent_id_idx" ON "landing_teacher_facts" USING btree ("_parent_id");
  CREATE INDEX "landing_personal_route_included_order_idx" ON "landing_personal_route_included" USING btree ("_order");
  CREATE INDEX "landing_personal_route_included_parent_id_idx" ON "landing_personal_route_included" USING btree ("_parent_id");
  CREATE INDEX "landing_personal_route_added_order_idx" ON "landing_personal_route_added" USING btree ("_order");
  CREATE INDEX "landing_personal_route_added_parent_id_idx" ON "landing_personal_route_added" USING btree ("_parent_id");
  CREATE INDEX "landing_community_points_order_idx" ON "landing_community_points" USING btree ("_order");
  CREATE INDEX "landing_community_points_parent_id_idx" ON "landing_community_points" USING btree ("_parent_id");
  CREATE INDEX "landing_how_to_join_steps_order_idx" ON "landing_how_to_join_steps" USING btree ("_order");
  CREATE INDEX "landing_how_to_join_steps_parent_id_idx" ON "landing_how_to_join_steps" USING btree ("_parent_id");
  CREATE INDEX "landing_trust_facts_order_idx" ON "landing_trust_facts" USING btree ("_order");
  CREATE INDEX "landing_trust_facts_parent_id_idx" ON "landing_trust_facts" USING btree ("_parent_id");
  CREATE INDEX "landing_teacher_teacher_photo_idx" ON "landing" USING btree ("teacher_photo_id");
  CREATE INDEX "apply_form_next_steps_order_idx" ON "apply_form_next_steps" USING btree ("_order");
  CREATE INDEX "apply_form_next_steps_parent_id_idx" ON "apply_form_next_steps" USING btree ("_parent_id");
  CREATE INDEX "site_settings_og_image_idx" ON "site_settings" USING btree ("og_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "applications_schedule" CASCADE;
  DROP TABLE "applications" CASCADE;
  DROP TABLE "levels" CASCADE;
  DROP TABLE "faq" CASCADE;
  DROP TABLE "testimonials" CASCADE;
  DROP TABLE "legal_pages" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "landing_hero_facts" CASCADE;
  DROP TABLE "landing_problems_items" CASCADE;
  DROP TABLE "landing_method_steps" CASCADE;
  DROP TABLE "landing_levels_notes" CASCADE;
  DROP TABLE "landing_format_facts" CASCADE;
  DROP TABLE "landing_format_steps" CASCADE;
  DROP TABLE "landing_teacher_facts" CASCADE;
  DROP TABLE "landing_personal_route_included" CASCADE;
  DROP TABLE "landing_personal_route_added" CASCADE;
  DROP TABLE "landing_community_points" CASCADE;
  DROP TABLE "landing_how_to_join_steps" CASCADE;
  DROP TABLE "landing_trust_facts" CASCADE;
  DROP TABLE "landing" CASCADE;
  DROP TABLE "apply_form_next_steps" CASCADE;
  DROP TABLE "apply_form" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TYPE "public"."enum_applications_schedule";
  DROP TYPE "public"."enum_applications_status";
  DROP TYPE "public"."enum_applications_stage";
  DROP TYPE "public"."enum_applications_contact_type";
  DROP TYPE "public"."enum_applications_goal";
  DROP TYPE "public"."enum_applications_timezone";
  DROP TYPE "public"."enum_applications_personal_route";
  DROP TYPE "public"."enum_applications_device";
  DROP TYPE "public"."enum_levels_enrollment_status";
  DROP TYPE "public"."enum_legal_pages_slug";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";`)
}
