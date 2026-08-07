CREATE TYPE "public"."bundle_status" AS ENUM('nacrt', 'na_cekanju', 'odobren', 'odbijen');--> statement-breakpoint
CREATE TABLE "bundle_items" (
	"bundle_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"kolicina" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "bundle_items_bundle_id_product_id_pk" PRIMARY KEY("bundle_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "bundles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"naziv" text NOT NULL,
	"opis" text,
	"slika_url" text,
	"cijena" integer NOT NULL,
	"status" "bundle_status" DEFAULT 'nacrt' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_bundle_id_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."bundles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundles" ADD CONSTRAINT "bundles_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bundle_items_bundle_id_idx" ON "bundle_items" USING btree ("bundle_id");--> statement-breakpoint
CREATE INDEX "bundle_items_product_id_idx" ON "bundle_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "bundles_brand_id_idx" ON "bundles" USING btree ("brand_id");