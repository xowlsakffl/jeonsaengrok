CREATE TABLE `reading_attempts` (
	`day` text NOT NULL,
	`request_id` text NOT NULL,
	`actor` text NOT NULL,
	PRIMARY KEY(`day`, `request_id`)
);
--> statement-breakpoint
CREATE INDEX `reading_attempts_day_actor` ON `reading_attempts` (`day`,`actor`);--> statement-breakpoint
CREATE TABLE `reading_days` (
	`day` text PRIMARY KEY NOT NULL,
	`salt` text NOT NULL
);
