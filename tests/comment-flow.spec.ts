import { test, expect } from "@playwright/test";

test.describe("Comment flow", () => {
  test("user can create and view comments on a task", async ({ request }) => {
    // login with seed account
    const loginRes = await request.post("/api/auth/login", {
      data: { email: "alice@test.com", password: "password123" },
    });
    expect(loginRes.status()).toBe(200);

    // get workspace + project
    const wsRes = await request.get("/api/workspaces");
    const wsBody = await wsRes.json();
    const wsId = wsBody.data[0].id;

    const projRes = await request.get(`/api/projects?workspaceId=${wsId}`);
    const projBody = await projRes.json();
    const projId = projBody.data[0].id;

    // create a task
    const taskRes = await request.post("/api/tasks", {
      data: { projectId: projId, title: "Comment test task" },
    });
    expect(taskRes.status()).toBe(201);
    const taskId = (await taskRes.json()).data.id;

    // add two comments
    const comment1Res = await request.post(`/api/tasks/${taskId}/comments`, {
      data: { content: "First comment" },
    });
    expect(comment1Res.status()).toBe(201);

    const comment2Res = await request.post(`/api/tasks/${taskId}/comments`, {
      data: { content: "Second comment" },
    });
    expect(comment2Res.status()).toBe(201);

    // list comments and verify both appear
    const listRes = await request.get(`/api/tasks/${taskId}/comments`);
    expect(listRes.status()).toBe(200);
    const listBody = await listRes.json();
    const contents = listBody.data.map((c: { content: string }) => c.content);
    expect(contents).toContain("First comment");
    expect(contents).toContain("Second comment");
  });

  test("empty comment content is rejected", async ({ request }) => {
    const loginRes = await request.post("/api/auth/login", {
      data: { email: "alice@test.com", password: "password123" },
    });
    expect(loginRes.status()).toBe(200);

    const wsRes = await request.get("/api/workspaces");
    const wsId = (await wsRes.json()).data[0].id;
    const projRes = await request.get(`/api/projects?workspaceId=${wsId}`);
    const projId = (await projRes.json()).data[0].id;

    const taskRes = await request.post("/api/tasks", {
      data: { projectId: projId, title: "Empty comment test" },
    });
    expect(taskRes.status()).toBe(201);
    const taskId = (await taskRes.json()).data.id;

    const res = await request.post(`/api/tasks/${taskId}/comments`, {
      data: { content: "" },
    });
    expect(res.status()).toBe(400);
  });

  test("unauthenticated user cannot list comments", async ({ request }) => {
    const res = await request.get("/api/tasks/some-task-id/comments");
    expect(res.status()).toBe(401);
  });
});
