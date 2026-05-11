import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import type { RegisterInput, LoginInput } from "@/schemas/auth.schema";
import type { UserDTO } from "@/types/domain";

export async function register(input: RegisterInput): Promise<{
  user: UserDTO;
  sessionId: string;
}> {
  // 检查邮箱唯一性 — 如果已存在，抛出业务错误
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw new AppError("EMAIL_TAKEN", "This email is already registered.", 409);
  }

  // bcrypt.hash(明文, 盐值轮数)：12 轮 bcrypt 是行业常用值（~100ms/次）
  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
    },
    // select 决定返回哪些字段 — 永远不要返回 passwordHash
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  // 注册同时创建 session，实现注册即登录
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      expiresAt,
    },
  });

  return { user, sessionId };
}

export async function login(input: LoginInput): Promise<{
  user: UserDTO;
  sessionId: string;
}> {
  // Step 1: 查找用户（select 明确指定需要的字段）
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, name: true, email: true, passwordHash: true },
  });

  if (!user) {
    throw new AppError("INVALID_CREDENTIALS", "Invalid email or password.", 401);
  }

  // Step 2: bcrypt.compare(明文, 哈希值) 返回 boolean
  const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatch) {
    throw new AppError("INVALID_CREDENTIALS", "Invalid email or password.", 401);
  }

  // Step 3: 生成 session
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天后

  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      expiresAt,
    },
  });

  // Step 4: 仅返回安全字段
  const { passwordHash: _, ...userDTO } = user;
  return { user: userDTO, sessionId };
}

export async function logout(sessionId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { id: sessionId } });
}

export async function getCurrentUser(sessionId: string): Promise<UserDTO | null> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });
  if (!session || session.expiresAt < new Date()) return null;

  return session.user;
}

// ============================================================
// cleanupExpiredSessions — 定期清理过期 session（约 1% 概率触发）
// ============================================================

let cleanupCounter = 0;

export async function cleanupExpiredSessions(): Promise<void> {
  cleanupCounter++;
  // 约 1% 概率执行，避免每次请求都扫表
  if (cleanupCounter % 100 !== 0) return;
  await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}
