import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // TODO: Implement seed data per design doc:
  // - alice@test.com / password123 as OWNER
  // - bob@test.com / password123 as MEMBER
  // - "Alice's Workspace" with members alice (OWNER) and bob (MEMBER)
  // - "MVP Features" project
  // - 4 tasks with different statuses

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
