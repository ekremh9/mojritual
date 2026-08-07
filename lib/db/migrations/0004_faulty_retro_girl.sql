CREATE TYPE "public"."order_nacin_placanja" AS ENUM('pouzece');--> statement-breakpoint
CREATE TYPE "public"."order_shipment_status" AS ENUM('novo', 'potvrdjeno', 'poslano', 'isporuceno', 'otkazano', 'vraceno');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('na_cekanju', 'potvrdjeno', 'djelimicno_poslano', 'poslano', 'isporuceno', 'otkazano');--> statement-breakpoint
CREATE TYPE "public"."order_tip" AS ENUM('maloprodaja', 'veleprodaja');--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"naziv_snapshot" text NOT NULL,
	"cijena_snapshot" integer NOT NULL,
	"kolicina" integer NOT NULL,
	"provizija_posto_snapshot" numeric(5, 2) NOT NULL,
	"provizija_iznos" integer NOT NULL,
	"bundle_id" uuid
);
--> statement-breakpoint
CREATE TABLE "order_shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"iznos_stavki" integer NOT NULL,
	"cijena_dostave" integer NOT NULL,
	"besplatna_dostava" boolean DEFAULT false NOT NULL,
	"status" "order_shipment_status" DEFAULT 'novo' NOT NULL,
	"kurir" text,
	"broj_posiljke" text,
	"poslano_at" timestamp with time zone,
	"isporuceno_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"broj" text NOT NULL,
	"user_id" uuid,
	"business_account_id" uuid,
	"tip" "order_tip" NOT NULL,
	"kupac_ime" text NOT NULL,
	"kupac_email" text NOT NULL,
	"kupac_telefon" text NOT NULL,
	"adresa" text NOT NULL,
	"grad" text NOT NULL,
	"postanski_broj" text NOT NULL,
	"napomena" text,
	"iznos_stavki" integer NOT NULL,
	"iznos_dostave" integer NOT NULL,
	"ukupno" integer NOT NULL,
	"nacin_placanja" "order_nacin_placanja" DEFAULT 'pouzece' NOT NULL,
	"status" "order_status" DEFAULT 'na_cekanju' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_broj_unique" UNIQUE("broj")
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_shipment_id_order_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."order_shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_bundle_id_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."bundles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_shipments" ADD CONSTRAINT "order_shipments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_shipments" ADD CONSTRAINT "order_shipments_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_business_account_id_business_accounts_id_fk" FOREIGN KEY ("business_account_id") REFERENCES "public"."business_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_items_shipment_id_idx" ON "order_items" USING btree ("shipment_id");--> statement-breakpoint
CREATE INDEX "order_items_product_id_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "order_items_bundle_id_idx" ON "order_items" USING btree ("bundle_id");--> statement-breakpoint
CREATE INDEX "order_shipments_order_id_idx" ON "order_shipments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_shipments_brand_id_idx" ON "order_shipments" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_business_account_id_idx" ON "orders" USING btree ("business_account_id");--> statement-breakpoint
CREATE INDEX "orders_broj_idx" ON "orders" USING btree ("broj");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");