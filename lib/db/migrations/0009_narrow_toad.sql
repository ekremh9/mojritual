CREATE TYPE "public"."product_goal_oznaka" AS ENUM('primarni', 'sekundarni');--> statement-breakpoint
CREATE TABLE "guide_explanation_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" uuid NOT NULL,
	"tekst" text NOT NULL,
	"aktivan" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_goals" ADD COLUMN "oznaka" "product_goal_oznaka" DEFAULT 'sekundarni' NOT NULL;--> statement-breakpoint
ALTER TABLE "guide_explanation_templates" ADD CONSTRAINT "guide_explanation_templates_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "guide_explanation_templates_goal_id_idx" ON "guide_explanation_templates" USING btree ("goal_id");