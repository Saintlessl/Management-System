# Database and ERD

```mermaid
erDiagram
  USERS ||--o{ ROLE_USER : has
  ROLES ||--o{ ROLE_USER : assigned
  ROLES ||--o{ PERMISSION_ROLE : grants
  PERMISSIONS ||--o{ PERMISSION_ROLE : included
  USERS ||--o{ PROJECTS : creates
  USERS ||--o{ PROJECTS : manages
  PROJECTS ||--o{ PROJECT_MEMBERS : contains
  USERS ||--o{ PROJECT_MEMBERS : joins
  PROJECTS ||--o{ TASKS : contains
  USERS ||--o{ TASKS : assigned
  TASKS ||--o{ TASKS : subtasks
  TASKS ||--o{ TASK_DEPENDENCIES : depends
  PROJECTS ||--o{ LABELS : owns
  TASKS }o--o{ LABELS : tagged
  TASKS ||--o{ COMMENTS : discusses
  COMMENTS ||--o{ COMMENTS : replies
  TASKS ||--o{ ATTACHMENTS : stores
  TASKS ||--o{ APPROVALS : reviews
  APPROVALS ||--o{ APPROVAL_HISTORIES : records
  USERS ||--o{ NOTIFICATIONS : receives
  USERS ||--o{ AUDIT_LOGS : performs
```

Important indexes cover project status/deadline/manager, membership uniqueness, task project/assignee/status/priority/deadline/parent/order, dependency uniqueness, comments and attachments by task, and audit entity/action/time queries. Project progress is computed with aggregate counts instead of loading task rows into JavaScript.
