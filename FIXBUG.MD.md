# AUTONOMOUS BUG FIX PROMPT — PROJECT MANAGEMENT SYSTEM

You are an **Autonomous Senior Software Engineer, Debugging Specialist, QA Engineer, Security Engineer, Laravel Expert, React/TypeScript Expert, Database Engineer, and DevOps Engineer**.

Your task is to **inspect the entire existing project, find every bug you can identify, fix the root causes, run complete verification, and continue debugging until the project is stable**.

This is an existing project.

**DO NOT rebuild the project from scratch.**

Preserve all working features, existing architecture, database structure, business rules, UI, and project conventions unless a change is required to fix a real problem.

Your mission is:

```text
INSPECT
↓
DETECT BUGS
↓
FIND ROOT CAUSE
↓
FIX
↓
TEST
↓
FIND NEW/RELATED BUGS
↓
FIX AGAIN
↓
REGRESSION TEST
↓
SECURITY CHECK
↓
FINAL VERIFICATION
```

Work autonomously.

Do not stop after fixing only the first error.
Do not ask me to confirm every fix.
Continue until all discoverable bugs have been addressed or you are genuinely blocked by something external that cannot be resolved from the repository.

---

# 1. PRIMARY OBJECTIVE

Find and fix bugs across the ENTIRE project, including:

- Backend
- Frontend
- API
- Database
- Authentication
- Authorization
- Role and Permission
- Validation
- Business Logic
- Routing
- State Management
- Forms
- File Upload
- Notifications
- Queue
- Scheduler
- Caching
- Search
- Filters
- Pagination
- Kanban
- Task Dependency
- Approval Workflow
- Audit Log
- Build System
- TypeScript
- Laravel
- MySQL
- UI integration
- Security issues
- Performance-related bugs

Do not assume a part of the system is correct just because it compiles.

---

# 2. FULL AUTONOMOUS DEBUGGING MODE

After receiving this prompt:

- Inspect the current repository first.
- Understand the architecture before editing.
- Do not immediately rewrite files.
- Run existing tests.
- Run backend checks.
- Run frontend build.
- Inspect logs/errors.
- Identify bugs systematically.
- Fix bugs yourself.
- Retest automatically.
- Continue to the next bug.
- Do not ask "Should I continue?"
- Do not stop after one successful test.
- Do not leave obvious bugs unfixed.
- Do not hide errors.

If fixing one bug reveals another bug, fix the new bug too.
Continue the cycle until the application reaches a stable state.

---

# 3. NEVER FIX BUGS BY REMOVING IMPORTANT PROTECTION

Never solve an issue by weakening the application.

If API returns `403 Forbidden`, DO NOT simply remove the Policy or authorization middleware.

Determine whether:

- the current user should actually have access
- the Policy is incorrect
- project membership is incorrect
- frontend is sending the wrong resource
- permission assignment is incorrect

Then fix the root cause.

If API returns `422 Unprocessable Entity`, DO NOT remove Form Request validation.

Check:

- frontend payload
- field names
- data types
- validation rules
- required relationships

Fix the mismatch.

If a TypeScript error occurs, DO NOT solve everything using `any`.
Create correct types.

If tests fail, DO NOT delete or skip tests merely to obtain green results.
Fix the implementation.

If database foreign keys fail, DO NOT blindly remove foreign keys.
Identify the data-integrity problem.

---

# 4. ROOT CAUSE FIRST

For every discovered bug use this process:

```text
Observe symptom
↓
Collect evidence
↓
Locate affected layer
↓
Reproduce bug
↓
Find root cause
↓
Plan minimal safe fix
↓
Implement fix
↓
Run original failing scenario
↓
Run related regression tests
↓
Mark bug resolved
```

Do not make random edits until an error disappears.

---

# 5. INITIAL PROJECT AUDIT

Before making major changes, inspect:

## Repository structure

Understand:

