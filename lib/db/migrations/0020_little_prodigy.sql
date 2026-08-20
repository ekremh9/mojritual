CREATE TYPE "public"."featuring_tip" AS ENUM('proizvod', 'brend');--> statement-breakpoint
CREATE TABLE "featuring_price_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tip" "featuring_tip" NOT NULL,
	"naziv" text NOT NULL,
	"trajanje_dana" integer NOT NULL,
	"cijena" integer NOT NULL,
	"ponavljajuce" boolean DEFAULT false NOT NULL,
	"aktivan" boolean DEFAULT true NOT NULL,
	"redoslijed" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "featuring_price_plans_tip_idx" ON "featuring_price_plans" USING btree ("tip");--> statement-breakpoint
CREATE INDEX "featuring_price_plans_tip_redoslijed_idx" ON "featuring_price_plans" USING btree ("tip","redoslijed");