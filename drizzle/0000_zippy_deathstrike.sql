CREATE TYPE "public"."reservation_status" AS ENUM('pending', 'confirmed', 'seated', 'no_show', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."staff_role" AS ENUM('owner', 'waiter');--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservation_id" uuid NOT NULL,
	"code" varchar(6) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"table_id" uuid,
	"guest_name" varchar(255) NOT NULL,
	"guest_email" varchar(255) NOT NULL,
	"guest_phone" varchar(63),
	"party_size" integer NOT NULL,
	"reservation_date" date NOT NULL,
	"reservation_time" time NOT NULL,
	"duration_minutes" integer DEFAULT 90 NOT NULL,
	"status" "reservation_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"seated_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(63) NOT NULL,
	"name" varchar(255) NOT NULL,
	"owner_email" varchar(255) NOT NULL,
	"timezone" varchar(63) DEFAULT 'Europe/Berlin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"google_user_id" varchar(255),
	"role" "staff_role" NOT NULL,
	"name" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"number" varchar(10) NOT NULL,
	"capacity" integer NOT NULL,
	"zone" varchar(63),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_tenant_id_restaurants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_users" ADD CONSTRAINT "staff_users_tenant_id_restaurants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tables" ADD CONSTRAINT "tables_tenant_id_restaurants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "otp_codes_reservation_idx" ON "otp_codes" USING btree ("reservation_id");--> statement-breakpoint
CREATE INDEX "otp_codes_code_expires_idx" ON "otp_codes" USING btree ("code","expires_at");--> statement-breakpoint
CREATE INDEX "reservations_tenant_date_idx" ON "reservations" USING btree ("tenant_id","reservation_date");--> statement-breakpoint
CREATE INDEX "reservations_tenant_status_idx" ON "reservations" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "reservations_tenant_email_idx" ON "reservations" USING btree ("tenant_id","guest_email");--> statement-breakpoint
CREATE UNIQUE INDEX "restaurants_slug_unique" ON "restaurants" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_users_tenant_email_unique" ON "staff_users" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_users_google_user_id_unique" ON "staff_users" USING btree ("google_user_id") WHERE "staff_users"."google_user_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "tables_tenant_number_unique" ON "tables" USING btree ("tenant_id","number");--> statement-breakpoint
CREATE INDEX "tables_tenant_idx" ON "tables" USING btree ("tenant_id");