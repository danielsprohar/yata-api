-- CreateTable
CREATE TABLE `Calendar` (
    `id` BINARY(16) NOT NULL,
    `name` VARCHAR(32) NOT NULL,
    `description` TEXT NULL,
    `public` BOOLEAN NOT NULL DEFAULT false,
    `owner_id` BINARY(16) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    INDEX `Calendar_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CalendarEvent` (
    `id` BINARY(16) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `all_day` BOOLEAN NOT NULL DEFAULT true,
    `rrule` TEXT NULL,
    `owner_id` BINARY(16) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `calendar_id` BINARY(16) NOT NULL,

    INDEX `CalendarEvent_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Workspace` (
    `id` BINARY(16) NOT NULL,
    `name` VARCHAR(32) NOT NULL,
    `description` TEXT NULL,
    `public` BOOLEAN NOT NULL DEFAULT false,
    `owner_id` BINARY(16) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    INDEX `Workspace_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` BINARY(16) NOT NULL,
    `name` VARCHAR(32) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'NOT_STARTED',
    `owner_id` BINARY(16) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `workspace_id` BINARY(16) NOT NULL,

    INDEX `Project_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Section` (
    `id` BINARY(16) NOT NULL,
    `name` VARCHAR(32) NOT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `owner_id` BINARY(16) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `project_id` BINARY(16) NOT NULL,

    UNIQUE INDEX `Section_project_id_position_key`(`project_id`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Task` (
    `id` BINARY(16) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'NOT_STARTED',
    `due_date` DATETIME(3) NULL,
    `priority` ENUM('NONE', 'LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'NONE',
    `all_day` BOOLEAN NOT NULL DEFAULT true,
    `started_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `rrule` TEXT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `owner_id` BINARY(16) NOT NULL,
    `workspace_id` BINARY(16) NOT NULL,
    `project_id` BINARY(16) NOT NULL,
    `parent_id` BINARY(16) NULL,
    `sectionId` BINARY(16) NULL,

    INDEX `Task_title_idx`(`title`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tag` (
    `id` BINARY(16) NOT NULL,
    `name` VARCHAR(16) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `owner_id` BINARY(16) NOT NULL,

    INDEX `Tag_name_idx`(`name`),
    INDEX `Tag_owner_id_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_TagToTask` (
    `A` BINARY(16) NOT NULL,
    `B` BINARY(16) NOT NULL,

    UNIQUE INDEX `_TagToTask_AB_unique`(`A`, `B`),
    INDEX `_TagToTask_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CalendarEvent` ADD CONSTRAINT `CalendarEvent_calendar_id_fkey` FOREIGN KEY (`calendar_id`) REFERENCES `Calendar`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_workspace_id_fkey` FOREIGN KEY (`workspace_id`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Section` ADD CONSTRAINT `Section_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_workspace_id_fkey` FOREIGN KEY (`workspace_id`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `Task`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `Section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_TagToTask` ADD CONSTRAINT `_TagToTask_A_fkey` FOREIGN KEY (`A`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_TagToTask` ADD CONSTRAINT `_TagToTask_B_fkey` FOREIGN KEY (`B`) REFERENCES `Task`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
