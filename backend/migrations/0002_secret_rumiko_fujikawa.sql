CREATE TABLE `gateway_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gateway_groups_name_unique` ON `gateway_groups` (`name`);--> statement-breakpoint
CREATE TABLE `gateways` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_id` integer NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'ON' NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `gateway_groups`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gateways_name_unique` ON `gateways` (`name`);--> statement-breakpoint
CREATE TABLE `gateway_secrets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gateway_id` integer NOT NULL,
	`key_name` text NOT NULL,
	`env_var` text NOT NULL,
	FOREIGN KEY (`gateway_id`) REFERENCES `gateways`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gateway_id` integer,
	`status` text NOT NULL,
	`reason` text,
	`created_at` integer
);
