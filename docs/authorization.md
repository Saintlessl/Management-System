# Authorization

Global role permissions are stored in roles/permissions pivots. Resource policies add context:

- Super Admin bypasses policy checks.
- Project Manager manages only assigned projects.
- Members and viewers access only explicit memberships.
- Task access derives from its project; assignment and workflow actions require dedicated permissions.
- Comment editing/deletion requires ownership.
- Attachment download requires project access; deletion requires uploader ownership.

Manipulating frontend IDs never grants access because every API endpoint authorizes the loaded resource. Unrelated resources return 403; nested resources are verified against their parent.
