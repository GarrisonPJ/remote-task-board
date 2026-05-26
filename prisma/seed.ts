import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  console.log("Seeding database with rich dataset...");

  // 清理旧数据（按外键顺序）
  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 12);

  // 1. 创建四位用户
  const alice = await prisma.user.create({ data: { name: "Alice (Owner WS1)", email: "alice@test.com", passwordHash } });
  const bob = await prisma.user.create({ data: { name: "Bob (Owner WS2)", email: "bob@test.com", passwordHash } });
  const charlie = await prisma.user.create({ data: { name: "Charlie (Member)", email: "charlie@test.com", passwordHash } });
  const dave = await prisma.user.create({ data: { name: "Dave (Viewer)", email: "dave@test.com", passwordHash } });
  console.log("  Users created: Alice, Bob, Charlie, Dave");

  // 2. 创建两个工作区
  const ws1 = await prisma.workspace.create({ data: { name: "Tech Startup WS" } });
  const ws2 = await prisma.workspace.create({ data: { name: "Design Studio WS" } });

  // 3. 分配 Workspace 1 成员 (Owner: Alice, Members: Bob, Charlie, Viewer: Dave)
  await prisma.workspaceMember.createMany({
    data: [
      { workspaceId: ws1.id, userId: alice.id, role: "OWNER" },
      { workspaceId: ws1.id, userId: bob.id, role: "MEMBER" },
      { workspaceId: ws1.id, userId: charlie.id, role: "MEMBER" },
      { workspaceId: ws1.id, userId: dave.id, role: "VIEWER" },
    ]
  });

  // 4. 分配 Workspace 2 成员 (Owner: Bob, Members: Alice, Charlie, Viewer: Dave)
  await prisma.workspaceMember.createMany({
    data: [
      { workspaceId: ws2.id, userId: bob.id, role: "OWNER" },
      { workspaceId: ws2.id, userId: alice.id, role: "MEMBER" },
      { workspaceId: ws2.id, userId: charlie.id, role: "MEMBER" },
      { workspaceId: ws2.id, userId: dave.id, role: "VIEWER" },
    ]
  });
  console.log("  Workspaces created and roles assigned.");

  // 5. 创建 3 个项目 (WS1: 2个, WS2: 1个)
  const proj1 = await prisma.project.create({ data: { workspaceId: ws1.id, name: "V1.0 Launch", description: "Core feature rollout" } });
  const proj2 = await prisma.project.create({ data: { workspaceId: ws1.id, name: "Marketing Campaign", description: "Q3 Social Media push" } });
  const proj3 = await prisma.project.create({ data: { workspaceId: ws2.id, name: "Brand Redesign", description: "New logo and UI kit" } });

  // 6. 创建任务 (Task) 并在其中添加评论 (Comments)
  // --- Project 1 Tasks ---
  const task1 = await prisma.task.create({
    data: { projectId: proj1.id, title: "Database Migration", description: "Migrate to Supabase PostgreSQL", status: "DONE", priority: "URGENT", creatorId: alice.id, assigneeId: charlie.id },
  });
  await prisma.comment.createMany({
    data: [
      { taskId: task1.id, userId: alice.id, content: "Charlie, please make sure to backup before migrating." },
      { taskId: task1.id, userId: charlie.id, content: "Backup completed! Migration took 5 seconds." },
    ]
  });

  const task2 = await prisma.task.create({
    data: { projectId: proj1.id, title: "Setup WebSockets", description: "Use Pusher for real-time sync", status: "IN_REVIEW", priority: "HIGH", creatorId: alice.id, assigneeId: bob.id },
  });
  await prisma.comment.createMany({
    data: [
      { taskId: task2.id, userId: bob.id, content: "PR is up. Check out the Pusher integration." },
      { taskId: task2.id, userId: dave.id, content: "Looking good from my end (Viewer passing by 👋)" },
    ]
  });

  // --- Project 2 Tasks ---
  const task3 = await prisma.task.create({
    data: { projectId: proj2.id, title: "Write Press Release", description: "Draft the PR for TechCrunch", status: "IN_PROGRESS", priority: "MEDIUM", creatorId: bob.id, assigneeId: alice.id },
  });
  await prisma.comment.create({ data: { taskId: task3.id, userId: alice.id, content: "I'll need some bullet points from the product team." } });

  const task4 = await prisma.task.create({
    data: { projectId: proj2.id, title: "Design Ad Banners", status: "TODO", priority: "LOW", creatorId: charlie.id },
  });

  // --- Project 3 Tasks (Design Studio) ---
  const task5 = await prisma.task.create({
    data: { projectId: proj3.id, title: "New Logo Concepts", description: "Explore 3 directions for the new logo", status: "IN_PROGRESS", priority: "HIGH", creatorId: bob.id, assigneeId: charlie.id },
  });
  await prisma.comment.createMany({
    data: [
      { taskId: task5.id, userId: charlie.id, content: "Uploading the first draft to Figma now." },
      { taskId: task5.id, userId: bob.id, content: "Great! Let's review it in tomorrow's sync." },
    ]
  });

  const task6 = await prisma.task.create({
    data: { projectId: proj3.id, title: "UI Kit Finalization", status: "TODO", priority: "MEDIUM", creatorId: bob.id, assigneeId: alice.id },
  });

  console.log("  Tasks and Comments successfully seeded!");
  console.log("Seed complete. You can now login with any of the users (password: password123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