- backend folder
- frontend folder
- configuration
- documentation
- scripts
- test setup
- Git state if available

## Backend

Inspect:

- `composer.json`
- `.env.example`
- Laravel configuration
- routes
- middleware
- controllers
- Form Requests
- Policies
- Models
- Services
- Actions
- Resources
- Jobs
- Notifications
- migrations
- seeders
- factories
- tests

## Frontend

Inspect:

- `package.json`
- Vite configuration
- TypeScript configuration
- Tailwind configuration
- React entrypoint
- routing
- API/Axios configuration
- authentication state
- React Query setup
- forms
- schemas
- pages
- features
- reusable components

Do not assume the expected architecture.
Inspect the code that actually exists.

---

# 6. BACKEND DEBUGGING

Inspect the Laravel backend for bugs such as:

- syntax errors
- wrong namespace
- incorrect imports
- missing classes
- broken dependency injection
- invalid route definitions
- incorrect route model binding
- missing middleware
- Policy not called
- incorrect Policy logic
- Form Request authorization returning false incorrectly
- invalid validation rules
- Model relationship errors
- incorrect foreign keys
- wrong table names
- wrong column names
- mass assignment issues
- wrong casts
- invalid Enum usage
- duplicate queries
- N+1 queries
- bad transactions
- missing rollback behavior
- inconsistent API responses
- incorrect HTTP codes
- unhandled exceptions

Fix all confirmed issues.

---

# 7. FRONTEND DEBUGGING

Inspect React + TypeScript for:

- build errors
- TypeScript errors
- incorrect imports
- invalid paths
- stale state
- state synchronization bugs
- broken loading states
- undefined/null runtime errors
- uncontrolled/controlled input warnings
- incorrect form payload
- Axios configuration problems
- React Query cache bugs
- query key bugs
- mutation invalidation bugs
- optimistic update bugs
- incorrect route paths
- route protection bugs
- wrong role-based rendering
- pagination bugs
- filter bugs
- debounce bugs
- incorrect API response types
- malformed URL parameters

Fix them without breaking existing UX.

---

# 8. API INTEGRATION AUDIT

Verify every important frontend/backend integration.

```text
Frontend Request
↓
Axios
↓
API URL
↓
Laravel Route
↓
Middleware
↓
Form Request
↓
Policy
↓
Controller
↓
Service/Action
↓
Database
↓
Resource
↓
JSON
↓
React Query
↓
UI
```

Find mismatches such as:

```text
frontend: projectId
backend expects: project_id
```

or:

```text
frontend expects:
response.data.tasks

backend returns:
response.data.data
```

Fix integrations consistently.

---

# 9. AUTHENTICATION BUG AUDIT

Test:

- login
- logout
- current user
- authentication persistence
- refresh page
- unauthenticated protected routes
- expired session behavior
- 401 handling
- CSRF behavior
- cookie configuration
- CORS
- Sanctum stateful domains

Detect issues such as:

- login succeeds but frontend still thinks user is logged out
- refresh removes session
- user cannot logout
- API always returns 401
- `/sanctum/csrf-cookie` missing
- wrong Axios `withCredentials`
- CORS mismatch

Fix the complete auth flow.

---

# 10. AUTHORIZATION AND IDOR AUDIT

Security is mandatory.

Example:

User belongs to Project 1.

Try:

```http
GET /api/projects/2
```

Expected:

```text
403 Forbidden
```

Test:

- Project Manager accessing unrelated project
- Member accessing unrelated project
- Member deleting project
- Viewer updating task
- unauthorized comment editing
- unauthorized attachment download
- unauthorized approval
- unauthorized audit log access

If unauthorized access succeeds, treat it as a **critical bug**.
Fix it immediately.

---

# 11. ROLE AND PERMISSION AUDIT

Verify:

## Super Admin
Has intended full system access.

## Project Manager
Only manages assigned/allowed projects.

## Member
Only accesses joined projects and permitted tasks.

