import { test, expect } from "@playwright/test";

test("user can register and be redirected to dashboard", async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Name").fill("Test User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("user can login with seed account", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("alice@test.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByText("Welcome back, Alice", { exact: true })).toBeVisible();
});

test("full creation flow: workspace → project → task", async ({ page }) => {
  // 1. 注册新用户
  const email = `flow-${Date.now()}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Name").fill("Flow Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/dashboard/);

  // 2. 创建 workspace（通过 API，因为 UI 创建按钮还没实现）
  const wsRes = await page.request.post("/api/workspaces", {
    data: { name: "Test Workspace" },
  });
  expect(wsRes.status()).toBe(201);

  // 3. 创建 project
  const wsBody = await wsRes.json();
  const wsId = wsBody.data.id;

  const projRes = await page.request.post("/api/projects", {
    data: { workspaceId: wsId, name: "Test Project" },
  });
  expect(projRes.status()).toBe(201);

  // 4. 创建 task
  const projBody = await projRes.json();
  const projId = projBody.data.id;

  const taskRes = await page.request.post("/api/tasks", {
    data: { projectId: projId, title: "Test Task" },
  });
  expect(taskRes.status()).toBe(201);

  // 5. 验证 task 可在列表中找到
  const listRes = await page.request.get(`/api/tasks?projectId=${projId}`);
  expect(listRes.status()).toBe(200);
  const listBody = await listRes.json();
  expect(listBody.data.items.length).toBeGreaterThanOrEqual(1);
});

test("user can change task status", async ({ page }) => {
  // 1. 登录
  await page.goto("/login");
  await page.getByLabel("Email").fill("alice@test.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/dashboard/);

  // 2. 获取 workspace 和 project
  const wsRes = await page.request.get("/api/workspaces");
  const wsBody = await wsRes.json();
  const wsId = wsBody.data[0].id;

  const projRes = await page.request.get(`/api/projects?workspaceId=${wsId}`);
  const projBody = await projRes.json();
  const projId = projBody.data[0].id;

  // 3. 创建新 task（TODO 状态），然后修改状态
  const createRes = await page.request.post("/api/tasks", {
    data: { projectId: projId, title: "Status test" },
  });
  expect(createRes.status()).toBe(201);
  const taskId = (await createRes.json()).data.id;

  const res = await page.request.patch(`/api/tasks/${taskId}/status`, {
    data: { status: "IN_PROGRESS" },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.data.status).toBe("IN_PROGRESS");
});

test("task with empty title is rejected", async ({ request }) => {
  // 先登录获取 session
  const loginRes = await request.post("/api/auth/login", {
    data: { email: "alice@test.com", password: "password123" },
  });
  expect(loginRes.status()).toBe(200);

  // 找一个 projectId
  const wsRes = await request.get("/api/workspaces");
  const wsBody = await wsRes.json();
  const wsId = wsBody.data[0].id;

  const projRes = await request.get(`/api/projects?workspaceId=${wsId}`);
  const projBody = await projRes.json();
  const projId = projBody.data[0].id;

  // 空 title 应该被拒绝
  const res = await request.post("/api/tasks", {
    data: { projectId: projId, title: "" },
  });
  expect(res.status()).toBe(400);
});
