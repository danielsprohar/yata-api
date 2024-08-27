import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.workspace.deleteMany();

  const trailwindsWorkspace = await prisma.workspace.create({
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
        workspaceId: trailwindsWorkspace.id,
      },
      {
        id: Buffer.from(uuidv4()),
        name: 'Backend',
        workspaceId: trailwindsWorkspace.id,
      },
    ],
  });

  const projects = await prisma.project.findMany({
    where: {
      workspaceId: trailwindsWorkspace.id,
    },
  });

  for (const project of projects) {
    await prisma.task.createMany({
      data: [
        {
          id: Buffer.from(uuidv4()),
          name: 'Create a new project',
          projectId: project.id,
          workspaceId: trailwindsWorkspace.id,
        },
        {
          id: Buffer.from(uuidv4()),
          name: 'Create a new task',
          projectId: project.id,
          workspaceId: trailwindsWorkspace.id,
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
