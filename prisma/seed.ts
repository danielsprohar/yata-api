import { PrismaClient } from "@prisma/client";
import { generatePrimaryKey } from "../src/core/utils/uuid.util";

const prisma = new PrismaClient();

async function main() {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.workspace.deleteMany();

  const workspace = await prisma.workspace.create({
    data: {
      id: generatePrimaryKey(),
      name: "YATA",
    },
  });

  await prisma.project.createMany({
    data: [
      {
        id: generatePrimaryKey(),
        name: "Frontend",
        workspaceId: workspace.id,
      },
      {
        id: generatePrimaryKey(),
        name: "Backend",
        workspaceId: workspace.id,
      },
    ],
  });

  const projects = await prisma.project.findMany({});

  for (const project of projects) {
    await prisma.task.createMany({
      data: [
        {
          id: generatePrimaryKey(),
          name: "Create a new workspace",
          workspaceId: workspace.id,
          projectId: project.id,
        },
        {
          id: generatePrimaryKey(),
          name: "Create a new project",
          workspaceId: workspace.id,
          projectId: project.id,
        },
        {
          id: generatePrimaryKey(),
          name: "Create a new task",
          workspaceId: workspace.id,
          projectId: project.id,
        },
        {
          id: generatePrimaryKey(),
          name: "Create a new calendar",
          workspaceId: workspace.id,
          projectId: project.id,
        },
        {
          id: generatePrimaryKey(),
          name: "Create a board",
          workspaceId: workspace.id,
          projectId: project.id,
        },
        {
          id: generatePrimaryKey(),
          name: "Create a board columns",
          workspaceId: workspace.id,
          projectId: project.id,
        },
      ],
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
