CREATE TABLE "brand_wholesale_defaults" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"min_kolicina" integer NOT NULL,
	"popust_posto" numeric(5, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brand_wholesale_defaults_brand_id_min_kolicina_unique" UNIQUE("brand_id","min_kolicina")
);
--> statement-breakpoint
ALTER TABLE "brand_wholesale_defaults" ADD CONSTRAINT "brand_wholesale_defaults_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brand_wholesale_defaults_brand_id_idx" ON "brand_wholesale_defaults" USING btree ("brand_id");