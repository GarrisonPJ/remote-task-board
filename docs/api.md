# API Reference

Base URL: `https://your-domain.com` (or `http://localhost:3000` for local development)

---

## Response Format

All endpoints use a unified response envelope:

```json
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message.",
    "details": [ ... ]
  }
}
```

### Error Codes

| Status | Code                    | Description                                          |
|--------|-------------------------|------------------------------------------------------|
| 400    | `VALIDATION_ERROR`      | Request body or query failed zod validation.         |
| 400    | `INVALID_TRANSITION`    | Task status transition is not allowed by state machine. |
| 400    | `INVALID_ASSIGNEE`      | Task assignee is not a member of the owning workspace. |
| 400    | `LAST_OWNER`            | Cannot remove the last OWNER from a workspace.       |
| 401    | `UNAUTHORIZED`          | No valid session cookie (not logged in).             |
| 403    | `FORBIDDEN`             | Authenticated but insufficient role/permission.      |
| 404    | `NOT_FOUND`             | Requested resource does not exist.                   |
| 409    | `EMAIL_TAKEN`           | Email already registered (register only).            |
| 502    | `AI_PARSE_FAILED`       | AI provider returned an empty or invalid parse result. |
| 503    | `AI_NOT_CONFIGURED`     | AI task creation is unavailable because `DEEPSEEK_API_KEY` is not configured. |
| 500    | `INTERNAL_SERVER_ERROR` | Unexpected server error.                             |

### Authentication

Session-based auth. A `session_id` httpOnly cookie is set on register/login and cleared on logout. All endpoints except `POST /api/auth/register` and `POST /api/auth/login` require a valid session cookie.

---

## Auth

### POST /api/auth/register

Create a new user account, create a session, and set the session cookie.

**Auth:** None

**Request Body:**

```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "securePass123"
}
```

**Success Response** `201 Created`:

```json
{
  "success": true,
  "data": {
    "id": "cm7abcdef123",
    "name": "Alice",
    "email": "alice@example.com"
  }
}
```

Sets `session_id` httpOnly cookie (7-day expiry).

**Error Codes:** `VALIDATION_ERROR` (400), `EMAIL_TAKEN` (409), `INTERNAL_SERVER_ERROR` (500)

---

### POST /api/auth/login

Verify credentials, create a session, and set the session cookie.

**Auth:** None

**Request Body:**

```json
{
  "email": "alice@example.com",
  "password": "securePass123"
}
```

**Success Response** `200 OK`:

```json
{
  "success": true,
  "data": {
    "id": "cm7abcdef123",
    "name": "Alice",
    "email": "alice@example.com"
  }
}
```

Sets `session_id` httpOnly cookie (7-day expiry).

