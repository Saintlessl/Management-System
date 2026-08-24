# Project Management System

Enterprise-style internal project management application with a Laravel API and React SPA.

## Features

- Sanctum SPA authentication, session restoration, CSRF, rate limiting
- User, role, and permission administration
- Contextual project authorization and IDOR protection
- Project CRUD, membership, manager assignment, progress and deadlines
- Task CRUD, assignment, labels, subtasks, dependencies, validated transitions, optimistic versions
- Transactional Kanban ordering with optimistic frontend rollback
- Submit/review/approve/reject/revision workflow with immutable history
- Threaded comments, project-scoped mentions, private attachments
- Database notifications, unread/read actions, queued notification delivery
- Deadline reminder scheduler with duplicate prevention
- Structured audit logs and role-scoped dashboard aggregation
- Server-side search, filters, sorting and pagination

## Stack

- Backend: PHP 8.3+, Laravel 13, Sanctum, Eloquent, Queue, Scheduler, Storage
- Frontend: React 19, TypeScript, Vite, Tailwind CSS, React Router, Axios, TanStack Query, React Hook Form, Zod, dnd-kit
- Database: MySQL for deployment; SQLite supported for local/test

## Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed

cd ../frontend
npm install
```

Configure `SUPER_ADMIN_NAME`, `SUPER_ADMIN_EMAIL`, and `SUPER_ADMIN_PASSWORD` in `backend/.env` before seeding.

## Development

```bash
php backend/artisan serve --host=localhost --port=8000
npm --prefix frontend run dev -- --host localhost
php backend/artisan queue:work
php backend/artisan schedule:work
```

Open `http://localhost:5173`.

## Verification

```bash
composer --working-dir=backend test
backend/vendor/bin/pint --test backend/app backend/routes backend/database backend/tests
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
composer --working-dir=backend audit
npm --prefix frontend audit
```

## Documentation

See [docs/architecture.md](docs/architecture.md), [docs/database.md](docs/database.md), [docs/api.md](docs/api.md), [docs/authentication.md](docs/authentication.md), [docs/authorization.md](docs/authorization.md), [docs/security.md](docs/security.md), [docs/testing.md](docs/testing.md), [docs/performance.md](docs/performance.md), and [docs/known-issues.md](docs/known-issues.md).
