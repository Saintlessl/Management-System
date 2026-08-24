# API

All protected routes require Sanctum authentication and active accounts. Responses use `{success,message,data}` with pagination metadata where applicable.

## Authentication
- `POST /api/auth/login`
- `GET /api/auth/user`
- `POST /api/auth/logout`

## Administration
- CRUD `/api/admin/users`
- CRUD `/api/admin/roles`
- `GET /api/admin/permissions`

## Projects
- CRUD `/api/projects`
- `GET|POST /api/projects/{project}/members`
- `PUT|DELETE /api/projects/{project}/members/{member}`

## Tasks and workflow
- `GET|POST /api/projects/{project}/tasks`
- `GET|PATCH|DELETE /api/tasks/{task}`
- `PATCH /api/tasks/{task}/move`
- `POST /api/tasks/{task}/submit-review`
- `POST /api/tasks/{task}/approve|reject|request-revision`

## Collaboration
- `GET|POST /api/tasks/{task}/comments`
- `PATCH|DELETE /api/comments/{comment}`
- `GET|POST /api/tasks/{task}/attachments`
- `GET /api/attachments/{attachment}/download`
- `DELETE /api/attachments/{attachment}`

## Operations
- `GET /api/dashboard`
- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/{id}/read`
- `POST /api/notifications/mark-all-read`
- `GET /api/audit-logs`

Validation errors return 422, authentication 401, authorization 403, missing resources 404, stale/workflow conflicts 409, and rate limiting 429.
