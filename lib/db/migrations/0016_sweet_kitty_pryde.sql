CREATE TYPE "public"."istaknut_status" AS ENUM('nema_zahtjeva', 'na_cekanju', 'odobreno', 'odbijeno');--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "istaknut_status" "istaknut_status" DEFAULT 'nema_zahtjeva' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "istaknut_razlog_odbijanja" text;