# Known Issues

- Laravel 13 is used instead of the specification's Laravel 12 because the repository was initialized on the newer compatible version.
- SQLite is the automated-test/local default; MySQL is the deployment target and requires environment-specific integration verification.
- Realtime WebSocket updates, multi-tenancy, Scout search, and report export are optional bonuses and are not enabled.
- The current Kanban loads up to 100 tasks for one project; very large boards need virtualization/cursor pagination.
- Email delivery depends on production mail credentials; database notifications and queued dispatch are implemented and tested independently.
