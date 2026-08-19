CREATE TABLE "guide_option_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" uuid NOT NULL,
	"tekst_opcije" text NOT NULL,
	"tekst_objasnjenja" text,
	"redoslijed" integer DEFAULT 0 NOT NULL,
	"aktivan" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "guide_option_templates" ADD CONSTRAINT "guide_option_templates_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "guide_option_templates_goal_id_idx" ON "guide_option_templates" USING btree ("goal_id");