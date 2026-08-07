CREATE TABLE "wholesale_price_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"min_kolicina" integer NOT NULL,
	"cijena" integer NOT NULL,
	CONSTRAINT "wholesale_price_tiers_product_id_min_kolicina_unique" UNIQUE("product_id","min_kolicina")
);
--> statement-breakpoint
ALTER TABLE "wholesale_price_tiers" ADD CONSTRAINT "wholesale_price_tiers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wholesale_price_tiers_product_id_idx" ON "wholesale_price_tiers" USING btree ("product_id");