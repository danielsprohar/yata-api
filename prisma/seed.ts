import { PrismaClient } from "@prisma/client";
import { generatePrimaryKey, uuidToBuffer } from "../src/core/utils/uuid.util";
import { TaskPriority } from "../src/features/tasks/enums/task-priority.enum";

const prisma = new PrismaClient();

async function main() {
  const ownerIdBuffer = uuidToBuffer("af38f281-fe7c-4ee2-90cf-d5e16a4fe146");

  const workspace = await prisma.workspace.create({
    data: {
      name: "My Workspace",
      id: generatePrimaryKey(),
      ownerId: ownerIdBuffer,
    },
  });

  const project = await prisma.project.create({
    data: {
      name: "My Project",
      id: generatePrimaryKey(),
      workspaceId: workspace.id,
      ownerId: ownerIdBuffer,
    },
  });

  const sectionIds = [
    generatePrimaryKey(),
    generatePrimaryKey(),
    generatePrimaryKey(),
  ];
  await prisma.section.createMany({
    data: [
      {
        name: "Not Started",
        id: sectionIds[0],
        projectId: project.id,
        ownerId: ownerIdBuffer,
        position: 0,
      },
      {
        name: "In Progress",
        id: sectionIds[1],
        projectId: project.id,
        ownerId: ownerIdBuffer,
        position: 1,
      },
      {
        name: "Completed",
        id: sectionIds[2],
        projectId: project.id,
        ownerId: ownerIdBuffer,
        position: 2,
      },
    ],
  });

  const now = new Date();
  await prisma.task.createMany({
    data: [
      {
        title: "Task 1",
        priority: TaskPriority.LOW,
        id: generatePrimaryKey(),
        ownerId: ownerIdBuffer,
        workspaceId: workspace.id,
        projectId: project.id,
        sectionId: sectionIds[0],
        dueDate: new Date(new Date().setHours(0, 0, 0, 0)),
      },
      {
        title: "Task 2",
        priority: TaskPriority.NONE,
        id: generatePrimaryKey(),
        ownerId: ownerIdBuffer,
        workspaceId: workspace.id,
        projectId: project.id,
        sectionId: sectionIds[1],
        dueDate: new Date(
          new Date(new Date().setDate(now.getDate() + 1)).setHours(0, 0, 0, 0),
        ),
      },
      {
        title: "Task 3",
        priority: TaskPriority.HIGH,
        id: generatePrimaryKey(),
        ownerId: ownerIdBuffer,
        workspaceId: workspace.id,
        projectId: project.id,
        sectionId: sectionIds[2],
        dueDate: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
