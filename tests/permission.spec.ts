import { test, expect } from "@playwright/test";

test("member cannot delete another user's task", async ({ browser, request }) => {
  // alice (OWNER) logs in and creates a task
  const loginAlice = await request.post("/api/auth/login", {
    data: { email: "alice@test.com", password: "password123" },
  });
  expect(loginAlice.status()).toBe(200);

  // find a project
  const wsRes = await request.get("/api/workspaces");
  const wsBody = await wsRes.json();
  const wsId = wsBody.data[0].id;

  const projRes = await request.get(`/api/projects?workspaceId=${wsId}`);
  const projBody = await projRes.json();
  const projId = projBody.data[0].id;

  // create a task
  const taskRes = await request.post("/api/tasks", {
    data: { projectId: projId, title: "Task to protect" },
  });
  expect(taskRes.status()).toBe(201);
  const taskId = (await taskRes.json()).data.id;

  // bob (separate context) attempts to delete
  const bobCtx = await browser.newContext();
  const bobReq = bobCtx.request;

  // bob logs in
  const loginBob = await bobReq.post("/api/auth/login", {
    data: { email: "bob@test.com", password: "password123" },
  });
  expect(loginBob.status()).toBe(200);

  // bob attempts to delete alice's task
  const deleteRes = await bobReq.delete(`/api/tasks/${taskId}`);
  expect(deleteRes.status()).toBe(403);

  await bobCtx.close();
});

test("viewer cannot create task", async ({ browser, request }) => {
  // alice (OWNER) logs in, gets workspace + project
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

  // register a viewer user (separate context for cookie isolation)
  const viewerCtx = await browser.newContext();
  const viewerReq = viewerCtx.request;

  const viewerEmail = `viewer-${Date.now()}@example.com`;
  const regRes = await viewerReq.post("/api/auth/register", {
    data: { name: "Viewer User", email: viewerEmail, password: "password123" },
  });
  expect(regRes.status()).toBe(201);

  // alice adds viewer as a VIEWER role member
  const addRes = await request.post(`/api/workspaces/${wsId}/members`, {
    data: { email: viewerEmail, role: "VIEWER" },
  });
  expect(addRes.status()).toBe(201);

  // viewer tries to create a task — VIEWER permission blocks with 403
  const taskRes = await viewerReq.post("/api/tasks", {
    data: { projectId: projId, title: "Should be rejected" },
  });
  expect(taskRes.status()).toBe(403);

  await viewerCtx.close();
});

test("OWNER can delete any task regardless of creator", async ({ browser, request }) => {
  // alice (OWNER) login
  await request.post("/api/auth/login", {
    data: { email: "alice@test.com", password: "password123" },
  });

  const wsRes = await request.get("/api/workspaces");
  const wsId = (await wsRes.json()).data[0].id;
  const projRes = await request.get(`/api/projects?workspaceId=${wsId}`);
  const projId = (await projRes.json()).data[0].id;

  // bob (MEMBER) creates a task via his own context
  const bobCtx = await browser.newContext();
  const bobReq = bobCtx.request;
  await bobReq.post("/api/auth/login", {
    data: { email: "bob@test.com", password: "password123" },
  });

  const taskRes = await bobReq.post("/api/tasks", {
    data: { projectId: projId, title: "Bob's task" },
  });
  expect(taskRes.status()).toBe(201);
  const taskId = (await taskRes.json()).data.id;
  await bobCtx.close();

  // alice (OWNER) deletes bob's task — OWNER can delete any task
  const deleteRes = await request.delete(`/api/tasks/${taskId}`);
  expect(deleteRes.status()).toBe(200);
});

test("invalid page param does not return 500", async ({ request }) => {
  await request.post("/api/auth/login", {
    data: { email: "alice@test.com", password: "password123" },
  });

  const res = await request.get("/api/tasks?page=-1");
  expect(res.status()).not.toBe(500);
});

test("very large page returns empty list", async ({ request }) => {
  await request.post("/api/auth/login", {
    data: { email: "alice@test.com", password: "password123" },
  });

  const res = await request.get("/api/tasks?page=99999");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.data.items.length).toBe(0);
});
