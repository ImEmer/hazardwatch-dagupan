# HazardWatch API Reference

Base path: `/api`  
Interactive documentation: `/api-docs`  
Authentication: `Authorization: Bearer <JWT>` for protected endpoints.

Protected routes enforce active-user checks plus role rules. `staff` means `superadmin`, `admin`, `staff`, or `barangay` unless noted. Barangay users are restricted to their own/assigned barangay for scoped resources.

## Health and authentication

| # | Method | Endpoint | Access | Purpose |
|---:|---|---|---|---|
| 1 | GET | `/health` | Public | API health check. |
| 2 | GET | `/auth/check-email` | Public | Check email existence. |
| 3 | POST | `/auth/register` | Public | Register citizen account; validates password policy. |
| 4 | POST | `/auth/login` | Public | Login; rate limited and lockout protected. |
| 5 | POST | `/auth/refresh` | Authenticated | Issue a new JWT. |
| 6 | POST | `/auth/logout` | Authenticated | Record logout activity. |
| 7 | GET | `/auth/me` | Authenticated | Return current user. |
| 8 | POST | `/auth/change-password` | Authenticated | Verify current password and change to policy-compliant password. |
| 9 | PUT | `/auth/profile` | Authenticated | Update name/email. |
| 10 | DELETE | `/auth/account` | Authenticated | Soft-delete current account. |
| 11 | POST | `/auth/forgot-password` | Public | Create short-lived hashed reset token. |
| 12 | POST | `/auth/reset-password` | Public token | Consume reset token and enforce password policy. |

## Reports

| # | Method | Endpoint | Access | Purpose |
|---:|---|---|---|---|
| 13 | GET | `/reports/public` | Public | Paginated reduced report listing. |
| 14 | GET | `/reports/export` | Admin/superadmin | Export filtered reports as CSV. |
| 15 | GET | `/reports` | Staff | Scoped queue with filters/pagination. |
| 16 | POST | `/reports` | Authenticated | Create report with up to three image files. |
| 17 | GET | `/reports/mine` | Authenticated | List current user's reports. |
| 18 | GET | `/reports/archived` | Staff | List archived reports. |
| 19 | GET | `/reports/:id` | Staff | Get report and increment views. |
| 20 | PUT | `/reports/:id` | Staff | Update report within scope. |
| 21 | PATCH | `/reports/:id/status` | Staff | Update status; closing archives. |
| 22 | PATCH | `/reports/:id/priority` | Staff | Update priority. |
| 23 | PATCH | `/reports/:id/assign` | Admin/superadmin | Assign user/barangay. |
| 24 | POST | `/reports/:id/comments` | Staff | Add scoped report comment. |
| 25 | DELETE | `/reports/bulk` | Admin/superadmin | Soft-delete selected reports. |
| 26 | DELETE | `/reports/:id` | Admin/superadmin | Soft-delete report. |

## Users

User-management routes require admin or superadmin authorization; self-service preference routes require authentication.

| # | Method | Endpoint | Access | Purpose |
|---:|---|---|---|
| 27 | GET | `/users/me/preferences` | Authenticated | Get the caller's preferences. |
| 28 | PATCH | `/users/me/preferences` | Authenticated | Update the caller's preferences. |
| 29 | GET | `/users/:id/preferences` | Admin/superadmin, scoped | Get a managed user's preferences. |
| 30 | PATCH | `/users/:id/preferences` | Admin/superadmin, scoped | Update a managed user's preferences. |
| 31 | GET | `/users` | Admin/superadmin | List non-deleted users. |
| 32 | GET | `/users/:id` | Admin/superadmin | Get user. |
| 33 | POST | `/users` | Admin/superadmin | Create managed user. |
| 34 | PUT | `/users/:id` | Admin/superadmin | Update managed user under hierarchy rules. |
| 35 | PATCH | `/users/:id/password` | Admin/superadmin, scoped | Set a managed user's password. |
| 36 | PATCH | `/users/:id/status` | Admin/superadmin | Toggle active/suspended status. |
| 37 | POST | `/users/:id/suspend` | Admin/superadmin | Suspend for allowed duration/custom date. |
| 38 | POST | `/users/:id/ban` | Admin/superadmin | Permanently ban user. |
| 39 | POST | `/users/:id/unsuspend` | Admin/superadmin | Restore active status. |
| 40 | DELETE | `/users/bulk` | Admin/superadmin | Soft-delete selected users. |
| 41 | DELETE | `/users/:id` | Admin/superadmin | Soft-delete user. |

