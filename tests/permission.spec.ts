import { test, expect } from "@playwright/test";

test("member cannot delete another user's task", async ({ browser, request }) => {
  // 1. alice（OWNER）登录并创建 task
  const loginAlice = await request.post("/api/auth/login", {
    data: { email: "alice@test.com", password: "password123" },
  });
  expect(loginAlice.status()).toBe(200);

  // 找一个 project
  const wsRes = await request.get("/api/workspaces");
  const wsBody = await wsRes.json();
  const wsId = wsBody.data[0].id;

  const projRes = await request.get(`/api/projects?workspaceId=${wsId}`);
  const projBody = await projRes.json();
  const projId = projBody.data[0].id;

  // 创建 task
  const taskRes = await request.post("/api/tasks", {
    data: { projectId: projId, title: "Task to protect" },
  });
  expect(taskRes.status()).toBe(201);
  const taskId = (await taskRes.json()).data.id;

  // 2. 用 bob 的独立 context 尝试删除
  const bobCtx = await browser.newContext();
  const bobReq = bobCtx.request;

  // bob 登录
  const loginBob = await bobReq.post("/api/auth/login", {
    data: { email: "bob@test.com", password: "password123" },
  });
  expect(loginBob.status()).toBe(200);

  // bob 尝试删除 alice 的 task
  const deleteRes = await bobReq.delete(`/api/tasks/${taskId}`);
  expect(deleteRes.status()).toBe(403);

  await bobCtx.close();
});

test("viewer cannot create task", async ({ browser, request }) => {
  // 1. alice（OWNER）登录 → 获取 workspace + project
  const loginAlice = await request.post("/api/auth/login", {
    data: { email: "alice@test.com", password: "password123" },
  });
  expect(loginAlice.status()).toBe(200);

  const wsRes = await request.get("/api/workspaces");
  const wsBody = await wsRes.json();
  const wsId = wsBody.data[0].id;

  const projRes = await request.get(`/api/projects?workspaceId=${wsId}`);
  const projBody = await projRes.json();
  const projId = projBody.data[0].id;

  // 2. 注册 viewer 用户（使用独立 context 以隔离 cookie）
  const viewerCtx = await browser.newContext();
  const viewerReq = viewerCtx.request;

  const viewerEmail = `viewer-${Date.now()}@example.com`;
  const regRes = await viewerReq.post("/api/auth/register", {
    data: { name: "Viewer User", email: viewerEmail, password: "password123" },
  });
  expect(regRes.status()).toBe(201);

  // 3. alice 将 viewer 添加为 VIEWER 角色
  const addRes = await request.post(`/api/workspaces/${wsId}/members`, {
    data: { email: viewerEmail, role: "VIEWER" },
  });
  expect(addRes.status()).toBe(201);

  // 4. viewer 尝试在真实 project 下创建 task → 被 VIEWER 权限拦截返回 403
  const taskRes = await viewerReq.post("/api/tasks", {
    data: { projectId: projId, title: "Should be rejected" },
  });
  expect(taskRes.status()).toBe(403);

  await viewerCtx.close();
});
