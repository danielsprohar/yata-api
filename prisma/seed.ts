import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.workspace.deleteMany();

  const workspace = await prisma.workspace.create({
    data: {
      id: Buffer.from(uuidv4()),
      name: 'YATA',
    },
  });

  await prisma.project.createMany({
    data: [
      {
        id: Buffer.from(uuidv4()),
        name: 'Frontend',
        workspaceId: workspace.id,
      },
      {
        id: Buffer.from(uuidv4()),
        name: 'Backend',
        workspaceId: workspace.id,
      },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        id: Buffer.from(uuidv4()),
        name: 'Create a new workspace',
        workspaceId: workspace.id,
      },
      {
        id: Buffer.from(uuidv4()),
        name: 'Create a new project',
        workspaceId: workspace.id,
      },
      {
        id: Buffer.from(uuidv4()),
        name: 'Create a new task',
        workspaceId: workspace.id,
      },
      {
        id: Buffer.from(uuidv4()),
        name: 'Create a new calendar',
        workspaceId: workspace.id,
      },
      {
        id: Buffer.from(uuidv4()),
        name: 'Create a board',
        workspaceId: workspace.id,
      },
      {
        id: Buffer.from(uuidv4()),
        name: 'Create a board columns',
        workspaceId: workspace.id,
      },
    ],
  });

  await prisma.board.create({
    data: {
      id: Buffer.from(uuidv4()),
      name: 'My First Kanban',
      workspaceId: workspace.id,
    },
  });
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