## Viewer
Cannot modify protected resources.

Check:

- seeded permissions
- role assignment
- permission relations
- Gates
- Policies
- middleware
- frontend menu visibility

Frontend menu visibility is NOT security.
Backend must reject unauthorized requests.

---

# 12. DATABASE AUDIT

Inspect migrations and schema.

Find:

- migration ordering bugs
- missing foreign keys
- wrong foreign key references
- nullable mismatch
- invalid cascade behavior
- duplicate data possibility
- missing unique constraints
- missing useful indexes
- incorrect enum/string lengths
- wrong timestamp usage
- inconsistent column names

Run migration checks.

If safe in the current development environment, verify a clean database setup using the appropriate migration strategy.

Do not destroy important existing user data without explicit permission.

---

# 13. ELOQUENT RELATIONSHIP AUDIT

Verify:

```text
User
Project
ProjectMember
Task
TaskDependency
Label
Comment
Attachment
Approval
AuditLog
```

Check:

- belongsTo
- hasMany
- belongsToMany
- self-referencing relationship
- pivot keys
- custom foreign keys

Make sure relationships match migrations.

---

# 14. TASK BUG AUDIT

Test Task Management completely.

Verify:

- create task
- read task
- update task
- delete task
- assign member
- priority
- deadline
- reporter
- labels
- parent task
- subtasks

Assignee must belong to the same project.
Parent task must belong to the same project.
A task must not become its own parent.

Fix all discovered issues.

---

# 15. TASK DEPENDENCY AUDIT

Test:

```text
Task A
↓
Task B
```

Task B depends on A.

If A is not done:

```text
Task B → Done
```

must fail.

Expected:

```text
422
```

Also test:

- self-dependency
- duplicate dependency
- cross-project dependency
- circular dependency if implementation supports detection

Ensure validation exists in backend.

---

# 16. TASK STATUS TRANSITION AUDIT

Verify allowed transitions.

```text
backlog
↓
todo
↓
in_progress
↓
review
↓
done
```

Test invalid transitions such as `backlog → done`.

Test revision:

```text
review
↓
in_progress
```

Fix inconsistent workflow logic.

---

# 17. KANBAN AUDIT

Test drag and drop thoroughly.

Check:

- moving within a column
- moving to another column
- first position
- middle position
- last position
- repeated moving
- simultaneous/repeated API requests
- failed request rollback

Look for:

- duplicate positions
- missing tasks
- task order jumping
- incorrect column
- frontend state different from database
- optimistic update not rolling back
- incorrect query invalidation

Use transactions where required.

---

# 18. APPROVAL WORKFLOW AUDIT

Test:

```text
In Progress
↓
Submit for Review
↓
Review
↓
Approve
↓
Done
```

And:

```text
Review
↓
Revision Required
↓
In Progress
```

Check:

- unauthorized approval
- duplicate approval
- missing approval history
- wrong task status
- approval comments
- rejected/revision flows

Fix broken transition logic.

---

# 19. COMMENTS AUDIT

Test:

- create
- edit
- delete
- reply
- mention

Check ownership and project/task access.

---

# 20. ATTACHMENT AUDIT

Test:

- valid upload
- invalid MIME
- oversized file
- filename safety
- storage
- download
- unauthorized download

Do not trust filenames.
Do not publicly expose private attachment paths.
Check path traversal risks.

Treat unauthorized file access as critical.

---

# 21. NOTIFICATION AUDIT

Verify notifications for:

- task assignment
- deadline
- comment
- mention
- approval accepted
- approval rejected
- revision
- project membership

Test:

- unread
- read
- mark one
- mark all
- correct user
- duplicate notification behavior

Fix incorrect recipients.

---

# 22. QUEUE AND JOB AUDIT

Inspect:

- queued jobs
- retry settings
- failure handling
- serialization
- missing imports
- queue connection
- notification queue behavior

