CREATE TABLE "product_goal_proposals" (
	"product_id" uuid NOT NULL,
	"goal_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_goal_proposals_product_id_goal_id_pk" PRIMARY KEY("product_id","goal_id")
);
--> statement-breakpoint
ALTER TABLE "product_goal_proposals" ADD CONSTRAINT "product_goal_proposals_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_goal_proposals" ADD CONSTRAINT "product_goal_proposals_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_goal_proposals_product_id_idx" ON "product_goal_proposals" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_goal_proposals_goal_id_idx" ON "product_goal_proposals" USING btree ("goal_id");