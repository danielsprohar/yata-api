-- AlterTable
ALTER TABLE `Tasks` MODIFY `priority` ENUM('NONE', 'LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'MEDIUM';
