ALTER TABLE "wholesale_price_tiers" ADD COLUMN "popust_posto" numeric(5, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "wholesale_price_tiers" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "wholesale_price_tiers" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;