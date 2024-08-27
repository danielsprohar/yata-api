/*
  Warnings:

  - Added the required column `workspace_id` to the `Tasks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Tasks` ADD COLUMN `workspace_id` BINARY(36) NOT NULL;

-- CreateIndex
CREATE INDEX `Tasks_workspace_id_idx` ON `Tasks`(`workspace_id`);

-- CreateIndex
CREATE INDEX `Tasks_name_idx` ON `Tasks`(`name`);

-- AddForeignKey
ALTER TABLE `Tasks` ADD CONSTRAINT `Tasks_workspace_id_fkey` FOREIGN KEY (`workspace_id`) REFERENCES `Workspaces`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
