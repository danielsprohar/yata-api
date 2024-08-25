-- CreateTable
CREATE TABLE `Workspaces` (
    `id` BINARY(16) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `public` BOOLEAN NOT NULL DEFAULT false,
    `owner_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Projects` (
    `id` BINARY(16) NOT NULL DEFAULT (uuid_to_bin(uuid())),
    `workspace_id` BINARY(16) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('Not Started', 'In Progress', 'COMPLETED') NOT NULL DEFAULT 'Not Started',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Projects_workspace_id_idx`(`workspace_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tasks` (
    `id` BINARY(16) NOT NULL DEFAULT (uuid_to_bin(uuid())),
    `project_id` BINARY(16) NOT NULL,
    `parent_task_id` BINARY(16) NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('Not Started', 'In Progress', 'COMPLETED') NOT NULL DEFAULT 'Not Started',
    `due_date` DATETIME(3) NULL,
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'MEDIUM',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Tasks_project_id_idx`(`project_id`),
    INDEX `Tasks_parent_task_id_idx`(`parent_task_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Projects` ADD CONSTRAINT `Projects_workspace_id_fkey` FOREIGN KEY (`workspace_id`) REFERENCES `Workspaces`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tasks` ADD CONSTRAINT `Tasks_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `Projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tasks` ADD CONSTRAINT `Tasks_parent_task_id_fkey` FOREIGN KEY (`parent_task_id`) REFERENCES `Tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
