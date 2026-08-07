CREATE TYPE "public"."brand_status" AS ENUM('na_cekanju', 'odobren', 'suspendovan');--> statement-breakpoint
CREATE TYPE "public"."brand_user_role" AS ENUM('vlasnik', 'urednik');--> statement-breakpoint
CREATE TYPE "public"."business_account_status" AS ENUM('na_cekanju', 'odobreno', 'odbijeno', 'suspendovano');--> statement-breakpoint
CREATE TYPE "public"."business_account_type" AS ENUM('farmaceutska_kuca', 'medicinska_ustanova', 'ostalo');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('customer', 'brand', 'admin');--> statement-breakpoint
CREATE TABLE "brand_certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"naziv" text NOT NULL,
	"opis" text,
	"dokument_url" text,
	"redoslijed" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"naziv" text NOT NULL,
	"kratki_opis" text,
	"prica" text,
	"logo_url" text,
	"cover_url" text,
	"web" text,
	"email" text,
	"telefon" text,
	"jib" text,
	"pdv_broj" text,
	"adresa" text,
	"status" "brand_status" DEFAULT 'na_cekanju' NOT NULL,
	"verifikovan" boolean DEFAULT false NOT NULL,
	"provizija_mp_posto" numeric(5, 2) DEFAULT '20.00' NOT NULL,
	"provizija_vp_posto" numeric(5, 2) DEFAULT '20.00' NOT NULL,
	"prag_besplatne_dostave" integer,
	"cijena_dostave" integer DEFAULT 0 NOT NULL,
	"naknada_prisustvo_mjesecno" integer DEFAULT 0 NOT NULL,
	"naknada_stepen_velicina" integer DEFAULT 50 NOT NULL,
	"naknada_aktivna_od" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "brand_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"uloga" "brand_user_role" NOT NULL,
	CONSTRAINT "brand_users_user_id_brand_id_unique" UNIQUE("user_id","brand_id")
);
--> statement-breakpoint
CREATE TABLE "business_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"naziv" text NOT NULL,
	"tip" "business_account_type" NOT NULL,
	"jib" text NOT NULL,
	"pdv_broj" text,
	"adresa" text NOT NULL,
	"grad" text NOT NULL,
	"postanski_broj" text NOT NULL,
	"kontakt_osoba" text NOT NULL,
	"kontakt_telefon" text NOT NULL,
	"status" "business_account_status" DEFAULT 'na_cekanju' NOT NULL,
	"odobrio_user_id" uuid,
	"odobreno_at" timestamp with time zone,
	"napomena_admina" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"role" "user_role" NOT NULL,
	"ime" text,
	"telefon" text,
	"email_verifikovan_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "brand_certificates" ADD CONSTRAINT "brand_certificates_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_users" ADD CONSTRAINT "brand_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_users" ADD CONSTRAINT "brand_users_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_accounts" ADD CONSTRAINT "business_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_accounts" ADD CONSTRAINT "business_accounts_odobrio_user_id_users_id_fk" FOREIGN KEY ("odobrio_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brand_certificates_brand_id_idx" ON "brand_certificates" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "brand_users_user_id_idx" ON "brand_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "brand_users_brand_id_idx" ON "brand_users" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "business_accounts_user_id_idx" ON "business_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "business_accounts_odobrio_user_id_idx" ON "business_accounts" USING btree ("odobrio_user_id");