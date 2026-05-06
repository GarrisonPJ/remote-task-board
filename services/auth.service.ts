/**
 * AuthService — 用户认证业务逻辑
 *
 * 你需要掌握的技术：
 * - bcryptjs：密码哈希库，用于安全存储密码
 * - crypto.randomUUID()：Node.js 内置方法，生成唯一 session ID
 * - Prisma：类型安全的数据库 ORM，调用 prisma.user.create 等方法
 * - httpOnly Cookie：服务端设置的 cookie，JS 无法读取，防止 XSS 攻击窃取 session
 *
 * 数据流：
 *   Route Handler → zod 校验输入 → AuthService.xxx() → Prisma → PostgreSQL
 *
 * 设计文档参考：Section 8.1 (Auth 模块), Section 11 (Prisma Schema)
 */

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import type { RegisterInput, LoginInput } from "@/schemas/auth.schema";
import type { UserDTO } from "@/types/domain";

// ============================================================
// 示例 1：register — 用户注册（完整实现，可直接使用）
// ============================================================

/**
 * 注册流程：
 * 1. 检查 email 是否已被注册
 * 2. 用 bcrypt 哈希密码（salt=12，约 12 轮加盐，平衡安全和性能）
 * 3. 创建 User 记录
 * 4. 返回 UserDTO（不含 passwordHash，保证安全）
 */
export async function register(input: RegisterInput): Promise<UserDTO> {
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

  return user; // 类型匹配 UserDTO：{ id, name, email }
}

// ============================================================
// 示例 2：login — 用户登录（完整实现，可直接使用）
// ============================================================

/**
 * 登录流程：
 * 1. 根据 email 查找 user
 * 2. 用 bcrypt.compare 校验密码（不要自己比较哈希字符串！）
 * 3. 用 crypto.randomUUID() 生成 session ID
 * 4. 在 Session 表中创建记录，设置 7 天过期
 * 5. 返回 user + sessionId（由 Route Handler 负责设置 cookie）
 *
 * 返回的 sessionId 需要由 Route Handler 写入 httpOnly cookie：
 *   cookies().set("session_id", sessionId, {
 *     httpOnly: true,
 *     secure: process.env.NODE_ENV === "production",
 *     sameSite: "lax",
 *     path: "/",
 *     maxAge: 7 * 24 * 60 * 60, // 7 天，单位秒
 *   });
 */
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

// ============================================================
// TODO：logout — 用户登出
// ============================================================

/**
 * 登出流程：
 * 1. 根据 sessionId 删除 Session 表中的记录
 * 2. 不抛异常（即使 session 不存在也静默处理）
 *
 * 伪代码：
 *   await prisma.session.deleteMany({
 *     where: { id: sessionId }
 *   });
 *
 * Route Handler 中额外操作：
 *   cookies().delete("session_id");  // 清除浏览器 cookie
 *
 * 设计文档参考：Section 8.1
 */
export async function logout(sessionId: string): Promise<void> {
  // TODO: 用 prisma.session.deleteMany 删除 session（where: { id: sessionId }）
  // 提示：用 deleteMany 而不是 delete，因为 session 可能已经被删除，delete 会抛异常
  await prisma.session.deleteMany({
    where: { id: sessionId }
  });
}

// ============================================================
// TODO：getCurrentUser — 通过 session ID 查找当前用户
// ============================================================

/**
 * 获取当前用户流程：
 * 1. 根据 sessionId 在 Session 表中查找
 * 2. 检查 session 是否过期（expiresAt > now）
 * 3. include 关联的 User 信息
 * 4. 如果 session 不存在或已过期，返回 null（不抛异常，由 requireUser() 处理）
 *
 * Prisma 查询示例：
 *   const session = await prisma.session.findUnique({
 *     where: { id: sessionId },
 *     include: {
 *       user: {
 *         select: { id: true, name: true, email: true }
 *       }
 *     }
 *   });
 *   if (!session || session.expiresAt < new Date()) return null;
 *   return session.user;
 *
 * 此方法被 lib/auth.ts 的 getUserFromSession() 调用
 */
export async function getCurrentUser(sessionId: string): Promise<UserDTO | null> {
  // TODO: 实现上述查询逻辑
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
