/*
  Warnings:

  - The primary key for the `Projects` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Tasks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Workspaces` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE `Projects` DROP FOREIGN KEY `Projects_workspace_id_fkey`;

-- DropForeignKey
ALTER TABLE `Tasks` DROP FOREIGN KEY `Tasks_parent_task_id_fkey`;

-- DropForeignKey
ALTER TABLE `Tasks` DROP FOREIGN KEY `Tasks_project_id_fkey`;

-- AlterTable
ALTER TABLE `Projects` DROP PRIMARY KEY,
    MODIFY `id` BINARY(36) NOT NULL DEFAULT (uuid_to_bin(uuid())),
    MODIFY `workspace_id` BINARY(36) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `Tasks` DROP PRIMARY KEY,
    MODIFY `id` BINARY(36) NOT NULL DEFAULT (uuid_to_bin(uuid())),
    MODIFY `project_id` BINARY(36) NOT NULL,
    MODIFY `parent_task_id` BINARY(36) NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `Workspaces` DROP PRIMARY KEY,
    MODIFY `id` BINARY(36) NOT NULL DEFAULT (uuid_to_bin(uuid())),
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `Projects` ADD CONSTRAINT `Projects_workspace_id_fkey` FOREIGN KEY (`workspace_id`) REFERENCES `Workspaces`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tasks` ADD CONSTRAINT `Tasks_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `Projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tasks` ADD CONSTRAINT `Tasks_parent_task_id_fkey` FOREIGN KEY (`parent_task_id`) REFERENCES `Tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