**Error Codes:** `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401 -- invalid credentials), `INTERNAL_SERVER_ERROR` (500)

---

### POST /api/auth/logout

Delete the current session and clear the session cookie.

**Auth:** Required

**Request Body:** None

**Success Response** `200 OK`:

```json
{
  "success": true,
  "data": null
}
```

Clears the `session_id` cookie.

**Error Codes:** `UNAUTHORIZED` (401), `INTERNAL_SERVER_ERROR` (500)

---

### GET /api/auth/me

Return the currently authenticated user from the session cookie.

**Auth:** Required

**Request Body:** None

**Success Response** `200 OK`:

```json
{
  "success": true,
  "data": {
    "id": "cm7abcdef123",
    "name": "Alice",
    "email": "alice@example.com"
  }
}
```

**Error Codes:** `UNAUTHORIZED` (401), `INTERNAL_SERVER_ERROR` (500)

---

## Workspaces

### GET /api/workspaces

List workspaces the current user is a member of.

**Auth:** Required

**Query Parameters:** None

**Success Response** `200 OK`:

```json
{
  "success": true,
  "data": [
    {
      "id": "ws1abcdef123",
      "name": "My Team",
      "role": "OWNER",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z"
    },
    {
      "id": "ws2abcdef456",
      "name": "Design Guild",
      "role": "MEMBER",
      "createdAt": "2025-02-01T08:30:00.000Z",
      "updatedAt": "2025-02-01T08:30:00.000Z"
    }
  ]
}
```

**Error Codes:** `UNAUTHORIZED` (401), `INTERNAL_SERVER_ERROR` (500)

---

### POST /api/workspaces

Create a new workspace. The creator is automatically added as an `OWNER`.

**Auth:** Required

**Request Body:**

```json
{
  "name": "My Team"
}
```

**Success Response** `201 Created`:

```json
{
  "success": true,
  "data": {
    "id": "ws1abcdef123",
    "name": "My Team",
    "role": "OWNER",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

**Error Codes:** `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `INTERNAL_SERVER_ERROR` (500)

---

### GET /api/workspaces/[workspaceId]

Get details of a specific workspace.

**Auth:** Required (must be a member of the workspace)

**Path Parameters:**

| Parameter     | Type   | Description              |
|---------------|--------|--------------------------|
| `workspaceId` | string | ID of the workspace      |

**Success Response** `200 OK`:

```json
{
  "success": true,
  "data": {
    "id": "ws1abcdef123",
    "name": "My Team",
    "role": "OWNER",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

**Error Codes:** `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `INTERNAL_SERVER_ERROR` (500)

---

### PATCH /api/workspaces/[workspaceId]

Update workspace name.

**Auth:** Required (OWNER only)

**Path Parameters:**

| Parameter     | Type   | Description              |
|---------------|--------|--------------------------|
| `workspaceId` | string | ID of the workspace      |

**Request Body:**

```json
{
  "name": "Renamed Team"
}
```

**Success Response** `200 OK`:

```json
{
  "success": true,
  "data": {
    "id": "ws1abcdef123",
    "name": "Renamed Team",
    "role": "OWNER",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-16T12:00:00.000Z"
  }
}
```

**Error Codes:** `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `INTERNAL_SERVER_ERROR` (500)

---

### DELETE /api/workspaces/[workspaceId]

Delete a workspace and all its data (projects, tasks, activity logs cascade).

**Auth:** Required (OWNER only)

**Path Parameters:**

| Parameter     | Type   | Description              |
|---------------|--------|--------------------------|
| `workspaceId` | string | ID of the workspace      |

**Success Response** `200 OK`:

```json
{
  "success": true,
  "data": null
}
```

**Error Codes:** `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `INTERNAL_SERVER_ERROR` (500)

---

## Workspace Members

### GET /api/workspaces/[workspaceId]/members

List all members of a workspace.

**Auth:** Required (must be a member of the workspace)

**Path Parameters:**

| Parameter     | Type   | Description              |
|---------------|--------|--------------------------|
| `workspaceId` | string | ID of the workspace      |

**Success Response** `200 OK`:

```json
{
  "success": true,
  "data": [
    {
      "id": "mem1abcdef123",
      "userId": "cm7abcdef123",
      "user": {
        "id": "cm7abcdef123",
        "name": "Alice",
        "email": "alice@example.com"
      },
      "role": "OWNER",
      "createdAt": "2025-01-15T10:00:00.000Z"
    },
    {
      "id": "mem2abcdef456",
      "userId": "cm7xyz789",
      "user": {
        "id": "cm7xyz789",
        "name": "Bob",
        "email": "bob@example.com"
      },
      "role": "MEMBER",
      "createdAt": "2025-02-01T08:30:00.000Z"
    }
  ]
}
```

**Error Codes:** `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `INTERNAL_SERVER_ERROR` (500)

---

### POST /api/workspaces/[workspaceId]/members

Add a new member to the workspace by email.

**Auth:** Required (OWNER only)

**Path Parameters:**

| Parameter     | Type   | Description              |
|---------------|--------|--------------------------|
| `workspaceId` | string | ID of the workspace      |

**Request Body:**

```json
{
  "email": "bob@example.com",
  "role": "MEMBER"
}
```

`role` can be `"MEMBER"` or `"VIEWER"`.

**Success Response** `201 Created`:

```json
{
  "success": true,
  "data": null
}
```

**Error Codes:** `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `INTERNAL_SERVER_ERROR` (500)

---

### DELETE /api/workspaces/[workspaceId]/members/[memberId]

Remove a member from the workspace.

**Auth:** Required (OWNER only)

**Path Parameters:**

| Parameter     | Type   | Description                |
|---------------|--------|----------------------------|
| `workspaceId` | string | ID of the workspace        |
| `memberId`    | string | ID of the member to remove |

**Success Response** `200 OK`:

```json
{
  "success": true,
  "data": null
}
```

**Error Codes:** `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `LAST_OWNER` (400), `INTERNAL_SERVER_ERROR` (500)

---

## Projects

### GET /api/projects

List projects in a workspace.

**Auth:** Required (must be a member of the workspace)

**Query Parameters:**

| Parameter     | Type   | Required | Description              |
|---------------|--------|----------|--------------------------|
| `workspaceId` | string | Yes      | ID of the workspace      |

**Success Response** `200 OK`:

```json
{
  "success": true,
  "data": [
    {
      "id": "proj1abcdef123",
      "workspaceId": "ws1abcdef123",
      "name": "Sprint 24",
      "description": "Tasks for the current sprint",
      "createdAt": "2025-01-20T09:00:00.000Z",
      "updatedAt": "2025-01-20T09:00:00.000Z"
    },
    {
      "id": "proj2abcdef456",
      "workspaceId": "ws1abcdef123",
      "name": "Backlog",
      "description": null,
      "createdAt": "2025-01-20T09:00:00.000Z",
      "updatedAt": "2025-01-20T09:00:00.000Z"
    }
  ]
}
```

If `workspaceId` is missing, returns an empty array.

**Error Codes:** `UNAUTHORIZED` (401), `FORBIDDEN` (403), `INTERNAL_SERVER_ERROR` (500)

---

### POST /api/projects

Create a new project within a workspace.

**Auth:** Required (must be a MEMBER or OWNER of the workspace)

**Request Body:**

```json
{
  "workspaceId": "ws1abcdef123",
  "name": "Sprint 24",
  "description": "Tasks for the current sprint"
}
```

`description` is optional.

**Success Response** `201 Created`:

```json
{
  "success": true,
  "data": {
    "id": "proj1abcdef123",
    "workspaceId": "ws1abcdef123",
    "name": "Sprint 24",
    "description": "Tasks for the current sprint",
    "createdAt": "2025-01-20T09:00:00.000Z",
    "updatedAt": "2025-01-20T09:00:00.000Z"
  }
}
```

**Error Codes:** `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `INTERNAL_SERVER_ERROR` (500)

---

### GET /api/projects/[projectId]

Get details of a specific project.

**Auth:** Required (must be a member of the owning workspace)

**Path Parameters:**

| Parameter   | Type   | Description            |
|-------------|--------|------------------------|
| `projectId` | string | ID of the project      |

**Success Response** `200 OK`:

```json
{
  "success": true,
  "data": {
    "id": "proj1abcdef123",
    "workspaceId": "ws1abcdef123",
    "name": "Sprint 24",
    "description": "Tasks for the current sprint",
    "createdAt": "2025-01-20T09:00:00.000Z",
    "updatedAt": "2025-01-20T09:00:00.000Z"
  }
}
```

**Error Codes:** `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `INTERNAL_SERVER_ERROR` (500)

---

### PATCH /api/projects/[projectId]

Update project fields.

**Auth:** Required (must be a MEMBER or OWNER of the owning workspace)

**Path Parameters:**

| Parameter   | Type   | Description            |
|-------------|--------|------------------------|
| `projectId` | string | ID of the project      |

**Request Body:**

```json
{
  "name": "Updated Sprint Name",
  "description": "New description"
}
```

Both fields are optional -- only provided fields are updated.

**Success Response** `200 OK`:

```json
{
  "success": true,
  "data": {
    "id": "proj1abcdef123",
    "workspaceId": "ws1abcdef123",
    "name": "Updated Sprint Name",
    "description": "New description",
    "createdAt": "2025-01-20T09:00:00.000Z",
    "updatedAt": "2025-01-21T14:00:00.000Z"
  }
}
```

**Error Codes:** `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `INTERNAL_SERVER_ERROR` (500)

---

### DELETE /api/projects/[projectId]

Delete a project and all its tasks (cascade).

**Auth:** Required (OWNER of the owning workspace only)

**Path Parameters:**

| Parameter   | Type   | Description            |
|-------------|--------|------------------------|
| `projectId` | string | ID of the project      |

**Success Response** `200 OK`:

```json
{
  "success": true,
  "data": null
}
```

**Error Codes:** `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `INTERNAL_SERVER_ERROR` (500)

---

## Tasks

### GET /api/tasks

List tasks with optional filtering, search, and pagination.

**Auth:** Required (must be a member of the owning workspace)

**Query Parameters:**

| Parameter     | Type   | Required | Default | Description                                      |
|---------------|--------|----------|---------|--------------------------------------------------|
| `workspaceId` | string | No       | --      | Filter by workspace                              |
| `projectId`   | string | No       | --      | Filter by project                                |
| `status`      | string | No       | --      | Filter by status (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`, `CANCELED`) |
| `priority`    | string | No       | --      | Filter by priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) |
| `q`           | string | No       | --      | Search by title (case-insensitive contains)      |
| `page`        | number | No       | `1`     | Page number                                      |
| `pageSize`    | number | No       | `20`    | Items per page                                   |

**Success Response** `200 OK`:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "task1abcdef123",
        "projectId": "proj1abcdef123",
        "title": "Fix login bug",
        "description": "Users cannot log in with special characters in password",
        "status": "IN_PROGRESS",
        "priority": "HIGH",
        "creatorId": "cm7abcdef123",
        "assignee": {
          "id": "cm7xyz789",
          "name": "Bob",
          "email": "bob@example.com"
        },
        "dueDate": "2025-02-01T00:00:00.000Z",
        "createdAt": "2025-01-22T10:00:00.000Z",
        "updatedAt": "2025-01-23T15:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "pageSize": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

**Error Codes:** `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `INTERNAL_SERVER_ERROR` (500)

---

### POST /api/tasks

Create a new task.

**Auth:** Required (must be a MEMBER or OWNER of the owning workspace)

**Request Body:**

```json
{
  "projectId": "proj1abcdef123",
  "title": "Fix login bug",
  "description": "Users cannot log in with special characters in password",
  "priority": "HIGH",
  "assigneeId": "cm7xyz789",
  "dueDate": "2025-02-01"
}
```

Only `projectId` and `title` are required; all other fields are optional. `dueDate` accepts either `YYYY-MM-DD` from date inputs or a full ISO datetime. Responses always return ISO datetime strings.

**Success Response** `201 Created`:

```json
{
  "success": true,
  "data": {
    "id": "task1abcdef123",
    "projectId": "proj1abcdef123",
    "title": "Fix login bug",
    "description": "Users cannot log in with special characters in password",
    "status": "TODO",
    "priority": "HIGH",
    "creatorId": "cm7abcdef123",
    "assignee": {
      "id": "cm7xyz789",
      "name": "Bob",
      "email": "bob@example.com"
    },
    "dueDate": "2025-02-01T00:00:00.000Z",
    "createdAt": "2025-01-22T10:00:00.000Z",
    "updatedAt": "2025-01-22T10:00:00.000Z"
  }
}
```

**Error Codes:** `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `INTERNAL_SERVER_ERROR` (500)

---

### GET /api/tasks/[taskId]

Get a single task with its activity log timeline.

**Auth:** Required (must be a member of the owning workspace)

**Path Parameters:**

| Parameter | Type   | Description        |
|-----------|--------|--------------------|
| `taskId`  | string | ID of the task     |

**Success Response** `200 OK`:

```json
{
  "success": true,
  "data": {
    "id": "task1abcdef123",
    "projectId": "proj1abcdef123",
    "title": "Fix login bug",
    "description": "Users cannot log in with special characters in password",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "creatorId": "cm7abcdef123",
    "assignee": {
      "id": "cm7xyz789",
      "name": "Bob",
      "email": "bob@example.com"
    },
    "dueDate": "2025-02-01T00:00:00.000Z",
    "activityLogs": [
      {
        "id": "log1abcdef123",
        "taskId": "task1abcdef123",
        "actor": {
          "id": "cm7abcdef123",
          "name": "Alice",
          "email": "alice@example.com"
        },
        "fromStatus": "TODO",
        "toStatus": "IN_PROGRESS",
        "createdAt": "2025-01-23T09:00:00.000Z"
      }
    ],
    "createdAt": "2025-01-22T10:00:00.000Z",
    "updatedAt": "2025-01-23T09:00:00.000Z"
  }
}
```

**Error Codes:** `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `INTERNAL_SERVER_ERROR` (500)

---

### PATCH /api/tasks/[taskId]

Update task fields. Only provided fields are changed.

**Auth:** Required (must be a MEMBER or OWNER of the owning workspace)

**Path Parameters:**

| Parameter | Type   | Description        |
|-----------|--------|--------------------|
| `taskId`  | string | ID of the task     |

**Request Body:**

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "priority": "MEDIUM",
  "assigneeId": "cm7abcdef123",
  "dueDate": "2025-02-15"
}
```

All fields are optional. To clear assignee or due date, pass `assigneeId: null` or `dueDate: null`. `dueDate` accepts either `YYYY-MM-DD` from date inputs or a full ISO datetime.

**Success Response** `200 OK`:

```json
{
  "success": true,
  "data": {
    "id": "task1abcdef123",
    "projectId": "proj1abcdef123",
    "title": "Updated title",
    "description": "Updated description",
    "status": "IN_PROGRESS",
    "priority": "MEDIUM",
    "creatorId": "cm7abcdef123",
    "assignee": {
      "id": "cm7abcdef123",
      "name": "Alice",
      "email": "alice@example.com"
    },
    "dueDate": "2025-02-15T00:00:00.000Z",
    "createdAt": "2025-01-22T10:00:00.000Z",
    "updatedAt": "2025-01-24T08:00:00.000Z"
  }
}
```

**Error Codes:** `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `INTERNAL_SERVER_ERROR` (500)

---

### DELETE /api/tasks/[taskId]

Delete a task.

**Auth:** Required (OWNER can delete any task in workspace; MEMBER can only delete their own created tasks)

**Path Parameters:**

| Parameter | Type   | Description        |
|-----------|--------|--------------------|
| `taskId`  | string | ID of the task     |

**Success Response** `200 OK`:

```json
{
  "success": true,
  "data": null
}
```

**Error Codes:** `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `INTERNAL_SERVER_ERROR` (500)

---

### PATCH /api/tasks/[taskId]/status

Update task status via state machine. Creates an `ActivityLog` entry atomically within a Prisma transaction.

**Auth:** Required (OWNER or task assignee)

**Path Parameters:**

| Parameter | Type   | Description        |
|-----------|--------|--------------------|
| `taskId`  | string | ID of the task     |

**Request Body:**

```json
{
  "status": "IN_PROGRESS"
}
```

**Valid Transitions:**

| From        | To                      |
|-------------|-------------------------|
| `TODO`      | `IN_PROGRESS`, `CANCELED` |
| `IN_PROGRESS` | `IN_REVIEW`, `TODO`, `CANCELED` |
| `IN_REVIEW` | `DONE`, `IN_PROGRESS`, `CANCELED` |
| `DONE`      | `IN_REVIEW`             |
| `CANCELED`  | `TODO` (reopen)         |

**Success Response** `200 OK`:

```json
{
  "success": true,
  "data": {
    "id": "task1abcdef123",
    "projectId": "proj1abcdef123",
    "title": "Fix login bug",
    "description": "Users cannot log in with special characters in password",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "creatorId": "cm7abcdef123",
    "assignee": {
      "id": "cm7xyz789",
      "name": "Bob",
      "email": "bob@example.com"
    },
    "dueDate": "2025-02-01T00:00:00.000Z",
    "createdAt": "2025-01-22T10:00:00.000Z",
    "updatedAt": "2025-01-23T09:00:00.000Z"
  }
}
```

The response includes the updated task (without activity logs). The `ActivityLog` is persisted in the same database transaction.

**Error Codes:** `VALIDATION_ERROR` (400), `INVALID_TRANSITION` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `INTERNAL_SERVER_ERROR` (500)

---

### GET /api/tasks/[taskId]/comments

List comments for a task.

**Auth:** Required (must be a member of the owning workspace)

**Success Response** `200 OK`:

```json
{
  "success": true,
  "data": [
    {
      "id": "comment1abcdef123",
      "taskId": "task1abcdef123",
      "user": {
        "id": "cm7abcdef123",
        "name": "Alice",
        "email": "alice@example.com"
      },
      "content": "I can reproduce this on staging.",
      "createdAt": "2025-01-23T09:15:00.000Z"
    }
  ]
}
```

**Error Codes:** `UNAUTHORIZED` (401), `NOT_FOUND` (404), `INTERNAL_SERVER_ERROR` (500)

---

### POST /api/tasks/[taskId]/comments

Create a task comment.

**Auth:** Required (OWNER or MEMBER of the owning workspace; VIEWER can read comments but cannot create them)

**Request Body:**

```json
{
  "content": "I can reproduce this on staging."
}
```

**Success Response** `201 Created`:

```json
{
  "success": true,
  "data": {
    "id": "comment1abcdef123",
    "taskId": "task1abcdef123",
    "user": {
      "id": "cm7abcdef123",
      "name": "Alice",
      "email": "alice@example.com"
    },
    "content": "I can reproduce this on staging.",
    "createdAt": "2025-01-23T09:15:00.000Z"
  }
}
```

**Error Codes:** `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `INTERNAL_SERVER_ERROR` (500)

---

## Activity

### GET /api/activity

Return the 50 most recent activity log entries across all workspaces the authenticated user belongs to.

**Auth:** Required (OWNER role — only OWNERs can view activity logs)

**Success Response** `200 OK`:

```json
{
  "success": true,
  "data": [
    {
      "id": "log1abcdef123",
      "taskId": "task1abcdef123",
      "taskTitle": "Fix login bug",
      "actor": {
        "id": "cm7abcdef123",
        "name": "Alice",
        "email": "alice@example.com"
      },
      "action": "STATUS_CHANGED",
      "fromStatus": "TODO",
      "toStatus": "IN_PROGRESS",
      "details": null,
      "createdAt": "2025-01-23T09:00:00.000Z"
    }
  ]
}
```

`action` can be `"CREATED"`, `"UPDATED"`, `"DELETED"`, or `"STATUS_CHANGED"`. Deleted task entries return `taskTitle` but no link.

**Error Codes:** `UNAUTHORIZED` (401), `INTERNAL_SERVER_ERROR` (500)

---

## AI

### POST /api/ai/parse-task

Parse a natural-language task description into task fields. This endpoint requires `DEEPSEEK_API_KEY`; when the key is missing, the UI hides the AI create button and the API returns `AI_NOT_CONFIGURED`.

**Auth:** Required

**Request Body:**

```json
{
  "text": "Fix the login timeout bug, high priority, due next Friday",
  "projectId": "proj1abcdef123"
}
```

**Success Response** `200 OK`:

```json
{
  "success": true,
  "data": {
    "title": "Fix login timeout bug",
    "description": null,
    "priority": "HIGH",
    "dueDate": "2025-02-01"
  }
}
```

`dueDate` is returned as a date input value (`YYYY-MM-DD`) when the AI can infer a deadline.

**Error Codes:** `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `AI_PARSE_FAILED` (502), `AI_NOT_CONFIGURED` (503), `INTERNAL_SERVER_ERROR` (500)

---

## DTO Types

### UserDTO

```json
{
  "id": "string",
  "name": "string",
  "email": "string"
}
```

### WorkspaceDTO

```json
{
  "id": "string",
  "name": "string",
  "role": "OWNER" | "MEMBER" | "VIEWER",
  "createdAt": "ISO 8601 string",
  "updatedAt": "ISO 8601 string"
}
```

### ProjectDTO

```json
{
  "id": "string",
  "workspaceId": "string",
  "name": "string",
  "description": "string | null",
  "createdAt": "ISO 8601 string",
  "updatedAt": "ISO 8601 string"
}
```

### TaskDTO

```json
{
  "id": "string",
  "projectId": "string",
  "title": "string",
  "description": "string | null",
  "status": "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELED",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "creatorId": "string",
  "assignee": "UserDTO | null",
  "dueDate": "ISO 8601 string | null",
  "activityLogs": "ActivityLogDTO[] | null",
  "createdAt": "ISO 8601 string",
  "updatedAt": "ISO 8601 string"
}
```

### ActivityLogDTO

```json
{
  "id": "string",
  "taskId": "string",
  "actor": "UserDTO",
  "fromStatus": "string",
  "toStatus": "string",
  "createdAt": "ISO 8601 string"
}
```

### CommentDTO

```json
{
  "id": "string",
  "taskId": "string",
  "user": "UserDTO",
  "content": "string",
  "createdAt": "ISO 8601 string"
}
```

---

## Permission Matrix

| Action                                   | OWNER | MEMBER | VIEWER | Task Creator | Task Assignee |
|------------------------------------------|-------|--------|--------|--------------|---------------|
| Create workspace                         | Yes   | Yes    | Yes    | --           | --            |
| Update workspace name                    | Yes   | --     | --     | --           | --            |
| Delete workspace                         | Yes   | --     | --     | --           | --            |
| Add/remove workspace members             | Yes   | --     | --     | --           | --            |
| Create project                           | Yes   | Yes    | --     | --           | --            |
| Update project                           | Yes   | Yes    | --     | --           | --            |
| Delete project                           | Yes   | --     | --     | --           | --            |
| Create task                              | Yes   | Yes    | --     | --           | --            |
| Update task fields                       | Yes   | Yes    | --     | --           | --            |
| Delete any task                          | Yes   | --     | --     | --           | --            |
| Delete own task                          | Yes   | Yes    | --     | Yes          | --            |
| Update task status                       | Yes   | --     | --     | --           | Yes           |
| Create comment                           | Yes   | Yes    | --     | --           | --            |
| Read comments                            | Yes   | Yes    | Yes    | --           | --            |
| Read any resource (workspace/project/task) | Yes | Yes   | Yes    | --           | --            |
