CREATE TABLE "customer_order" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_line" integer NOT NULL,
	"customer" text NOT NULL,
	"order_number" text NOT NULL,
	"order_to_collect" integer NOT NULL,
	"reference" text NOT NULL,
	"size" double precision,
	"size_scale_unconfirmed" boolean NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp NOT NULL,
	"wave_number" text NOT NULL,
	"operator" text NOT NULL,
	"is_duplicate" boolean NOT NULL,
	"is_zero" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw_customer_order" (
	"source_line" integer PRIMARY KEY NOT NULL,
	"cod_customer" text,
	"order_number" text,
	"order_to_collect" text,
	"reference" text,
	"size" text,
	"quantity" text,
	"creation_date" text,
	"wave_number" text,
	"operator" text
);
