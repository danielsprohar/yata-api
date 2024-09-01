/*
  Warnings:

  - You are about to alter the column `name` on the `KanbanColumns` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(128)`.

*/
-- AlterTable
ALTER TABLE `KanbanColumns` MODIFY `name` VARCHAR(128) NOT NULL;
