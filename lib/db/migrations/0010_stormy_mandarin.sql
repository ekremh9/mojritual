ALTER TABLE "brands" ADD COLUMN "istaknuto_mjesecno" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "istaknut_zahtjev" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "istaknut" boolean DEFAULT false NOT NULL;