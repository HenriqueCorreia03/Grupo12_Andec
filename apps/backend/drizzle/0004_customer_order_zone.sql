CREATE TABLE "customer_order_zone" (
	"line_id" integer NOT NULL,
	"zone" text NOT NULL,
	"units" double precision NOT NULL,
	CONSTRAINT "customer_order_zone_line_id_zone_pk" PRIMARY KEY("line_id","zone")
);
--> statement-breakpoint
CREATE INDEX "customer_order_zone_zone_idx" ON "customer_order_zone" USING btree ("zone");