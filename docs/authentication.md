# Authentication

The React SPA uses Sanctum stateful cookie authentication. It first requests `/sanctum/csrf-cookie`, then posts credentials to `/api/auth/login`. Successful login regenerates the session. Protected requests include credentials and the XSRF token. `/api/auth/user` restores sessions. Logout invalidates the session and regenerates the CSRF token. Inactive accounts are rejected both at login and on subsequent protected requests. Login attempts are limited by normalized email plus IP.
