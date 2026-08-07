CREATE TYPE "public"."post_status" AS ENUM('nacrt', 'objavljeno');--> statement-breakpoint
CREATE TYPE "public"."vendor_lead_status" AS ENUM('novo', 'kontaktirano', 'u_pregovorima', 'zatvoreno');--> statement-breakpoint
CREATE TYPE "public"."product_review_status" AS ENUM('na_cekanju', 'objavljeno', 'odbijeno');--> statement-breakpoint
CREATE TYPE "public"."support_ticket_rjesenje" AS ENUM('zamjena', 'povrat_novca', 'popust', 'odbijeno');--> statement-breakpoint
CREATE TYPE "public"."support_ticket_status" AS ENUM('novo', 'kod_brenda', 'u_obradi', 'rijeseno', 'odbijeno', 'eskalirano');--> statement-breakpoint
CREATE TYPE "public"."support_ticket_tip" AS ENUM('reklamacija', 'povrat', 'ostecena_posiljka', 'upit');--> statement-breakpoint
CREATE TYPE "public"."ticket_message_autor_tip" AS ENUM('kupac', 'brend', 'admin');--> statement-breakpoint
CREATE TABLE "medical_reviewers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ime" text NOT NULL,
	"titula" text,
	"specijalnost" text,
	"biografija" text,
	"foto_url" text,
	"aktivan" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"naslov" text NOT NULL,
	"sazetak" text,
	"sadrzaj" text NOT NULL,
	"cover_url" text,
	"autor" text,
	"recenzent_id" uuid,
	"status" "post_status" DEFAULT 'nacrt' NOT NULL,
	"objavljeno_at" timestamp with time zone,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "vendor_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"naziv_firme" text NOT NULL,
	"kontakt_osoba" text NOT NULL,
	"email" text NOT NULL,
	"telefon" text,
	"kategorija" text,
	"poruka" text,
	"status" "vendor_lead_status" DEFAULT 'novo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"ocjena" integer NOT NULL,
	"komentar" text,
	"status" "product_review_status" DEFAULT 'na_cekanju' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_reviews_order_item_id_unique" UNIQUE("order_item_id")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"kljuc" text PRIMARY KEY NOT NULL,
	"vrijednost" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"broj" text NOT NULL,
	"order_id" uuid NOT NULL,
	"shipment_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"tip" "support_ticket_tip" NOT NULL,
	"status" "support_ticket_status" DEFAULT 'novo' NOT NULL,
	"kupac_ime" text NOT NULL,
	"kupac_email" text NOT NULL,
	"kupac_telefon" text NOT NULL,
	"predmet" text NOT NULL,
	"opis" text NOT NULL,
	"slike" text[],
	"rok_odgovora_at" timestamp with time zone NOT NULL,
	"eskalirano" boolean DEFAULT false NOT NULL,
	"eskalirano_at" timestamp with time zone,
	"rjesenje" "support_ticket_rjesenje",
	"iznos_povrata" integer,
	"zatvoreno_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_tickets_broj_unique" UNIQUE("broj")
);
--> statement-breakpoint
CREATE TABLE "ticket_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"autor_user_id" uuid,
	"autor_tip" "ticket_message_autor_tip" NOT NULL,
	"poruka" text NOT NULL,
	"slike" text[],
	"interno" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_recenzent_id_medical_reviewers_id_fk" FOREIGN KEY ("recenzent_id") REFERENCES "public"."medical_reviewers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_shipment_id_order_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."order_shipments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_autor_user_id_users_id_fk" FOREIGN KEY ("autor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "posts_status_idx" ON "posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vendor_leads_status_idx" ON "vendor_leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "product_reviews_product_id_idx" ON "product_reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "support_tickets_order_id_idx" ON "support_tickets" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "support_tickets_shipment_id_idx" ON "support_tickets" USING btree ("shipment_id");--> statement-breakpoint
CREATE INDEX "support_tickets_brand_id_idx" ON "support_tickets" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "support_tickets_status_idx" ON "support_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ticket_messages_ticket_id_idx" ON "ticket_messages" USING btree ("ticket_id");