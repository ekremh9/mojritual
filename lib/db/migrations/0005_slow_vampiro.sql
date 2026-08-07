CREATE TYPE "public"."commission_period_status" AS ENUM('nacrt', 'poslano', 'placeno', 'sporno');--> statement-breakpoint
CREATE TABLE "commission_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"period_od" date NOT NULL,
	"period_do" date NOT NULL,
	"iznos_prometa" integer NOT NULL,
	"iznos_provizije" integer NOT NULL,
	"iznos_naknade" integer NOT NULL,
	"ukupno_za_naplatu" integer NOT NULL,
	"status" "commission_period_status" DEFAULT 'nacrt' NOT NULL,
	"faktura_broj" text,
	"placeno_at" timestamp with time zone,
	CONSTRAINT "commission_periods_brand_period_unique" UNIQUE("brand_id","period_od","period_do")
);
--> statement-breakpoint
ALTER TABLE "commission_periods" ADD CONSTRAINT "commission_periods_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "commission_periods_brand_id_idx" ON "commission_periods" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "commission_periods_status_idx" ON "commission_periods" USING btree ("status");