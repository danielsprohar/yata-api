/*
  Warnings:

  - You are about to drop the column `parent_task_id` on the `Tasks` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Tasks` DROP FOREIGN KEY `Tasks_parent_task_id_fkey`;

-- AlterTable
ALTER TABLE `Tasks` DROP COLUMN `parent_task_id`,
    ADD COLUMN `kanbanColumnId` BINARY(36) NULL,
    ADD COLUMN `parent_id` BINARY(36) NULL;

-- CreateTable
CREATE TABLE `KanbanColumns` (
    `id` BINARY(36) NOT NULL DEFAULT (uuid_to_bin(uuid())),
    `project_id` BINARY(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `KanbanColumns_project_id_idx`(`project_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Tasks_parent_id_idx` ON `Tasks`(`parent_id`);

-- AddForeignKey
ALTER TABLE `KanbanColumns` ADD CONSTRAINT `KanbanColumns_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `Projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tasks` ADD CONSTRAINT `Tasks_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `Tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tasks` ADD CONSTRAINT `Tasks_kanbanColumnId_fkey` FOREIGN KEY (`kanbanColumnId`) REFERENCES `KanbanColumns`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
