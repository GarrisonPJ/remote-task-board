import { test, expect } from "@playwright/test";

test.describe("Authorization", () => {
  const PROTECTED_ENDPOINTS: { url: string; method: string }[] = [
    { url: "/api/workspaces", method: "GET" },
    { url: "/api/workspaces", method: "POST" },
    { url: "/api/projects", method: "GET" },
    { url: "/api/projects", method: "POST" },
    { url: "/api/tasks", method: "GET" },
    { url: "/api/tasks", method: "POST" },
  ];

  test("unauthenticated user gets 401 on protected endpoints", async ({ request }) => {
    for (const { url, method } of PROTECTED_ENDPOINTS) {
      const res = await request.fetch(url, { method });
      expect(res.status(), `${method} ${url} should return 401`).toBe(401);
    }
  });

  test("non-member gets 404 on workspace-scoped resource", async ({ browser }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const reqA = ctxA.request;
    const reqB = ctxB.request;

    // User A registers and creates a workspace
    const emailA = `user-a-${Date.now()}@example.com`;
    const regA = await reqA.post("/api/auth/register", {
      data: { name: "User A", email: emailA, password: "password123" },
    });
    expect(regA.status()).toBe(201);

    const loginA = await reqA.post("/api/auth/login", {
      data: { email: emailA, password: "password123" },
    });
    expect(loginA.status()).toBe(200);

    const wsRes = await reqA.post("/api/workspaces", {
      data: { name: "A's Workspace" },
    });
    expect(wsRes.status()).toBe(201);
    const wsId = (await wsRes.json()).data.id;

    // User B registers (independent user, no access to A's workspace)
    const emailB = `user-b-${Date.now()}@example.com`;
    const regB = await reqB.post("/api/auth/register", {
      data: { name: "User B", email: emailB, password: "password123" },
    });
    expect(regB.status()).toBe(201);

    const loginB = await reqB.post("/api/auth/login", {
      data: { email: emailB, password: "password123" },
    });
    expect(loginB.status()).toBe(200);

    // User B tries to access User A's workspace — should get 404 (not 403)
    const wsGetRes = await reqB.get(`/api/workspaces/${wsId}`);
    expect(wsGetRes.status()).toBe(404);

    const projListRes = await reqB.get(`/api/projects?workspaceId=${wsId}`);
    expect(projListRes.status()).toBe(404);

    await ctxA.close();
    await ctxB.close();
  });

  test("member cannot delete another user's task", async ({ browser, request }) => {
    // alice (OWNER) logs in via shared request fixture
    const loginAlice = await request.post("/api/auth/login", {
      data: { email: "alice@test.com", password: "password123" },
    });
    expect(loginAlice.status()).toBe(200);

    // Get seed workspace and project
    const wsRes = await request.get("/api/workspaces");
    const wsBody = await wsRes.json();
    const wsId = wsBody.data[0].id;

    const projRes = await request.get(`/api/projects?workspaceId=${wsId}`);
    const projBody = await projRes.json();
    const projId = projBody.data[0].id;

    // alice creates a task
    const taskRes = await request.post("/api/tasks", {
      data: { projectId: projId, title: "Task to protect" },
    });
    expect(taskRes.status()).toBe(201);
    const taskId = (await taskRes.json()).data.id;

    // bob (MEMBER) logs in via isolated context
    const bobCtx = await browser.newContext();
    const bobReq = bobCtx.request;

    const loginBob = await bobReq.post("/api/auth/login", {
      data: { email: "bob@test.com", password: "password123" },
    });
    expect(loginBob.status()).toBe(200);

    // bob tries to delete alice's task — should be forbidden
    const deleteRes = await bobReq.delete(`/api/tasks/${taskId}`);
    expect(deleteRes.status()).toBe(403);

    await bobCtx.close();
  });
});

test.describe("Input Validation", () => {
  test("empty task title returns 400", async ({ request }) => {
    // alice logs in
    const loginRes = await request.post("/api/auth/login", {
      data: { email: "alice@test.com", password: "password123" },
    });
    expect(loginRes.status()).toBe(200);

    // Get workspace and project from seed data
    const wsRes = await request.get("/api/workspaces");
    const wsBody = await wsRes.json();
    const wsId = wsBody.data[0].id;

    const projRes = await request.get(`/api/projects?workspaceId=${wsId}`);
    const projBody = await projRes.json();
    const projId = projBody.data[0].id;

    // POST with empty title should fail validation
    const res = await request.post("/api/tasks", {
      data: { projectId: projId, title: "" },
    });
    expect(res.status()).toBe(400);

    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  test("invalid task status returns 400", async ({ request }) => {
    // alice logs in
    const loginRes = await request.post("/api/auth/login", {
      data: { email: "alice@test.com", password: "password123" },
    });
    expect(loginRes.status()).toBe(200);

    // Get workspace and project from seed data
    const wsRes = await request.get("/api/workspaces");
    const wsBody = await wsRes.json();
    const wsId = wsBody.data[0].id;

    const projRes = await request.get(`/api/projects?workspaceId=${wsId}`);
    const projBody = await projRes.json();
    const projId = projBody.data[0].id;

    // Create a valid task first
    const taskRes = await request.post("/api/tasks", {
      data: { projectId: projId, title: "Valid task" },
    });
    expect(taskRes.status()).toBe(201);
    const taskId = (await taskRes.json()).data.id;

    // PATCH with invalid status enum value
    const res = await request.patch(`/api/tasks/${taskId}/status`, {
      data: { status: "INVALID_STATUS" },
    });
    expect(res.status()).toBe(400);
  });

  test("register with invalid email format returns 400", async ({ request }) => {
    const res = await request.post("/api/auth/register", {
      data: { name: "Bad", email: "not-an-email", password: "password123" },
    });
    expect(res.status()).toBe(400);

    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
