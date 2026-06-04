# Security Spec

## Data Invariants
1. A User must be authenticated to access or write any data.
2. A User profile must match their authenticated context (`uid == request.auth.uid`).
3. Projects can be read by anyone authenticated, but only created/updated by users with `OWNER`, `PROJECT_MANAGER`, or `FINANCE` roles (or any authenticated user for simplicity if no backend role checks).
4. Tasks, Lots, and Documents are accessible by authenticated users. For update/delete, users generally need to be owners or assigned to the project.
5. All references like `projectId` must be strings and correctly formatted.

## The "Dirty Dozen" Payloads
1. **Shadow Update on User**: Updating `User` with an injected `isAdmin` field.
2. **Email Spoofing**: Creating a `User` where the email string differs from token email or token hasn't been verified.
3. **Array Overflow**: Updating a project's `teamMembers` array to have > 1000 items.
4. **Invalid Role Injection**: Creating a User with role `SUPER_ADMIN`.
5. **ID Poisoning**: Querying or creating a project with `{projectId}` = a 10KB string.
6. **Task Status Injection**: Updating a task status to an unknown value not in enum.
7. **Type Poisoning**: Sending `budget` as a string instead of a number.
8. **Date Format Breaking**: Sending `startDate` as `not-a-date`.
9. **Missing Required Fields**: Creating a Task without `projectId`.
10. **State Shortcutting**: Updating a Task's status from `TODO` straight to `DONE` skipping `IN_PROGRESS` (if logic applies, else just general rule).
11. **Orphaned Write**: Creating a Task with a random `projectId` that does not exist in `projects` collection.
12. **PII Blanket Read**: Searching `users` without proper constraints.

## Note
These rules are validated by ESLint and the test runner.
