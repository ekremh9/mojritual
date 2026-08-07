CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"naziv" text NOT NULL,
	"opis" text,
	CONSTRAINT "goals_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "guide_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"anon_id" text,
	"user_id" uuid,
	"odgovori" jsonb NOT NULL,
	"rezultat" jsonb,
	"sacuvano" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_goals" (
	"product_id" uuid NOT NULL,
	"goal_id" uuid NOT NULL,
	"relevantnost" integer NOT NULL,
	CONSTRAINT "product_goals_product_id_goal_id_pk" PRIMARY KEY("product_id","goal_id")
);
--> statement-breakpoint
ALTER TABLE "guide_sessions" ADD CONSTRAINT "guide_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_goals" ADD CONSTRAINT "product_goals_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_goals" ADD CONSTRAINT "product_goals_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "guide_sessions_user_id_idx" ON "guide_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "guide_sessions_anon_id_idx" ON "guide_sessions" USING btree ("anon_id");--> statement-breakpoint
CREATE INDEX "product_goals_product_id_idx" ON "product_goals" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_goals_goal_id_idx" ON "product_goals" USING btree ("goal_id");