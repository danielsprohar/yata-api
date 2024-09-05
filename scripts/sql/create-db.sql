-- yata.Calendar definition

CREATE TABLE `Calendar` (
  `id` binary(36) NOT NULL,
  `name` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `public` tinyint(1) NOT NULL DEFAULT '0',
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Calendar_name_idx` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- yata.Workspace definition

CREATE TABLE `Workspace` (
  `id` binary(36) NOT NULL,
  `name` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `public` tinyint(1) NOT NULL DEFAULT '0',
  `owner_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Workspace_name_idx` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- yata.Board definition

CREATE TABLE `Board` (
  `id` binary(36) NOT NULL,
  `name` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `workspace_id` binary(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Board_name_idx` (`name`),
  KEY `Board_workspace_id_fkey` (`workspace_id`),
  CONSTRAINT `Board_workspace_id_fkey` FOREIGN KEY (`workspace_id`) REFERENCES `Workspace` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- yata.CalendarEvent definition

CREATE TABLE `CalendarEvent` (
  `id` binary(36) NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `start_date` datetime(3) NOT NULL,
  `end_date` datetime(3) NOT NULL,
  `all_day` tinyint(1) NOT NULL DEFAULT '1',
  `rrule` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `calendar_id` binary(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `CalendarEvent_name_idx` (`name`),
  KEY `CalendarEvent_calendar_id_fkey` (`calendar_id`),
  CONSTRAINT `CalendarEvent_calendar_id_fkey` FOREIGN KEY (`calendar_id`) REFERENCES `Calendar` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- yata.`Column` definition

CREATE TABLE `Column` (
  `id` binary(36) NOT NULL,
  `name` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `position` int NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `board_id` binary(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Column_name_idx` (`name`),
  KEY `Column_board_id_fkey` (`board_id`),
  CONSTRAINT `Column_board_id_fkey` FOREIGN KEY (`board_id`) REFERENCES `Board` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- yata.Project definition

CREATE TABLE `Project` (
  `id` binary(36) NOT NULL,
  `name` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` enum('NOT_STARTED','IN_PROGRESS','CANCELLED','COMPLETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NOT_STARTED',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `workspace_id` binary(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Project_name_idx` (`name`),
  KEY `Project_workspace_id_fkey` (`workspace_id`),
  CONSTRAINT `Project_workspace_id_fkey` FOREIGN KEY (`workspace_id`) REFERENCES `Workspace` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- yata.Task definition

CREATE TABLE `Task` (
  `id` binary(36) NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` enum('NOT_STARTED','IN_PROGRESS','COMPLETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NOT_STARTED',
  `due_date` datetime(3) DEFAULT NULL,
  `priority` enum('NONE','LOW','MEDIUM','HIGH') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MEDIUM',
  `all_day` tinyint(1) NOT NULL DEFAULT '1',
  `started_at` datetime(3) DEFAULT NULL,
  `completed_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `rrule` text COLLATE utf8mb4_unicode_ci,
  `workspace_id` binary(36) NOT NULL,
  `project_id` binary(36) DEFAULT NULL,
  `column_id` binary(36) DEFAULT NULL,
  `parent_id` binary(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Task_name_idx` (`name`),
  KEY `Task_workspace_id_fkey` (`workspace_id`),
  KEY `Task_project_id_fkey` (`project_id`),
  KEY `Task_column_id_fkey` (`column_id`),
  KEY `Task_parent_id_fkey` (`parent_id`),
  CONSTRAINT `Task_column_id_fkey` FOREIGN KEY (`column_id`) REFERENCES `Column` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Task_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `Task` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Task_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `Project` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Task_workspace_id_fkey` FOREIGN KEY (`workspace_id`) REFERENCES `Workspace` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;