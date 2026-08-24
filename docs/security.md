# Security

Controls include Sanctum sessions and CSRF, login rate limiting, password hashing, inactive-session invalidation, backend policies against IDOR, explicit mass-assignment field lists, Form Request validation, parameterized Eloquent queries, private attachment storage, randomized filenames, MIME/extension/size limits, authorized downloads, basename handling, escaped React rendering, structured errors, optimistic version conflicts, transactional ordering, and immutable approval history.

Secrets and `.env` must never be committed. Production should use HTTPS, secure cookies, restricted CORS/stateful domains, MySQL credentials from environment, and a supervised queue worker/scheduler.
