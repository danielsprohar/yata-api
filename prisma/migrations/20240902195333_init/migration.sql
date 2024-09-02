/*
  Warnings:

  - You are about to alter the column `name` on the `Calendar` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(32)`.
  - You are about to alter the column `name` on the `Column` table. The data in that column could be lost. The data in that column will be cast from `VarChar(128)` to `VarChar(32)`.
  - You are about to alter the column `name` on the `Workspace` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(32)`.

*/
-- AlterTable
ALTER TABLE `Calendar` MODIFY `name` VARCHAR(32) NOT NULL;

-- AlterTable
ALTER TABLE `Column` MODIFY `name` VARCHAR(32) NOT NULL;

-- AlterTable
ALTER TABLE `Workspace` MODIFY `name` VARCHAR(32) NOT NULL;