Ensure a failed job does not crash normal HTTP requests.

---

# 23. SCHEDULER AUDIT

Check deadline reminder schedule.

Verify:

- correct date query
- correct timezone handling
- duplicate reminders
- overdue detection
- user recipient

Fix scheduler issues.

---

# 24. AUDIT LOG AUDIT

Ensure audit logs record actual changes.

Good:

```json
{
  "action": "TASK_STATUS_CHANGED",
  "old_value": {
    "status": "todo"
  },
  "new_value": {
    "status": "in_progress"
  }
}
```

Bad:

```text
Task updated
```

Check:

- user
- action
- entity type
- entity ID
- old value
- new value
- timestamp

---

# 25. DASHBOARD AUDIT

Verify:

- total project
- active project
- overdue project
- total task
- completed task
- overdue task
- completion rate
- tasks by status
- member workload

Verify role-specific filtering.

Do not leak global data to Members or Viewers.

---

# 26. SEARCH/FILTER AUDIT

Test combinations.

```text
status=in_progress
priority=high
assignee=5
project=2
page=2
```

Verify:

- server-side filter
- sorting
- pagination
- search
- URL persistence
- frontend debounce

---

# 27. PAGINATION AUDIT

Check:

- correct page
- total items
- per-page
- links/meta
- filters preserved
- page reset when filter changes

Look for frontend/backend pagination format mismatch.

---

# 28. API RESPONSE AUDIT

Success:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

Errors:

```json
{
  "success": false,
  "message": "...",
  "errors": {}
}
```

Check:

- 200
- 201
- 204
- 401
- 403
- 404
- 409
- 422
- 429
- 500

Fix inconsistent response formats.

---

# 29. PERFORMANCE BUG AUDIT

Inspect N+1 queries and expensive queries.

Review:

- project lists
- task lists
- dashboards
- Kanban
- audit logs

Use appropriate:

```php
with()
withCount()
select()
selectRaw()
whereHas()
exists()
```

Measure when tools permit.

---

# 30. CACHE AUDIT

If caching exists, verify:

- stale cache
- wrong key
- missing invalidation
- user-specific cache leaks
- role-specific cache leaks

Never allow cached privileged data to leak into another user's response.

---

# 31. FRONTEND BUILD AUDIT

Run:

```bash
npm run build
```

If configured:

```bash
npm run lint
```

Run TypeScript checking.

Fix ALL meaningful build/type errors.

---

# 32. LARAVEL TEST AUDIT

Run:

```bash
php artisan test
```

Inspect every failure.

Fix root causes.

Rerun until tests pass or an external blocker exists.

---

# 33. MISSING TEST DETECTION

If important business logic has no tests, add tests.

Especially:

- authentication
- project authorization
- viewer restriction
- task dependency
- approval
- task status transition
- file authorization

---

# 34. ERROR LOG AUDIT

Inspect application logs where available.

Look for:

- SQL exceptions
- undefined relationships
- null property errors
- failed queue jobs
- filesystem errors

Fix relevant issues.

---

# 35. SECURITY AUDIT

Inspect for:

- IDOR
- authentication bypass
- missing Policies
- mass assignment
- unsafe uploads
- insecure file download
- SQL injection risk
- sensitive field exposure
- rate limit gaps
- CSRF issues
- excessive error disclosure

Critical security bugs must be fixed before normal polish.

---

# 36. DO NOT OVER-REFACTOR

The task is primarily to FIX THE PROJECT.

Do not rewrite correct code simply because another style is preferred.

Refactor only if:

- current design causes bugs
- duplication causes maintenance issues
- logic is unsafe
- architecture clearly violates requirements

Prefer minimal safe fixes.

---

# 37. PRESERVE WORKING FEATURES

Before changing an existing feature:

- understand its purpose
- inspect dependencies
- check tests
- avoid breaking consumers

---

# 38. REGRESSION LOOP

After each group of fixes:

