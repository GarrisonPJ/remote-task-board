export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super("UNAUTHORIZED", "You must be logged in.", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super("FORBIDDEN", "You do not have permission to perform this action.", 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super("NOT_FOUND", `${resource} not found.`, 404);
  }
}
