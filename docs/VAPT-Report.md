# HazardWatch Vulnerability Assessment and Penetration Testing Report

**Assessment date:** 2026-09-17  
**Assessment status:** Preparation complete; runtime scans pending authorized execution  
**System:** HazardWatch Dagupan API and React frontend

## Executive summary

HazardWatch implements JWT authentication, role-based authorization, barangay data isolation, bcrypt password hashing, request validation, upload limits, Helmet headers, CORS restrictions, login lockout, rate limiting, soft deletion, and activity logging. Critical code-level hardening completed in this work adds a secrets template, server-side Dagupan coordinate/barangay validation, a stricter Helmet policy, and a consistent password policy for registration/reset/change flows.

A runtime VAPT result must not be fabricated. Postman and OWASP ZAP execution, response screenshots, timing measurements, and deployed-header verification remain pending until performed against an authorized test environment.

## Scope

- `backend/` Express API, routes, middleware, controllers, models, and configuration.
- `frontend/` React/Vite client behavior relevant to API and session security.
- Postman collection: `postman/HazardWatch-Security-Tests.json`.
- Authorized staging/local deployment only. Do not scan third-party providers or production without written authorization.

## Methodology

1. Source review against OWASP Top 10 (2021).
2. Postman manual and Collection Runner tests for authentication, RBAC, validation, rate limiting, isolation, and file uploads.
3. OWASP ZAP baseline/passive scan against an authorized API/frontend URL.
4. Header verification with browser DevTools or `curl`.
5. Regression build and syntax checks.

## Findings

| ID | Finding | Severity | CVSS | Status |
|---|---|---:|---:|---|
| HW-001 | Credentials present in local environment material | Critical | 9.1 | User action required; rotation intentionally not performed |
| HW-002 | Browser storage bearer tokens | High | 7.4 | Open; redesign postponed |
| HW-003 | Refresh/logout do not revoke tokens | High | 7.1 | Deferred by request; Redis/token rotation postponed |
| HW-004 | Server-side location/barangay validation gap | High | 7.5 | Remediated in code |
| HW-005 | Password policy inconsistent on reset/change | High | 7.5 | Remediated in code |
| HW-006 | Missing/insufficient HTTP security headers | Medium | 6.5 | Remediated in code; deployed verification pending |
| HW-007 | Process-local lockout and no dedicated contact/reset throttling | Medium | 6.5 | Open |
| HW-008 | Incomplete reset email delivery | Medium | 6.1 | Open |
| HW-009 | Bulk mutations lack complete validation/audit coverage | Medium | 6.5 | Open |

### HW-004: Server-side location/barangay validation gap

- Description: Client-only geographic validation could be bypassed by direct API calls.
- Remediation: `validateReport` now checks coordinate shape, Dagupan bounds, and official barangay values; `createReport` repeats the barangay defense.
- Verification: Postman requests `05_Barangay_Isolation/Invalid report barangay` and a manually added outside-coordinate request should return 400.
- Evidence: source diff; runtime screenshot pending.

### HW-005: Password policy inconsistency

- Description: Registration enforced complexity while reset/change flows did not use the same policy.
- Remediation: Reusable `passwordPolicy` is applied to registration, reset, and change-password routes.
- Verification: weak-password requests should return 400 for reset/change and existing registration validation behavior for registration.
- Evidence: source diff; runtime screenshot pending.

### HW-006: HTTP security headers

- Description: API previously used default Helmet only.
- Remediation: CSP, HSTS, referrer policy, frame denial, MIME sniffing protection, and XSS filter configuration added.
- Verification: capture `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy` from an HTTPS deployment.
- Evidence: source diff; deployed header screenshot pending.

## PoC testing logs

| Test | Expected | Actual | Evidence |
|---|---|---|---|
| Outside Dagupan coordinates | 400 `Location must be within Dagupan City.` | Pending execution | `docs/vapt-screenshots/` |
| Invalid barangay | 400 `Invalid barangay.` | Pending execution | `docs/vapt-screenshots/` |
| Weak reset/change password | 400 | Pending execution | `docs/vapt-screenshots/` |
| Unauthenticated protected endpoint | 401 | Existing collection test | Capture required |
| Citizen to users endpoint | 403 | Existing collection test | Capture required |
| Cross-barangay statistics/activity | 403 | Existing collection test | Capture required |
| Invalid upload/oversized/too many files | 400/413/validation response | Existing collection test | Capture required |
| Helmet header verification | Headers present | Pending deployment check | Capture required |
| OWASP ZAP scan | Authorized report | Not run | Save report here |

## Remediation summary

| Finding | Remediation | Owner | Target | Status |
|---|---|---|---|---|
| HW-001 | Manually rotate exposed secrets and invalidate affected credentials | User/ops | Immediate | Pending user action |
| HW-002 | Move sessions to secure HttpOnly SameSite cookies or equivalent | Engineering | Post-deadline | Open |
| HW-003 | Add Redis-backed rotation/revocation | Engineering | Post-deadline | Deferred |
| HW-004 | Enforce API-side geographic/barangay validation | Engineering | Current task | Complete |
| HW-005 | Reuse password policy on all password mutations | Engineering | Current task | Complete |
| HW-006 | Configure and verify HTTP security headers | Engineering/ops | Current task | Code complete |
| HW-007 | Add distributed and endpoint-specific abuse controls | Engineering | Next sprint | Open |
| HW-008 | Implement SMTP reset delivery | Engineering | Next sprint | Open |
| HW-009 | Add strict mutation schemas, batch limits, and audit events | Engineering | Next sprint | Open |

## Conclusion

The source-level critical fixes are implemented without rotating credentials, adding Redis, or changing existing token revocation behavior. Runtime evidence must be collected against an authorized environment before this report can be considered final.
