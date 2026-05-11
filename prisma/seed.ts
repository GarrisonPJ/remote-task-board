import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  console.log("Seeding database...");

  // 清理旧数据（按外键顺序）
  await prisma.activityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // 创建用户
  const passwordHash = await bcrypt.hash("password123", 12);

  const alice = await prisma.user.create({
    data: { name: "Alice", email: "alice@test.com", passwordHash },
  });
  const bob = await prisma.user.create({
    data: { name: "Bob", email: "bob@test.com", passwordHash },
  });
  console.log("  Users created: alice@test.com, bob@test.com");

  // 创建工作区
  const workspace = await prisma.workspace.create({
    data: { name: "Alice's Workspace" },
  });

  // 添加成员
  await prisma.workspaceMember.create({
    data: { workspaceId: workspace.id, userId: alice.id, role: "OWNER" },
  });
  await prisma.workspaceMember.create({
    data: { workspaceId: workspace.id, userId: bob.id, role: "MEMBER" },
  });
  console.log("  Workspace created with alice (OWNER) and bob (MEMBER)");

  // 创建项目
  const project = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: "MVP Features",
      description: "Core features for the initial product launch.",
    },
  });

  const project2 = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: "Bug Fixes",
      description: "Reported issues that need attention.",
    },
  });
  console.log("  Projects created: MVP Features, Bug Fixes");

  // 创建任务（不同状态）
  await prisma.task.create({
    data: {
      projectId: project.id,
      title: "Set up CI/CD pipeline",
      description: "Configure GitHub Actions for automated testing and deployment.",
      status: "DONE",
      priority: "HIGH",
      creatorId: alice.id,
      assigneeId: alice.id,
    },
  });

  await prisma.task.create({
    data: {
      projectId: project.id,
      title: "Implement user authentication",
      description: "Add login and registration with session management.",
      status: "IN_REVIEW",
      priority: "URGENT",
      creatorId: alice.id,
      assigneeId: bob.id,
    },
  });

  await prisma.task.create({
    data: {
      projectId: project.id,
      title: "Design dashboard layout",
      description: "Create the main dashboard page with workspace overview.",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      creatorId: bob.id,
      assigneeId: alice.id,
    },
  });

  await prisma.task.create({
    data: {
      projectId: project.id,
      title: "Add dark mode support",
      description: "Implement theme switching with Tailwind CSS dark mode.",
      status: "TODO",
      priority: "LOW",
      creatorId: alice.id,
    },
  });

  await prisma.task.create({
    data: {
      projectId: project2.id,
      title: "Fix login redirect issue",
      description: "Users are not redirected to dashboard after login on slow connections.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      creatorId: alice.id,
      assigneeId: bob.id,
    },
  });

  await prisma.task.create({
    data: {
      projectId: project2.id,
      title: "Task status not updating",
      description: "Status change returns 200 but UI does not reflect the change.",
      status: "TODO",
      priority: "URGENT",
      creatorId: bob.id,
    },
  });
  console.log("  Tasks created: 6 tasks across 2 projects");

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
