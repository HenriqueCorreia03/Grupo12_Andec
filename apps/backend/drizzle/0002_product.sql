CREATE TABLE "product" (
	"reference" text PRIMARY KEY NOT NULL,
	"source_line" integer NOT NULL,
	"abccod" text NOT NULL,
	"sector" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw_product" (
	"source_line" integer PRIMARY KEY NOT NULL,
	"reference" text,
	"abccod" text,
	"sector" text
);
