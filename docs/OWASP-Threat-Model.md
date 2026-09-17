# HazardWatch OWASP Top 10 Threat Model (2021)

Assessment date: 2026-09-17. Evidence below is source-code evidence; screenshots and runtime evidence belong in the VAPT package and are marked pending until executed.

## Summary

| ID | Area | Current status | Main gap |
|---|---|---|---|
| A01 | Broken Access Control | Partial | Backend role/barangay guards exist; several mutation payloads and notification role-scope rules need deeper tests. |
| A02 | Cryptographic Failures | Partial | bcrypt and JWT exist; browser storage and exposed local credentials require operational remediation. |
| A03 | Injection | Partial | Mongoose, validation, and escaped search regex reduce risk; mutation schemas need stronger allowlists. |
| A04 | Insecure Design | Partial | Role hierarchy, soft deletion, and lockout exist; refresh/revocation is intentionally postponed. |
| A05 | Security Misconfiguration | Partial | Helmet/CORS/body limits are configured; production HTTPS and secret rotation remain deployment actions. |
| A06 | Vulnerable Components | Open | Dependencies are pinned by lockfiles, but no automated audit evidence was collected. |
| A07 | Identification and Authentication Failures | Partial | JWT, bcrypt, lockout, expiry, and password policy exist; reset email delivery and token revocation are incomplete. |
| A08 | Software and Data Integrity Failures | Partial | Mongoose validation, soft deletion, and activity logging exist; bulk operations lack complete audit coverage. |
| A09 | Security Logging and Monitoring Failures | Partial | Activity logs exist; centralized alerting, retention, and redaction are not evidenced. |
| A10 | Server-Side Request Forgery | Partial | Backend does not fetch user-supplied URLs; frontend calls fixed map/geocoding providers. Egress policy is not documented. |

## Detailed mapping

### A01: Broken Access Control

- Threat: A user accesses another user's reports, administrative routes, or another barangay's data.
- Application: API routes use `protect` and role guards. Report/statistics/activity queries scope barangay users. User-management hierarchy protects superadmins and prevents self-deletion.
- Controls: `backend/middleware/auth.js`, `backend/routes/*.js`, `reportController.js`, `statisticsController.js`, and `activityController.js`.
- Evidence: `allowRoles`, `isStaff`, `barangayScope`, `assertBarangayAccess`, and `managementError`.
- Gaps: Bulk report deletion, notification role-wide queries, and every mutation field need dedicated authorization tests.

### A02: Cryptographic Failures

- Threat: Password, reset token, or bearer token disclosure.
- Application: User passwords are bcrypt-hashed; reset tokens are SHA-256 hashed; JWTs are signed.
- Controls: `backend/models/User.js`, `authController.js`, `api.js`; Helmet transport-related headers.
- Evidence: bcrypt cost 12, `select: false`, 15-minute reset expiry, role-based token expiry.
- Gaps: Tokens are stored in browser storage, TLS is deployment-dependent, and local environment credentials must be rotated manually.

### A03: Injection

- Threat: Query, regex, HTML, or payload injection.
- Application: Mongoose queries and express-validator process input; report/activity search escapes regex metacharacters.
- Controls: `validate.js`, route validators, `escapeRegex`, Mongoose schemas.
- Evidence: category allowlists, Mongo ID validation, bounded pagination, escaped search patterns.
- Gaps: Add explicit allowlists for update payloads and output encoding/sanitization for rendered user content.

### A04: Insecure Design

- Threat: Abuse of lifecycle, privilege, reset, or report-management workflows.
- Application: Account states, soft deletion, role hierarchy, last-superadmin protection, lockout, and report state transitions.
- Controls: `userController.js`, `loginLockout.js`, `reportController.js`.
- Evidence: suspended/banned/deleted checks and closed/resolved restrictions.
- Gaps: Refresh rotation/revocation is intentionally postponed; bulk operations need limits and audit entries.

### A05: Security Misconfiguration

- Threat: Missing headers, permissive cross-origin access, oversized bodies, or committed secrets.
- Application: Express API and deployment configuration.
- Controls: Helmet CSP/HSTS/frameguard/noSniff/referrer policy, CORS allowlist, 2 MB JSON limit, `.gitignore`, `.env.example`.
- Evidence: `backend/server.js`, `.gitignore`, `backend/.env.example`.
- Gaps: Enforce HTTPS at the edge, rotate the actual environment values manually, and verify deployed headers.

### A06: Vulnerable Components

- Threat: Exploitation through npm dependencies.
- Application: Express, Mongoose, Helmet, Multer, Cloudinary, React, MapLibre, and visualization libraries.
- Controls: npm lockfiles and package manifests.
- Evidence: `backend/package-lock.json`, `frontend/package-lock.json`.
- Gaps: Run `npm audit --omit=dev` for both packages, triage results, and add dependency scanning to CI.

### A07: Identification and Authentication Failures

- Threat: Credential stuffing, weak passwords, stale sessions, account enumeration, and reset abuse.
- Application: Login/register/reset/change-password flows.
- Controls: JWT verification, bcrypt, password policy, generic forgot-password response, IP/email lockout, rate limiting, client expiry handling.
- Evidence: `auth.js`, `authController.js`, `loginLockout.js`, `validate.js`.
- Gaps: Reset email delivery is not implemented in the inspected flow; token revocation/rotation is postponed; lockout is process-local.

### A08: Software and Data Integrity Failures

- Threat: Unauthorized data mutation or inability to trace changes.
- Application: Reports, users, contacts, and account lifecycle.
- Controls: Mongoose schemas, role checks, soft deletion, activity logs, Cloudinary upload constraints.
- Evidence: models, controllers, `logActivity.js`.
- Gaps: Some bulk and user-suspension paths do not consistently create audit events; add integrity and authorization tests.

### A09: Security Logging and Monitoring Failures

- Threat: Incident cannot be detected or reconstructed.
- Application: Activity and server error handling.
- Controls: ActivityLog model, role-scoped activity endpoints, central error handler, login/report/user audit events.
- Evidence: `ActivityLog.js`, `logActivity.js`, `activityController.js`, `errorHandler.js`.
- Gaps: No central alerting/retention/redaction policy or runtime monitoring evidence is included.

### A10: Server-Side Request Forgery

- Threat: Server is induced to call an attacker-controlled internal/external URL.
- Application: API and map integrations.
- Controls: No backend endpoint accepts a user URL for fetching; frontend calls fixed OpenStreetMap/Nominatim URLs.
- Evidence: `InteractiveMap.jsx` and backend route/controller inventory.
- Gaps: Add egress restrictions and document provider allowlists if future server-side fetching is introduced.

## Evidence checklist

- Source evidence: repository files listed above.
- Runtime evidence: pending Postman collection execution and deployed header capture.
- ZAP evidence: pending authorized scan; do not scan production without authorization.