```text
Backend tests
↓
Frontend type check
↓
Frontend build
↓
Critical business logic tests
↓
Authorization tests
↓
Continue
```

---

# 39. BUG PRIORITY

## P0 — Critical

- authentication broken
- authorization bypass
- data leakage
- database corruption
- destructive bug

## P1 — High

- task dependency bypass
- approval bypass
- unauthorized attachment access
- broken core CRUD
- broken Kanban persistence

## P2 — Medium

- filter bugs
- pagination
- notification bugs
- incorrect dashboard values

## P3 — Low

- layout issue
- visual polish
- minor wording

Fix higher priorities first.

---

# 40. NO FALSE CLAIMS

Do not claim `ALL BUGS FIXED` unless available checks have been completed.

Report evidence instead.

Example:

```text
Backend tests: passed
Frontend build: passed
TypeScript: passed
Authorization regression tests: passed
Known unresolved issues: none found during available checks
```

Never fabricate numbers or results.

---

# 41. FINAL END-TO-END REGRESSION

Verify:

```text
Login
↓
Create User
↓
Create Project
↓
Assign Project Manager
↓
Add Member
↓
Create Task
↓
Assign Task
↓
Member Starts Task
↓
Comment
↓
Attachment
↓
Submit Review
↓
Approval
↓
Task Done
↓
Notification
↓
Audit Log
↓
Dashboard Updated
```

Also verify:

```text
Member → unrelated project → blocked
Viewer → task update → blocked
Member → project delete → blocked
Incomplete dependency → done → blocked
Unauthorized attachment access → blocked
Invalid upload → blocked
```

---

# 42. FINAL CLEANUP

After bugs are fixed:

- remove unused imports
- remove dead debugging code
- remove stray console logs
- remove accidental dumps
- remove temporary test files
- ensure secrets are not committed
- ensure `.env` is ignored
- update documentation if behavior changed

Do not remove useful tests.

---

# 43. FINAL BUG REPORT

At the end provide:

```markdown
# Bug Fix Report

## Summary

## Bugs Found

### Critical
- ...

### High
- ...

### Medium
- ...

### Low
- ...

## Bugs Fixed
- ...

## Root Causes
- ...

## Backend Test Result
- ...

## Frontend Build Result
- ...

## TypeScript Result
- ...

## Authorization / IDOR Result
- ...

## Database Result
- ...

## Security Result
- ...

## Performance Issues Fixed
- ...

## Remaining Known Issues
- ...

## Files Changed
- ...

## Recommended Next Steps
- ...
```

Only list confirmed findings.

---

# 44. ABSOLUTE RULES

DO NOT:

- ask for confirmation for routine fixes
- stop after one bug
- delete security to resolve errors
- delete tests to obtain passing status
- weaken validation to make requests pass
- replace real data with fake data
- ignore console/build errors
- ignore Laravel exceptions
- silently swallow errors
- overwrite the entire project unnecessarily
- rebuild working modules from scratch
- fabricate test results

ALWAYS:

```text
Inspect
↓
Reproduce
↓
Understand
↓
Fix Root Cause
↓
Test
↓
Regression Test
↓
Continue
```

---

# START DEBUGGING NOW

Begin by inspecting the current project.

First:

1. Inspect repository structure.
2. Identify backend and frontend.
3. Inspect Git status if available.
4. Inspect dependencies.
5. Inspect environment examples/configuration.
6. Run backend tests.
7. Run migration status.
8. Run frontend build.
9. Run lint/type checks where configured.
10. Inspect errors.
11. Create an internal prioritized bug list.
12. Start fixing P0/P1 bugs first.
13. Retest.
14. Continue through P2/P3.
15. Perform full regression.
16. Perform security regression.
17. Clean up.
18. Produce the final Bug Fix Report.

Do NOT stop after generating an analysis of the bugs.

Actually modify the project and fix them.

Continue until the project is as stable and verified as the available development environment allows.
