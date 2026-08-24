# Testing

Backend feature tests cover auth, permissions, user/role guardrails, project IDOR/membership, task assignment/relations/dependencies/transitions/versioning, Kanban ordering, approvals/history, comments, files, dashboard, notifications, and reminder idempotency. Frontend Vitest tests cover route guards and dialog accessibility. Final verification also runs lint, TypeScript/Vite build, migrations/seeding, dependency audits, and browser-driven core flows.

Critical rules are tested at API level because Laravel is authoritative. Files use fake storage and notifications use fakes where delivery is not under test.
