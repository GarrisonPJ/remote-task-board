import { test, expect } from "@playwright/test";

test("user A cannot see user B's workspace", async ({ browser }) => {
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const reqA = ctxA.request;
  const reqB = ctxB.request;

  // 注册用户 A
  const emailA = `iso-a-${Date.now()}@example.com`;
  await reqA.post("/api/auth/register", {
    data: { name: "Isolation A", email: emailA, password: "password123" },
  });
  await reqA.post("/api/auth/login", {
    data: { email: emailA, password: "password123" },
  });

  // 用户 A 创建 workspace
  const wsA = await reqA.post("/api/workspaces", {
    data: { name: "A's Workspace" },
  });
  expect(wsA.status()).toBe(201);

  // 注册用户 B
  const emailB = `iso-b-${Date.now()}@example.com`;
  await reqB.post("/api/auth/register", {
    data: { name: "Isolation B", email: emailB, password: "password123" },
  });
  await reqB.post("/api/auth/login", {
    data: { email: emailB, password: "password123" },
  });

  // 用户 B 获取 workspace 列表 — 应该看不到 A 的
  const listB = await reqB.get("/api/workspaces");
  const listBodyB = await listB.json();
  const namesB = listBodyB.data.map((ws: { name: string }) => ws.name);
  expect(namesB).not.toContain("A's Workspace");

  await ctxA.close();
  await ctxB.close();
});

test("unauthenticated user is redirected to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/login/);
});

test("unauthenticated API requests return 401", async ({ request }) => {
  const res = await request.get("/api/workspaces");
  expect(res.status()).toBe(401);
});
