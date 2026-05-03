import { UnauthorizedError } from "./errors";

export async function getUserFromSession(): Promise<{
  id: string;
  name: string;
  email: string;
} | null> {
  return null;
}

export async function requireUser() {
  const user = await getUserFromSession();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}