## Statistics

| # | Method | Endpoint | Access | Purpose |
|---:|---|---|---|---|
| 42 | GET | `/statistics/public` | Public | Public totals and top categories. |
| 43 | GET | `/statistics/overview` | Staff | Scoped totals/status/priority. |
| 44 | GET | `/statistics/categories` | Staff | Category counts. |
| 45 | GET | `/statistics/status` | Staff | Status counts. |
| 46 | GET | `/statistics/timeline` | Staff | Daily report counts. |
| 47 | GET | `/statistics/barangay` | Staff | Barangay counts. |
| 48 | GET | `/statistics/barangay/:barangay` | Staff | Barangay overview; self-only for barangay role. |
| 49 | GET | `/statistics/barangay/:barangay/status` | Staff | Barangay status counts. |
| 50 | GET | `/statistics/barangay/:barangay/priority` | Staff | Barangay priority counts. |
| 51 | GET | `/statistics/barangay/:barangay/timeline` | Staff | Barangay daily counts. |

## Notifications, activity, and contact

| # | Method | Endpoint | Access | Purpose |
|---:|---|---|---|---|
| 52 | GET | `/notifications` | Admin/superadmin/barangay | List caller-owned notifications with filter and pagination. |
| 53 | PATCH | `/notifications/read-all` | Admin/superadmin/barangay | Mark all caller-owned notifications as read. |
| 54 | PATCH | `/notifications/:id/read` | Admin/superadmin/barangay | Mark an owned notification as read. |
| 55 | PATCH | `/notifications/:id/unread` | Admin/superadmin/barangay | Mark an owned notification as unread. |
| 56 | GET | `/activity/all` | Superadmin | Full activity log. |
| 57 | GET | `/activity/public` | Admin/superadmin | User/barangay activity. |
| 58 | GET | `/activity/barangay/:barangay` | Staff | Barangay activity; barangay self-only. |
| 59 | GET | `/activity/me` | Authenticated | Current-user activity. |
| 60 | GET | `/activity` | Authenticated | Role-dispatched activity view. |
| 61 | POST | `/contact` | Public | Submit validated contact message. |
| 62 | GET | `/contact` | Admin/superadmin | List contact messages. |
| 63 | PATCH | `/contact/:id/status` | Admin/superadmin | Change contact status. |

## System settings

| # | Method | Endpoint | Access | Purpose |
|---:|---|---|---|---|
| 64 | GET | `/system/settings` | Superadmin | Read the singleton system configuration. |
| 65 | PATCH | `/system/settings` | Superadmin | Update system and role settings. |
| 66 | PATCH | `/system/settings/logo` | Superadmin | Upload the system logo to Cloudinary. |

## Common responses

- `200`: successful read/update operation.
- `201`: successful registration, report, or contact creation.
- `400`: malformed input, invalid location/barangay, invalid password, or invalid operation.
- `401`: missing, invalid, expired, or inactive authentication.
- `403`: valid authentication without required role/scope.
- `404`: missing route/resource.
- `409`: duplicate record/email.
- `422`: standard express-validator/schema validation for legacy validation chains.
- `429`: authentication rate limit or failed-login lockout.
- `500`: unexpected server error.

## Report submission example

`POST /api/reports` uses `multipart/form-data`:

- `category`: one of the official hazard categories.
- `customCategory`: required only for `Other`; letters, numbers, spaces, maximum 60 characters.
- `description`: at least 10 characters.
- `location`: JSON Point with `[longitude, latitude]` inside the Dagupan bounds.
- `barangay`: official Dagupan barangay when supplied.
- `images`: up to three JPG/JPEG/PNG/WebP files, maximum 5 MB each.

## Security notes

- API documentation does not expose secrets or test passwords.
- JWT refresh/revocation is not documented as a security guarantee; server-side revocation is postponed.
- Use the Postman collection in `postman/` for authorization and validation verification.
