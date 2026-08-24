# Performance

Lists use server pagination and narrow filters. Controllers eager-load referenced users, labels, dependencies, and counts to avoid N+1 requests. Project progress uses `tasks_count` and conditional `done_tasks_count`. Dashboard statistics use SQL counts/grouping and a two-minute per-user cache. Cache keys are scoped by user and expire quickly; project/task mutations invalidate React Query caches, while server dashboard cache naturally expires within two minutes.

The Kanban query is bounded to 100 records for a single project. Larger boards should add cursor pagination or column virtualization. MySQL deployments should inspect `EXPLAIN` for project visibility and dashboard queries using production-like data.
