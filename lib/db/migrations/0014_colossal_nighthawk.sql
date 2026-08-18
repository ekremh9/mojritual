CREATE TYPE "public"."notification_tip" AS ENUM('narudzba_status', 'proizvod_odobren', 'proizvod_odbijen', 'brend_odobren');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tip" "notification_tip" NOT NULL,
	"naslov" text NOT NULL,
	"sadrzaj" text NOT NULL,
	"link" text,
	"procitano" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_procitano_idx" ON "notifications" USING btree ("user_id","procitano");