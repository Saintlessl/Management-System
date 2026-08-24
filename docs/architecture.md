# Architecture

The system uses two deployable applications: a Laravel REST API under `backend/` and a React SPA under `frontend/`. Laravel is authoritative for authentication, authorization, validation, workflows, persistence, storage, notifications, queueing, and audit records.

HTTP controllers coordinate requests. Form Requests validate input. Policies combine global permissions with project/task context. API Resources prevent accidental exposure of private columns. `TaskRules` centralizes dependency and status-transition invariants. `WriteAuditLog` records structured changes. Laravel Notifications use the database channel and implement `ShouldQueue` for asynchronous dispatch.

React uses route guards for user experience only; backend policies remain mandatory. TanStack Query owns server state. Axios uses Sanctum cookie/CSRF authentication. Kanban applies an optimistic snapshot and restores it when the move endpoint rejects the operation.
