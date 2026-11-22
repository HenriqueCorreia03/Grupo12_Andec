CREATE TABLE "picking_wave" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_line" integer NOT NULL,
	"wave_number" text NOT NULL,
	"reference" text NOT NULL,
	"size" double precision,
	"quantity" integer NOT NULL,
	"location" text NOT NULL,
	"operator" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw_picking_wave" (
	"source_line" integer PRIMARY KEY NOT NULL,
	"wave_number" text,
	"reference" text,
	"size" text,
	"quantity" text,
	"location" text,
	"operator" text
);
--> statement-breakpoint
CREATE TABLE "raw_storage_location" (
	"source_line" integer PRIMARY KEY NOT NULL,
	"original_location" text,
	"position" text,
	"x" text,
	"y" text,
	"z" text
);
--> statement-breakpoint
CREATE TABLE "storage_location" (
	"location" text PRIMARY KEY NOT NULL,
	"source_line" integer NOT NULL,
	"position" text NOT NULL,
	"x" integer NOT NULL,
	"y" integer NOT NULL,
	"z" integer NOT NULL
);
