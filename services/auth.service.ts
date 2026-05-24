import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import type { RegisterInput, LoginInput } from "@/schemas/auth.schema";
import type { UserDTO } from "@/types/domain";

export interface AuthResult {
  user: UserDTO;
  sessionId: string;
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw new AppError("EMAIL_TAKEN", "This email is already registered.", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    await tx.session.create({
      data: {
        id: sessionId,
        userId: createdUser.id,
        expiresAt,
      },
    });

    return createdUser;
  });

  return { user, sessionId };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, name: true, email: true, passwordHash: true },
  });

  if (!user) {
    throw new AppError("INVALID_CREDENTIALS", "Invalid email or password.", 401);
  }

  const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatch) {
    throw new AppError("INVALID_CREDENTIALS", "Invalid email or password.", 401);
  }

  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      expiresAt,
    },
  });

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
        select: { id: true, name: true, email: true },
      },
    },
  });
  if (!session || session.expiresAt < new Date()) return null;

  return session.user;
}

let lastCleanup = 0;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export async function cleanupExpiredSessions(): Promise<void> {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}
