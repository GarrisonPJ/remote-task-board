import { test, expect } from "@playwright/test";

const FLOW = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const;

test("task can flow through all valid statuses", async ({ request }) => {
  // 登录
  const loginRes = await request.post("/api/auth/login", {
    data: { email: "alice@test.com", password: "password123" },
  });
  expect(loginRes.status()).toBe(200);

  // 找 project
  const wsRes = await request.get("/api/workspaces");
  const wsId = wsRes.ok() ? (await wsRes.json()).data[0].id : null;

  const projRes = await request.get(`/api/projects?workspaceId=${wsId}`);
  const projId = projRes.ok() ? (await projRes.json()).data[0].id : null;

  // 创建 task
  const taskRes = await request.post("/api/tasks", {
    data: { projectId: projId, title: "Status flow test" },
  });
  expect(taskRes.status()).toBe(201);
  const taskId = (await taskRes.json()).data.id;

  // 逐步流转
  for (const status of FLOW.slice(1)) {
    const res = await request.patch(`/api/tasks/${taskId}/status`, {
      data: { status },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.status).toBe(status);
  }
});

test("cannot transition DONE directly to TODO", async ({ request }) => {
  const loginRes = await request.post("/api/auth/login", {
    data: { email: "alice@test.com", password: "password123" },
  });
  expect(loginRes.status()).toBe(200);

  // 找 project
  const wsRes = await request.get("/api/workspaces");
  const wsId = wsRes.ok() ? (await wsRes.json()).data[0].id : null;
  const projRes = await request.get(`/api/projects?workspaceId=${wsId}`);
  const projId = projRes.ok() ? (await projRes.json()).data[0].id : null;

  // 创建 task 并走到 DONE
  const taskRes = await request.post("/api/tasks", {
    data: { projectId: projId, title: "Illegal transition test" },
  });
  expect(taskRes.status()).toBe(201);
  const taskId = (await taskRes.json()).data.id;

  await request.patch(`/api/tasks/${taskId}/status`, {
    data: { status: "IN_PROGRESS" },
  });
  await request.patch(`/api/tasks/${taskId}/status`, {
    data: { status: "IN_REVIEW" },
  });
  const doneRes = await request.patch(`/api/tasks/${taskId}/status`, {
    data: { status: "DONE" },
  });
  expect(doneRes.status()).toBe(200);

  // 尝试 DONE → TODO（非法）
  const illegalRes = await request.patch(`/api/tasks/${taskId}/status`, {
    data: { status: "TODO" },
  });
  expect(illegalRes.status()).toBe(400);
  const body = await illegalRes.json();
  expect(body.error.code).toBe("INVALID_TRANSITION");
});

test("canceled task can be reopened", async ({ request }) => {
  const loginRes = await request.post("/api/auth/login", {
    data: { email: "alice@test.com", password: "password123" },
  });
  expect(loginRes.status()).toBe(200);

  // 找 project
  const wsRes = await request.get("/api/workspaces");
  const wsId = wsRes.ok() ? (await wsRes.json()).data[0].id : null;
  const projRes = await request.get(`/api/projects?workspaceId=${wsId}`);
  const projId = projRes.ok() ? (await projRes.json()).data[0].id : null;

  // 创建 task
  const taskRes = await request.post("/api/tasks", {
    data: { projectId: projId, title: "Cancel and reopen" },
  });
  expect(taskRes.status()).toBe(201);
  const taskId = (await taskRes.json()).data.id;

  // TODO → CANCELED
  const cancelRes = await request.patch(`/api/tasks/${taskId}/status`, {
    data: { status: "CANCELED" },
  });
  expect(cancelRes.status()).toBe(200);
  expect((await cancelRes.json()).data.status).toBe("CANCELED");

  // CANCELED → TODO
  const reopenRes = await request.patch(`/api/tasks/${taskId}/status`, {
    data: { status: "TODO" },
  });
  expect(reopenRes.status()).toBe(200);
  expect((await reopenRes.json()).data.status).toBe("TODO");
});
