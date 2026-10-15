# System Reference — HazardWatch Dagupan

> Last updated: 2026-10-16
>
> Maintained by: HazardWatch project maintainers
>
> Version: 1.0.0 (backend and frontend package manifests; no root application package)

---

## 1. Overview

- **Purpose:** A community hazard-reporting and monitoring platform for Dagupan City, Philippines.
- **Problem it solves:** Gives residents and local responders a shared way to submit, locate, review, assign, and track community hazard reports.
- **Target users:** Citizens (`user`), barangay operators (`barangay`), administrators (`admin`), and super administrators (`superadmin`).
- **Core features:** Account registration and email verification; password reset and verified account email/password changes; mandatory email OTP or WebAuthn second factor for privileged roles; photo-backed hazard reports; interactive hazard maps; report status, priority, assignment, archive and export workflows; user administration; barangay-scoped operations; statistics and audit activity; notifications; system settings; and Spark-based batch/window/stream analytics.
- **High-level architecture:** A modular monolith consisting of a React single-page application, an Express REST API, and MongoDB persistence. Separate PySpark jobs read reports and write derived analytics collections. The Node API can also schedule database backups in-process.
- **Deployment target:** Frontend rewrite configuration targets Vercel. Backend/API and MongoDB Atlas are documented for Render and Atlas. Local frontend development proxies `/api` and `/uploads` to the backend on port 5000. No Docker or CI configuration is present in the tracked tree.
- **Repository scope:** This reference inventories tracked project files. It excludes `.git/`, `node_modules/`, `.venv/`, ignored local credentials and secrets, and transient build output. Tracked Spark checkpoint and Python bytecode artifacts are listed and identified as generated state.
- **Workspace note:** The inspected worktree contains uncommitted application changes. This reference documents the inspected source; that does not imply those changes have been committed or deployed.

Runtime flow:

1. `frontend/src/main.jsx` mounts `frontend/src/App.jsx` under React StrictMode.
2. `App.jsx` composes auth, report, theme, confirmation, routing, and layout providers.
3. `frontend/src/services/api.js` configures Axios, base URL, bearer-token injection, and expired-session handling.
4. `backend/server.js` mounts the Express routers under `/api`, exposes `/api/health` and `/api-docs`, then connects to MongoDB before listening.
5. Mongoose persists application data; Cloudinary stores image uploads; Brevo sends transactional email.
6. Optional Python Spark jobs populate MongoDB analytics collections. Optional Node cron invokes `mongodump` and uploads archives to Backblaze B2.

Production smoke check on 2026-10-16: the public Hazard Map loaded the Render `/api/reports/public` request with HTTP 200, displayed 500 reports, loaded the Vercel-hosted MapLibre worker with HTTP 200, and rendered 97 map marker elements. This verifies the map/worker deployment at that time; it does not verify private provider settings or Render logs.

## 2. Tech Stack

Versions below are lockfile-resolved versions where available. Node, Python, Java, and local Python package versions are observed in the inspected workstation environment; the repository does not pin those runtimes. npm package manifests do not declare an `engines` range.

| Layer | Technology | Version | Notes |
|---|---|---:|---|
| Language | JavaScript (ES modules) | Node.js 24.13.0 observed | Backend and frontend tooling; backend package uses `type: module`. |
| Language | Python | Python 3.14.2 observed | Spark jobs; `requirements.txt` entries are unpinned. |
| Runtime | Java | 21.0.5 observed | Local Spark environment; not pinned by repository config. |
| Frontend | React / React DOM | 19.2.8 | Vite SPA. |
| Routing | React Router DOM | 7.18.3 | Client-side routing and nested role layouts. |
| Backend | Express | 5.2.1 | Declared `^5.1.0`; REST API. |
| Database | MongoDB / Mongoose | MongoDB driver 7.6.0; Mongoose 8.24.4 | MongoDB Atlas is the documented hosted target; local MongoDB can be used by Spark defaults. |
| Authentication | JSON Web Token / bcryptjs | 9.0.3 / 3.0.3 | JWT bearer tokens; bcryptjs hashes passwords and short-lived codes. |
| WebAuthn | `@simplewebauthn/server` / `@simplewebauthn/browser` | 14.0.3 / 14.0.0 | Biometric/passkey registration and login for privileged accounts. |
| Styling | Tailwind CSS / PostCSS / Autoprefixer | 3.4.19 / 8.5.28 / 10.5.5 | Tailwind default palette plus application utility classes; dark mode uses the `class` strategy. |
| Build tool | Vite / React plugin | 8.2.2 / 6.1.1 | Frontend build, dev server, and local API proxy. |
| Maps | MapLibre GL | 6.8.0 | Raster map rendering. |
| Charts | Recharts | 3.10.1 | Dashboard visualizations. |
| Animation | Framer Motion / AOS | 14.2.0 / 2.3.4 | Framer Motion drives homepage scroll transforms; AOS is initialized by pages that use it. |
| UI feedback | Sonner / Lucide React | 2.0.8 / 1.48.0 | Toasts and icon components. |
| Validation / security | express-validator / Helmet / CORS / express-rate-limit | 7.3.2 / 8.3.0 / 2.8.6 / 7.5.1 | API validation, headers, origin checks, and request throttling. |
| Uploads | Multer / Cloudinary storage | 2.3.0 / 4.0.0 | Multipart uploads streamed to Cloudinary. |
| API documentation | swagger-jsdoc / swagger-ui-express | 6.3.0 / 5.0.1 | OpenAPI document served at `/api-docs`. |
| Email | `@getbrevo/brevo` | 6.0.3 | Brevo transactional email API; SMTP/Nodemailer is not used. |
| Backup scheduling | node-cron | 4.6.0 | Optional in-process backup schedule. |
| Analytics | PySpark / PyMongo / schedule | 4.2.0 / 4.18.1 / 1.2.2 observed | Locally installed in `.venv`; project requirements do not pin versions. Spark connector is `org.mongodb.spark:mongo-spark-connector_2.13:11.1.0`. |
| Testing | Node.js `node:test` / Postman | — | Two direct Node test files and a Postman collection exist; no npm test script or CI workflow is configured. |
| CI/CD | — | — | No tracked workflow, pipeline, Dockerfile, or compose file found. |
| Hosting | Vercel / Render / MongoDB Atlas | — | Deployment targets are documented/configured, not fully declared by infrastructure-as-code. |
| Cache / queue | None detected | — | Rate limit and login-lockout state are in process memory; no Redis or message broker. |

## 3. Third-Party Services & Integrations

| Service | Purpose | Where used | Environment/configuration |
|---|---|---|---|
| MongoDB / MongoDB Atlas | Primary persistence for users, reports, contacts, settings, logs, notifications, token blacklist, and analytics. | `backend/config/db.js`, Mongoose models, Spark jobs | `MONGO_URI`; Spark can also use `MONGO_DB_NAME`, `DB_NAME`, and `REPORTS_COLLECTION`. |
| Cloudinary | Report image and system-logo storage, format restrictions, and width transformation. | `backend/middleware/upload.js`, report and system controllers | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. |
| Brevo | Transactional account verification, password reset, 2FA, and opted-in notification email. | `backend/utils/sendEmail.js`, auth and notification controllers | `BREVO_API_KEY`, `EMAIL_FROM`, optional `EMAIL_FROM_NAME`. |
| WebAuthn | Browser/platform authenticator registration and authentication (passkeys/biometrics). | `backend/controllers/authController.js`, `frontend/src/pages/public/LoginPage.jsx` | `WEBAUTHN_RP_ID` defaults to the request origin hostname; `WEBAUTHN_RP_NAME` defaults to `HazardWatch Dagupan`. |
| Backblaze B2 | Gzip database archive upload, version listing, and deletion of versions older than retention. | `backend/scripts/backup.js` | `B2_KEY_ID`, `B2_APP_KEY`, `B2_BUCKET_ID`; optional backup schedule/alert variables. |
| OpenStreetMap | Default raster tiles and source attribution. | `frontend/src/components/InteractiveMap.jsx` | No application key configured. Respect provider use/attribution requirements. |
| Esri ArcGIS | Satellite raster tiles. | `frontend/src/components/InteractiveMap.jsx` | No application key configured in the inspected code. |
| OpenTopoMap | Terrain raster tiles. | `frontend/src/components/InteractiveMap.jsx` | No application key configured. |
| Nominatim | Reverse geocoding from selected coordinates to address/barangay. | `frontend/src/components/InteractiveMap.jsx` | Fixed provider URL; no environment variable. |
| MongoDB Spark Connector | Spark DataFrame reads/writes and MongoDB change-stream source. | `backend/spark/utils/spark_session.py`, Spark jobs | Maven coordinate `org.mongodb.spark:mongo-spark-connector_2.13:11.1.0`. |
| Vercel | Static frontend hosting and SPA fallback rewrites. | `frontend/vercel.json` | Deployment provider configuration. |
| Render | Documented backend hosting target and deployed API origin. | `backend/swagger.js`, frontend API default, architecture docs | `PORT`, `CLIENT_URL`, and provider-managed environment. |

No payment provider, Redis, external queue, SMTP client, or Google Sign-In implementation is active. `User.js` retains legacy Google identity fields, but its deprecation note identifies Google Sign-In as deprecated.

## 4. Dependencies (Direct)

Exact versions are resolved from `backend/package-lock.json` and `frontend/package-lock.json`; declared ranges are shown where useful. Root `package-lock.json` has lockfile version 3 metadata but no root `package.json` dependency graph.

### Backend runtime

| Package | Locked version (declared range) | Purpose |
|---|---|---|
| `@getbrevo/brevo` | 6.0.3 (`^6.0.3`) | Brevo transactional email API. |
| `bcryptjs` | 3.0.3 (`^3.0.2`) | Password and verification-code hashing. |
| `cloudinary` | 1.41.3 (`^1.41.3`) | Cloudinary SDK. |
| `cors` | 2.8.6 (`^2.8.5`) | CORS middleware. |
| `csv-parser` | 3.2.1 (`^3.2.1`) | CSV-driven seed scripts. |
| `dotenv` | 16.6.1 (`^16.6.1`) | Local environment loading. |
| `express` | 5.2.1 (`^5.1.0`) | HTTP server and router. |
| `express-rate-limit` | 7.5.1 (`^7.5.0`) | Global and endpoint rate limits. |
| `express-validator` | 7.3.2 (`^7.2.1`) | Request validation and sanitization. |
| `helmet` | 8.3.0 (`^8.1.0`) | HTTP security headers and CSP. |
| `jsonwebtoken` | 9.0.3 (`^9.0.2`) | JWT creation and validation. |
| `mongodb` | 7.6.0 (`^7.6.0`) | MongoDB Node driver package; Mongoose is the active model layer. No direct driver import was found in the inspected source. |
| `mongoose` | 8.24.4 (`^8.13.2`) | MongoDB ODM, schemas, indexes, and queries. |
| `multer` | 2.3.0 (`^2.0.0`) | Multipart upload parsing. |
| `multer-storage-cloudinary` | 4.0.0 (`^4.0.0`) | Multer storage adapter for Cloudinary. |
| `node-cron` | 4.6.0 (`^4.6.0`) | Optional database-backup cron. |
| `swagger-jsdoc` | 6.3.0 (`^6.3.0`) | OpenAPI document construction. |
| `swagger-ui-express` | 5.0.1 (`^5.0.1`) | Interactive API documentation UI. |

### Frontend runtime

| Package | Locked version (declared range) | Purpose |
|---|---|---|
| `aos` | 2.3.4 (`^2.3.4`) | Scroll-triggered animations. |
| `axios` | 1.20.0 (`^1.20.0`) | HTTP client. |
| `lucide-react` | 1.48.0 (`^1.48.0`) | SVG icon components. |
| `maplibre-gl` | 6.8.0 (`^6.7.0`) | Interactive raster maps. |
| `react` | 19.2.8 (`^19.2.8`) | UI runtime. |
| `react-day-picker` | 10.0.1 (`^10.0.1`) | Date selection component. |
| `react-dom` | 19.2.8 (`^19.2.8`) | DOM renderer. |
| `react-router-dom` | 7.18.3 (`^7.18.3`) | SPA routing. |
| `recharts` | 3.10.1 (`^3.10.1`) | Charts. |
| `sonner` | 2.0.8 (`^2.0.8`) | Toast notifications. |

### Development/build dependencies

| Package | Locked version (declared range) | Used by |
|---|---|---|
| `@types/react` | 19.2.18 (`^19.2.18`) | React type definitions. |
| `@types/react-dom` | 19.2.7 (`^19.2.4`) | React DOM type definitions. |
| `@vitejs/plugin-react` | 6.1.1 (`^6.1.0`) | Vite React integration. |
| `autoprefixer` | 10.5.5 (`^10.5.4`) | CSS vendor prefixes. |
| `postcss` | 8.5.28 (`^8.5.26`) | CSS processing. |
| `tailwindcss` | 3.4.19 (`^3.4.19`) | Utility CSS framework. |
| `vite` | 8.2.2 (`^8.2.2`) | Frontend dev server and production bundler. |

### Python requirements

`backend/spark/requirements.txt` lists `pyspark`, `pymongo`, `python-dotenv`, and `schedule` without version pins. The inspected local virtual environment resolved these to PySpark 4.2.0, PyMongo 4.18.1, python-dotenv 1.2.3, and schedule 1.2.2; these are environment observations, not reproducible lockfile versions.

## 5. Project Structure (Tracked Tree)

This is the tracked source/configuration/data tree at the inspection date. `.git/`, `.venv/`, `node_modules/`, ignored local secret files, and build output are intentionally excluded. Spark checkpoint metadata and `.pyc` files below are tracked generated artifacts, not source modules.

```text
.
├── .gitignore
├── .oxlintrc.json
├── SYSTEM_REFERENCE.md
├── package-lock.json
├── backend/
│   ├── .env.example
│   ├── BACKUPS.md
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js
│   ├── swagger.js
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── activityController.js
│   │   ├── analyticsController.js
│   │   ├── authController.js
│   │   ├── contactController.js
│   │   ├── notificationController.js
│   │   ├── reportController.js
│   │   ├── statisticsController.js
│   │   ├── systemController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── loginLockout.js
│   │   ├── rateLimit.js
│   │   ├── upload.js
│   │   └── validate.js
│   ├── models/
│   │   ├── ActivityLog.js
│   │   ├── Category.js
│   │   ├── ContactMessage.js
│   │   ├── Notification.js
│   │   ├── Report.js
│   │   ├── SystemSettings.js
│   │   ├── TokenBlacklist.js
│   │   └── User.js
│   ├── routes/
│   │   ├── activity.js
│   │   ├── analytics.js
│   │   ├── auth.js
│   │   ├── contact.js
│   │   ├── notifications.js
│   │   ├── reports.js
│   │   ├── statistics.js
│   │   ├── system.js
│   │   └── users.js
│   ├── scripts/
│   │   ├── archiveClosedReports.js
│   │   ├── backfillVerified.js
│   │   ├── backup.js
│   │   ├── barangay-resolution.test.mjs
│   │   ├── clearReports.js
│   │   ├── clearSeededReports.js
│   │   ├── clearSeededUsers.js
│   │   ├── enable2FA.js
│   │   ├── enforce2FAPrivileged.js
│   │   ├── feature-regression.test.mjs
│   │   ├── fixSuperAdminRole.js
│   │   ├── removeBackupCodes.js
│   │   ├── reset-db-state.mjs
│   │   ├── seedCitizens.js
│   │   ├── seedReports.js
│   │   ├── setNotificationEmails.js
│   │   └── testEmail.js
│   ├── seeders/
│   │   ├── seed.js
│   │   ├── seedBarangays.js
│   │   └── data/
│   │       ├── crm_customers.csv
│   │       └── sf311_cases.csv
│   ├── spark/
│   │   ├── README.md
│   │   ├── __init__.py
│   │   ├── requirements.txt
│   │   ├── scheduler.py
│   │   ├── checkpoints/
│   │   │   ├── barangay/
│   │   │   │   ├── .metadata.crc
│   │   │   │   └── metadata
│   │   │   ├── category/
│   │   │   │   ├── .metadata.crc
│   │   │   │   └── metadata
│   │   │   └── priority/
│   │   │       ├── .metadata.crc
│   │   │       └── metadata
│   │   ├── jobs/
│   │   │   ├── __init__.py
│   │   │   ├── __pycache__/
│   │   │   │   ├── batch_analytics.cpython-314.pyc
│   │   │   │   ├── streaming_analytics.cpython-314.pyc
│   │   │   │   └── window_analytics.cpython-314.pyc
│   │   │   ├── batch_analytics.py
│   │   │   ├── streaming_analytics.py
│   │   │   └── window_analytics.py
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── __pycache__/
│   │       │   ├── __init__.cpython-314.pyc
│   │       │   ├── mongo_config.cpython-314.pyc
│   │       │   └── spark_session.cpython-314.pyc
│   │       ├── mongo_config.py
│   │       └── spark_session.py
│   └── utils/
│       ├── createNotification.js
│       ├── dagupanBarangays.js
│       ├── generateToken.js
│       ├── logActivity.js
│       ├── priorityCalculator.js
│       └── sendEmail.js
├── docs/
│   ├── API-Reference.md
│   ├── OWASP-Threat-Model.md
│   ├── VAPT-Report.md
│   └── architecture.md
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vercel.json
│   ├── vite.config.js
│   ├── public/
│   │   ├── channel1.jpg
│   │   ├── channel2.jpg
│   │   ├── channel3.jpg
│   │   ├── globe.png
│   │   ├── hazardwatch-logo.png
│   │   ├── manual1.jpg
│   │   ├── manual2.jpg
│   │   ├── manual3.jpg
│   │   ├── mission-illustration.png
│   │   ├── status1.jpg
│   │   ├── status2.jpg
│   │   ├── status3.jpg
│   │   ├── trend1.jpg
│   │   ├── trend2.jpg
│   │   └── trend3.jpg
│   └── src/
│       ├── App.css
│       ├── App.jsx
│       ├── index.css
│       ├── main.jsx
│       ├── assets/
│       │   ├── hazardwatch-logo.png
│       │   ├── hero.png
│       │   ├── react.svg
│       │   └── vite.svg
│       ├── components/
│       │   ├── ActivityPage.jsx
│       │   ├── BanUserModal.jsx
│       │   ├── CommunitySections.jsx
│       │   ├── InteractiveMap.jsx
│       │   ├── PasswordToggle.jsx
│       │   ├── SessionExpiryModal.jsx
│       │   ├── StaticMap.jsx
│       │   ├── SuspendUserModal.jsx
│       │   ├── common/
│       │   │   ├── AnalyticsPanel.jsx
│       │   │   ├── ArchivedReportsPage.jsx
│       │   │   ├── CodeInput.jsx
│       │   │   ├── ConfirmModal.jsx
│       │   │   ├── CountUp.jsx
│       │   │   ├── CursorGlow.jsx
│       │   │   ├── ImageGallery.jsx
│       │   │   ├── MapReportList.jsx
│       │   │   ├── NotificationBell.jsx
│       │   │   ├── NotificationCenterPage.jsx
│       │   │   ├── NotificationDropdown.jsx
│       │   │   ├── Pagination.jsx
│       │   │   ├── ScrollToTop.jsx
│       │   │   ├── Skeleton.jsx
│       │   │   ├── ToastContent.jsx
│       │   │   └── UserFormModal.jsx
│       │   ├── layout/
│       │   │   ├── AdminLayout.jsx
│       │   │   ├── AdminSidebar.jsx
│       │   │   ├── BarangayLayout.jsx
│       │   │   ├── BarangaySidebar.jsx
│       │   │   ├── Footer.jsx
│       │   │   ├── Navbar.jsx
│   │   │   ├── PrivilegedTopBar.jsx
│   │   │   ├── ProtectedRoute.jsx
│       │   │   ├── PublicLayout.jsx
│       │   │   ├── Sidebar.jsx
│   │   │   ├── ThemeToggle.jsx
│   │   │   └── layoutConstants.js
│       │   └── settings/
│       │       ├── MapPreferencesSection.jsx
│       │       ├── SettingsCard.jsx
│       │       ├── SettingsDashboard.jsx
│       │       ├── SettingsSection.jsx
│       │       └── SettingsToggle.jsx
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   ├── ConfirmContext.jsx
│       │   ├── ReportContext.jsx
│       │   └── ThemeContext.jsx
│       ├── hooks/
│       │   ├── useAuth.js
│       │   ├── useDebounce.js
│       │   ├── useTheme.js
│       │   └── useViewportReports.js
│       ├── pages/
│       │   ├── admin/
│       │   │   ├── AdminActivityPage.jsx
│       │   │   ├── AdminArchivedPage.jsx
│       │   │   ├── AdminDashboard.jsx
│       │   │   ├── AdminLayout.jsx
│       │   │   ├── AdminMapPage.jsx
│       │   │   ├── AdminNotificationsPage.jsx
│       │   │   ├── AdminReportDetailPage.jsx
│       │   │   ├── AdminReportsPage.jsx
│       │   │   ├── AdminResolvedReportsPage.jsx
│       │   │   ├── AdminSettingsPage.jsx
│       │   │   └── AdminUsersPage.jsx
│       │   ├── barangay/
│       │   │   ├── BarangayActivityPage.jsx
│       │   │   ├── BarangayArchivedPage.jsx
│       │   │   ├── BarangayDashboard.jsx
│       │   │   ├── BarangayMapPage.jsx
│       │   │   ├── BarangayNotificationsPage.jsx
│       │   │   ├── BarangayReportDetail.jsx
│       │   │   ├── BarangayReportsPage.jsx
│       │   │   ├── BarangaySettingsPage.jsx
│       │   │   ├── bonuan/
│       │   │   │   ├── BonuanDashboard.jsx
│       │   │   │   ├── BonuanReportDetail.jsx
│       │   │   │   └── BonuanReportsPage.jsx
│       │   │   ├── lucao/
│       │   │   │   ├── LucaoDashboard.jsx
│       │   │   │   ├── LucaoReportDetail.jsx
│       │   │   │   └── LucaoReportsPage.jsx
│       │   │   └── tapuac/
│       │   │       ├── TapuacDashboard.jsx
│       │   │       ├── TapuacReportDetail.jsx
│       │   │       └── TapuacReportsPage.jsx
│       │   ├── public/
│       │   │   ├── AboutPage.jsx
│       │   │   ├── ContactPage.jsx
│       │   │   ├── EnterResetCodePage.jsx
│       │   │   ├── ForgotPasswordPage.jsx
│       │   │   ├── HazardMapPage.jsx
│       │   │   ├── HomePage.jsx
│       │   │   ├── LoginPage.jsx
│       │   │   ├── MyReportsPage.jsx
│       │   │   ├── PrivacyPolicyPage.jsx
│       │   │   ├── ProfilePage.jsx
│       │   │   ├── RegisterPage.jsx
│       │   │   ├── ReportDetailPage.jsx
│       │   │   ├── ResetPasswordPage.jsx
│       │   │   ├── SubmitReport.jsx
│       │   │   ├── TermsOfServicePage.jsx
│       │   │   ├── TrackReportPage.jsx
│       │   │   ├── TwoFactorPage.jsx
│       │   │   └── VerifyEmailPage.jsx
│       │   └── superadmin/
│       │       ├── SuperAdminActivityPage.jsx
│       │       ├── SuperAdminDashboard.jsx
│       │       ├── SuperAdminNotificationsPage.jsx
│       │       ├── SuperAdminReportDetailPage.jsx
│       │       ├── SuperAdminReportsPage.jsx
│       │       ├── SuperAdminSettings.jsx
│       │       └── SuperAdminUsers.jsx
│       └── services/
│           ├── alerts.js
│           ├── api.js
│           ├── reportOptions.js
│           └── validation.js
├── docs/
│   ├── API-Reference.md
│   ├── OWASP-Threat-Model.md
│   ├── VAPT-Report.md
│   └── architecture.md
└── postman/
    └── HazardWatch Security Tests.postman_collection.json
```

Notes on the tree:

- The source tree has no `components/ui/`, migrations directory, Dockerfile, GitHub workflow, root README, or backend README. The two Node tests are standalone files under `backend/scripts/`.
- `backend/spark/stream_input/` is an ignored runtime directory created by the streaming fallback; it has no tracked files at inspection time.
- Local `backend/.env` and `ACCOUNTS.md` are ignored and excluded; no values from either are reproduced. `.venv/`, `node_modules/`, and `.git/` are excluded as local/vendor data.

## 6. File-by-File Breakdown

Every tracked file appears below. Binary image files are described by their use, not by embedded contents. Generated checkpoint metadata and `.pyc` files are called out as generated artifacts.

### 6.1 Repository root

| File | Purpose / implementation | Notes |
|---|---|---|
| `.gitignore` | Ignores dependencies, build output, environment files, uploads, Python caches, Spark runtime state, editor files, CSV additions, and local credentials. | Existing tracked CSV/checkpoint artifacts remain tracked despite ignore patterns. |
| `.oxlintrc.json` | Oxlint configuration enabling React and OXC plugins and selected React rules. | No root lint script/package is declared. |
| `package-lock.json` | Root npm lock metadata, lockfile version 3. | No root `package.json` or root dependency graph. |
| `SYSTEM_REFERENCE.md` | This system inventory, API, environment, model, and security reference. | Repository uses uppercase filename; there is no separate lowercase duplicate. |

### 6.2 Backend bootstrap, configuration, and packages

| File | Purpose / implementation | Notes |
|---|---|---|
| `backend/.env.example` | Names-only environment template for MongoDB, JWT, Cloudinary, Brevo, CORS, WebAuthn, B2, and backup schedule settings. | Contains no credential values. Optional code-only variables are listed in Section 7. |
| `backend/BACKUPS.md` | Backup configuration, manual operation, single-instance scheduling guidance, 30-day retention, and restore instructions. | Restore should be tested against a separate database. |
| `backend/package.json` | Backend package metadata, ESM mode, `dev`, `start`, `seed`, `seed:barangays`, and `backup` scripts; direct dependencies. | Version 1.0.0; no engine or test script. |
| `backend/package-lock.json` | Locked backend dependency graph and resolved versions. | npm lockfile version 3. |
| `backend/server.js` | Express bootstrap, Helmet/CSP, CORS allowlist, JSON limit, global limiter, Swagger UI, route mounts, health route, DB startup, superadmin warning, optional node-cron backup, and listener. | API routers are mounted under `/api`; `/api-docs` is mounted outside that prefix. The current worktree uses Express 5 named-splat syntax for the OPTIONS wildcard. |
| `backend/swagger.js` | Hand-built OpenAPI 3.0.3 paths, common schemas, bearer scheme, and local/deployed server URLs. | Several current auth/user paths are absent; see Known Issues. |
| `backend/config/db.js` | Requires `MONGO_URI`, connects Mongoose, synchronizes Report/User text indexes, and logs the connected host. | Index synchronization may drop a differing text index. |

### 6.3 Backend controllers

| File | Purpose / implementation | Notes |
|---|---|---|
| `backend/controllers/activityController.js` | Role-specific activity queries with pagination, role/date filters, escaped text search, sort, and barangay scoping. | Returns both `entries` and `activities` for compatibility. |
| `backend/controllers/analyticsController.js` | Reads precomputed Spark collections and returns their rows to authorized API callers. | Uses MongoDB native collection reads through the active Mongoose connection. |
| `backend/controllers/authController.js` | Registration, email verification, email OTP and WebAuthn login, two-step email/password changes, token issue/revoke, reset-code flow, and activity writes. | Public register currently accepts privileged roles; critical issue in Section 12. |
| `backend/controllers/contactController.js` | Creates public contact messages, lists admin messages, changes status, and creates notifications for received contact. | Contact route is rate-limited. |
| `backend/controllers/notificationController.js` | Lists caller-owned notifications and marks individual/all notifications read or unread. | Query ownership is by `recipientId`. |
| `backend/controllers/reportController.js` | Public/privileged report queries, bounds/search filters, pagination, CSV export, report creation, duplicate detection, updates, status/priority, assignment, deletion, image cleanup, notifications, and activity. | Barangay scoping applies to supported report operations; delete handlers physically remove report records. |
| `backend/controllers/statisticsController.js` | Public aggregates and privileged/barangay-scoped overview, category, status, priority, area, and timeline aggregates. | Barangay users are restricted to their assigned barangay in parameterized views. |
| `backend/controllers/systemController.js` | Loads/creates singleton settings, validates partial updates, and stores Cloudinary logo URL. | Superadmin-only routes. |
| `backend/controllers/userController.js` | User statistics, search/list, self preferences, account creation/update/password, suspension/ban/unsuspend, status changes, deletion, role hierarchy, and notification creation. | Every suspension increments the stored count; the third suspension auto-bans and triggers user/admin email notifications. |

### 6.4 Backend middleware

| File | Purpose / implementation | Notes |
|---|---|---|
| `backend/middleware/auth.js` | Verifies JWT bearer tokens, rejects login-challenge tokens, checks SHA-256 token blacklist and active user, attaches `req.user`; exports role guards. | `isOperationsManager` allows superadmin/admin/barangay; `isAdmin` allows superadmin/admin. |
| `backend/middleware/errorHandler.js` | JSON 404 and centralized duplicate, validation, cast, JWT, and generic error responses. | Logs raw error objects server-side; review production redaction. |
| `backend/middleware/loginLockout.js` | IP+normalized-email in-memory lockout after three failures for five minutes. | Process-local map; not shared between instances. |
| `backend/middleware/rateLimit.js` | Global, auth, contact, forgot/reset password, and report-submission rate limiters with Retry-After responses. | Default store is process-local. |
| `backend/middleware/upload.js` | Multer plus Cloudinary storage for JPG/JPEG/PNG/WebP, 5 MB per file, width limit 1200. | Filters by client MIME type; does not inspect file signatures. |
| `backend/middleware/validate.js` | Password policy; registration/login/email/reset/report/user/contact and mutation validators; Mongo ID/pagination/bulk checks; Dagupan bounds/barangay checks. | Validation errors are returned as 400 or 422 depending on validator chain. |

### 6.5 Backend models

| File | Purpose / implementation | Notes |
|---|---|---|
| `backend/models/ActivityLog.js` | Actor, role, scope, action, message, details, and entity/target references with timestamps and indexes. | Stores an audit history. |
| `backend/models/Category.js` | Name/icon/color/active category schema. | No route or active source import found; likely legacy/unused. |
| `backend/models/ContactMessage.js` | Sender, email, subject, message, `new/read/resolved` status, timestamps. | Contact inbox persistence. |
| `backend/models/Notification.js` | Recipient ID/role, event type, title/message, reference, read state, timestamps and recipient indexes. | Only superadmin/admin/barangay recipient roles. |
| `backend/models/Report.js` | Hazard description, category, GeoJSON location, evidence, reporter, assignment, status/priority, resolution, archive/duplicate/activity fields and indexes. | Mongo 2dsphere, text, and compound status/category/priority indexes. |
| `backend/models/SystemSettings.js` | Singleton system name/logo, categories, statuses, roles, maintenance/notification flags, hierarchy and permission matrix. | Key defaults to `global`. |
| `backend/models/TokenBlacklist.js` | SHA-256 token hash, user ID, expiry, timestamps. | TTL index removes expired blacklist entries. |
| `backend/models/User.js` | Identity, credentials, role/barangay, account lifecycle, preferences, email verification and change, password change/reset, login OTP, WebAuthn credentials/challenges, known devices, and `authVersion`. | Includes `suspensionCount` and `suspensionHistory`; passwords are `select: false` and bcryptjs-hashed at cost 12. |

### 6.6 Backend routes

| File | Purpose / implementation |
|---|---|
| `backend/routes/activity.js` | Authenticated activity route declarations and role-specific handlers. |
| `backend/routes/analytics.js` | Privileged-role read routes for Spark batch/window collections. |
| `backend/routes/auth.js` | Registration, verification, password, login, 2FA, refresh, logout, and profile routes with rate limits and validators. |
| `backend/routes/contact.js` | Public rate-limited contact submission plus protected admin inbox/status routes. |
| `backend/routes/notifications.js` | Protected notification list/read-state routes for privileged notification roles. |
| `backend/routes/reports.js` | Public reduced report list plus protected report submission and privileged/admin report workflows. |
| `backend/routes/statistics.js` | Public statistics and protected privileged/barangay report aggregates. |
| `backend/routes/system.js` | Superadmin-only settings and logo upload routes. |
| `backend/routes/users.js` | Authenticated self-preferences routes and admin/superadmin user-management routes. |

### 6.7 Backend scripts and seeders

| File | Purpose / operational note |
|---|---|
| `backend/scripts/archiveClosedReports.js` | Marks closed reports archived; explicitly refuses production. |
| `backend/scripts/backfillVerified.js` | Marks all users email-verified, active, and verification-not-required. No production guard; review target database before running. |
| `backend/scripts/backup.js` | `mongodump --archive --gzip`, B2 Native API upload, SHA-1, deletion of versions older than 30 days, temporary-file cleanup, optional alert email. | Windows default points to MongoDB Tools `100` path; `MONGODUMP_PATH` overrides it; Linux uses PATH. |
| `backend/scripts/clearReports.js` | Permanently deletes every report. No production guard; destructive. |
| `backend/scripts/clearSeededReports.js` | Requires typed confirmation and refuses production; deletes only `seeded: true` reports. |
| `backend/scripts/clearSeededUsers.js` | Requires typed confirmation and refuses production; deletes users with role `user`. |
| `backend/scripts/enable2FA.js` | Enables 2FA for privileged roles and disables it for other roles. No production guard; migration. |
| `backend/scripts/enforce2FAPrivileged.js` | Dry-run by default; with `--confirm`, enables 2FA only for privileged users missing it and writes an activity log per update. Refuses production without `--confirm`. |
| `backend/scripts/removeStaffRole.js` | `--dry-run` lists legacy-role accounts; `--confirm` migrates each to `user`, writes an activity log per account, and removes the obsolete role from global settings. Production changes require `--confirm`. |
| `backend/scripts/barangay-resolution.test.mjs` | Direct `node:test` coverage for polygon resolution and report-creation coordinates. | Includes mocked controller-level checks; no npm test script is declared. |
| `backend/scripts/feature-regression.test.mjs` | Direct `node:test` checks for device fingerprints, known devices, email templates, and barangay resolution. | Run directly with Node's test runner; no npm test script is declared. |
| `backend/scripts/fixSuperAdminRole.js` | Repairs one canonical superadmin record and prints remaining `user` accounts. | Contains source-coded account identifier; do not treat as general provisioning. |
| `backend/scripts/removeBackupCodes.js` | Unsets legacy backup-code fields for all matching users. No production guard. |
| `backend/scripts/reset-db-state.mjs` | Destructively clears reports and selected users, then inserts fixture accounts. No production guard; do not run against production. |
| `backend/scripts/seedCitizens.js` | Imports CSV citizens in batches, with `--dry-run`, 25,000 default target, 400 MB database cap, and production refusal. | Has a source fallback seed password; set a private development value and use a disposable database. |
| `backend/scripts/seedReports.js` | Imports synthetic/report-like rows from `sf311_cases.csv` in batches, up to 45,000 by default; 400 MB cap and production refusal. |
| `backend/scripts/setNotificationEmails.js` | Sets a fixed notification email for privileged users and clears it for others. No production guard; inspect before running. |
| `backend/scripts/testEmail.js` | Sends an actual Brevo test email to `EMAIL_TEST_TO` or `EMAIL_FROM`. External side effect. |
| `backend/seeders/seed.js` | Creates/reuses demo accounts and activity entries; deletes all reports before seeding. Destructive and source-coded demo credentials; development only. |
| `backend/seeders/seedBarangays.js` | Creates missing barangay accounts without overwriting existing accounts. Source-coded initial credentials; development-only handling required. |
| `backend/seeders/data/crm_customers.csv` | Input data for the citizen seeder. Review provenance/PII before sharing or deployment. |
| `backend/seeders/data/sf311_cases.csv` | Input data for report seeding. Review provenance/PII before sharing or deployment. |

### 6.8 Spark analytics files and generated state

| File | Purpose / implementation | Notes |
|---|---|---|
| `backend/spark/README.md` | Spark setup, connector, job execution, scheduler, output collections, stream fallback, and demo notes. | Documents local-mode operation. |
| `backend/spark/__init__.py` | Python package marker. | No additional implementation. |
| `backend/spark/requirements.txt` | Python dependencies: PySpark, PyMongo, python-dotenv, schedule. | Versions unpinned. |
| `backend/spark/scheduler.py` | Runs batch at startup/hourly and window job daily at midnight; catches job failures and continues. | Separate process; not automatically launched by Express. |
| `backend/spark/jobs/__init__.py` | Spark jobs package marker. | No additional implementation. |
| `backend/spark/jobs/batch_analytics.py` | Reads active, non-archived reports and overwrites batch aggregates for barangay/category/priority/status/day. | Writes five analytics collections. |
| `backend/spark/jobs/window_analytics.py` | Computes tumbling hourly/daily, sliding 1-hour/10-minute, and 30-minute reporter session windows. | Overwrites four window collections. |
| `backend/spark/jobs/streaming_analytics.py` | MongoDB change-stream aggregation with watermark and JSON-file fallback; upserts per-minute barangay/category/priority counts. | Runtime checkpoints under ignored `checkpoints/streaming/`. |
| `backend/spark/utils/__init__.py` | Spark utility package marker. | No additional implementation. |
| `backend/spark/utils/mongo_config.py` | Loads `backend/.env`, chooses Mongo URI/database/collection, declares expected report columns and analytics collection names. | Spark URI strips query string for Windows submit compatibility. |
| `backend/spark/utils/spark_session.py` | Creates local SparkSession and configures MongoDB Spark Connector 11.1.0. | Uses `local[*]` and Scala 2.13 connector. |
| `backend/spark/checkpoints/barangay/metadata` | Tracked Spark checkpoint metadata. | Generated runtime state, not source; review whether it belongs in version control. |
| `backend/spark/checkpoints/barangay/.metadata.crc` | Hadoop checksum sidecar for checkpoint metadata. | Generated artifact. |
| `backend/spark/checkpoints/category/metadata` | Tracked Spark checkpoint metadata. | Generated runtime state. |
| `backend/spark/checkpoints/category/.metadata.crc` | Hadoop checksum sidecar. | Generated artifact. |
| `backend/spark/checkpoints/priority/metadata` | Tracked Spark checkpoint metadata. | Generated runtime state. |
| `backend/spark/checkpoints/priority/.metadata.crc` | Hadoop checksum sidecar. | Generated artifact. |
| `backend/spark/jobs/__pycache__/batch_analytics.cpython-314.pyc` | Compiled Python bytecode. | Generated; tied to CPython 3.14; not source. |
| `backend/spark/jobs/__pycache__/streaming_analytics.cpython-314.pyc` | Compiled Python bytecode. | Generated artifact. |
| `backend/spark/jobs/__pycache__/window_analytics.cpython-314.pyc` | Compiled Python bytecode. | Generated artifact. |
| `backend/spark/utils/__pycache__/__init__.cpython-314.pyc` | Compiled Python bytecode. | Generated artifact. |
| `backend/spark/utils/__pycache__/mongo_config.cpython-314.pyc` | Compiled Python bytecode. | Generated artifact. |
| `backend/spark/utils/__pycache__/spark_session.cpython-314.pyc` | Compiled Python bytecode. | Generated artifact. |

### 6.9 Backend utilities

| File | Purpose / implementation | Notes |
|---|---|---|
| `backend/utils/createNotification.js` | Creates in-app notifications and optionally sends email based on system and user preferences. | Failures are logged and swallowed to avoid blocking parent workflows. |
| `backend/utils/dagupanBarangays.js` | Canonical barangay names, coordinate bounds/centers, location validation, and nearest-barangay helper. | Used by report validation. |
| `backend/utils/generateToken.js` | Legacy JWT helper with `JWT_EXPIRES_IN`/seven-day fallback. | No active import found; auth controller has its own role-based token issuer. |
| `backend/utils/logActivity.js` | Normalizes actor metadata and inserts ActivityLog records. | Shared by auth/report/user controllers. |
| `backend/utils/priorityCalculator.js` | Keyword-based category/description priority calculation. | New reports receive computed priority. |
| `backend/utils/sendEmail.js` | Brevo transactional sender and templates for account verification, reset, 2FA, email/password changes, new-device alerts, suspensions, and auto-bans. | Requires `BREVO_API_KEY` and `EMAIL_FROM`. |

### 6.10 Documentation and security collection

| File | Purpose / implementation | Notes |
|---|---|---|
| `docs/API-Reference.md` | Human-maintained API endpoint summary and report submission notes. | Does not yet document all current auth/user endpoints. |
| `docs/OWASP-Threat-Model.md` | OWASP Top 10 source-level threat mapping, controls, gaps, and evidence checklist. | Assessment date predates current auth/token changes; revalidate. |
| `docs/VAPT-Report.md` | Source-level findings and pending runtime VAPT evidence. | Runtime scans/tests are marked pending; some status claims need revalidation. |
| `docs/architecture.md` | Mermaid system, DFD, login, and report-submission diagrams. | Describes Vercel, Render, MongoDB Atlas, Cloudinary, and map services. |
| `postman/HazardWatch Security Tests.postman_collection.json` | Postman security and API test collection. | Docs mention a different filename; update documentation/collection consistency. |

### 6.11 Frontend configuration, entry, and assets

| File | Purpose / implementation | Notes |
|---|---|---|
| `frontend/package.json` | Frontend package scripts, dependencies, and version 1.0.0. | Scripts: `dev`, `build`, `preview`; no test/lint script. |
| `frontend/package-lock.json` | Locked frontend package graph. | Lockfile version 3. |
| `frontend/index.html` | SPA document, metadata, root mount, public logo icon, and `src/main.jsx` entry. | Browser title is updated by React route logic. |
| `frontend/vite.config.js` | React plugin, ES-format worker plugin, worker/build configuration, polling watcher, and local API/upload proxy. | `optimizeDeps.exclude` is empty; the proxy target is `http://localhost:5000`. |
| `frontend/tailwind.config.js` | Tailwind source globs and class-based dark mode; no custom theme extensions/plugins. | Existing palette remains Tailwind defaults plus inline app colors. |
| `frontend/postcss.config.js` | Tailwind and Autoprefixer PostCSS plugins. | Build configuration. |
| `frontend/vercel.json` | Vercel asset passthrough and SPA `index.html` rewrite that excludes `/assets/*` from the fallback. | Hosting rewrite only; no backend deployment configuration. |
| `frontend/public/globe.png` | Homepage globe image. | Animated by the homepage's `.globe-spin` wrapper. |
| `frontend/public/hazardwatch-logo.png` | Favicon/apple-touch icon referenced by `index.html`. | Public static image. |
| `frontend/public/channel1.jpg`–`channel3.jpg`, `manual1.jpg`–`manual3.jpg`, `status1.jpg`–`status3.jpg`, `trend1.jpg`–`trend3.jpg` | Public channel, manual, status, and trend imagery. | Static assets referenced by public content. |
| `frontend/public/mission-illustration.png` | Public About-page mission illustration. | Served from `/mission-illustration.png`. |
| `frontend/src/main.jsx` | React StrictMode mount, global CSS import, manual scroll-restoration setting, and explicit MapLibre worker URL registration. | The worker is imported through Vite's `?worker&url` handling. |
| `frontend/src/App.jsx` | Provider composition, client routes, role layouts/guards, fallback redirects, and page-title mapping. | Public routes are composed under the shared public layout. |
| `frontend/src/App.css` | App-specific CSS rules. | Review import/use; not the primary global theme file. |
| `frontend/src/index.css` | Tailwind layers, global sizing/overflow, app utility classes, map controls, theme overrides, and homepage globe spin keyframes. | The 60-second spin is disabled for reduced-motion preferences. |
| `frontend/src/assets/hazardwatch-logo.png` | Bundled logo asset. | No import found in current source; likely duplicate/unused. |
| `frontend/src/assets/hero.png` | Bundled hero image. | No import found in current source; review whether legacy. |
| `frontend/src/assets/react.svg` | Vite/React starter asset. | No import found; likely template leftover. |
| `frontend/src/assets/vite.svg` | Vite starter asset. | No import found; likely template leftover. |

### 6.12 Frontend components

| File | Purpose / implementation | Notes |
|---|---|---|
| `frontend/src/components/ActivityPage.jsx` | Shared activity page with search, date filters, pagination, human-readable dates, and reason details. | Role-specific wrappers provide different role tabs. |
| `frontend/src/components/BanUserModal.jsx` | User-ban confirmation/reason modal. | Administrative workflow. |
| `frontend/src/components/CommunitySections.jsx` | Public community participation and safer-community content sections. | Legacy/optional public content. |
| `frontend/src/components/InteractiveMap.jsx` | MapLibre map, raster styles, markers/clusters, report popups, location selection, bounds callbacks, and Nominatim reverse geocoding. | Uses OSM/Esri/OpenTopoMap raster tiles. |
| `frontend/src/components/PasswordToggle.jsx` | Password visibility control. | Shared form component. |
| `frontend/src/components/SessionExpiryModal.jsx` | Session-expiry warning with refresh/logout actions. | Driven by AuthContext. |
| `frontend/src/components/StaticMap.jsx` | Static map/coordinate display. | Used by public home presentation. |
| `frontend/src/components/SuspendUserModal.jsx` | Suspension duration/reason dialog, including a five-second test duration and custom date. | Administrative workflow. |
| `frontend/src/components/common/AnalyticsPanel.jsx` | Spark analytics API loading and chart presentation. | Route usage should be checked before assuming user-facing availability. |
| `frontend/src/components/common/ArchivedReportsPage.jsx` | Shared archived-report listing. | Used with role-specific base paths. |
| `frontend/src/components/common/CodeInput.jsx` | Multi-digit verification/reset code input. | Used by email/2FA flows. |
| `frontend/src/components/common/ConfirmModal.jsx` | Confirmation dialog rendered by ConfirmContext. | Accessible reusable modal. |
| `frontend/src/components/common/CountUp.jsx` | Count-up presentation helper. | Shared numeric display. |
| `frontend/src/components/common/CursorGlow.jsx` | Pointer-following public-shell visual effect. | Mounted by PublicLayout. |
| `frontend/src/components/common/ImageGallery.jsx` | Report image gallery/preview. | Used in report detail workflows. |
| `frontend/src/components/common/MapReportList.jsx` | Map-adjacent report list and selection UI. | Shared map/report component. |
| `frontend/src/components/common/NotificationBell.jsx` | Notification trigger and unread count. | Uses notification API. |
| `frontend/src/components/common/NotificationCenterPage.jsx` | Notification list/filter/read-state page. | Shared role-specific page content. |
| `frontend/src/components/common/NotificationDropdown.jsx` | Notification preview dropdown. | Uses notification API. |
| `frontend/src/components/common/Pagination.jsx` | Reusable pagination controls. | Shared list UI. |
| `frontend/src/components/common/ScrollToTop.jsx` | Scrolls on route changes. | Mounted in App. |
| `frontend/src/components/common/Skeleton.jsx` | Loading placeholder. | Shared loading UI. |
| `frontend/src/components/common/ToastContent.jsx` | Custom toast content. | Used with Sonner. |
| `frontend/src/components/common/UserFormModal.jsx` | Create/edit user form modal. | Administrative workflow. |
| `frontend/src/components/layout/AdminLayout.jsx` | Admin/superadmin shell with sidebar and outlet. | Active layout imported by App. |
| `frontend/src/components/layout/AdminSidebar.jsx` | Admin/superadmin sidebar navigation. | Role-aware links. |
| `frontend/src/components/layout/BarangayLayout.jsx` | Barangay shell with navigation and nested outlet. | Protected in App routes. |
| `frontend/src/components/layout/BarangaySidebar.jsx` | Barangay navigation. | Barangay-specific route links. |
| `frontend/src/components/layout/Footer.jsx` | Public footer/navigation/contact details. | Mounted by PublicLayout. |
| `frontend/src/components/layout/Navbar.jsx` | Public navigation, mobile menu, account actions, and login/logout controls. | Shared by public pages. |
| `frontend/src/components/layout/PrivilegedTopBar.jsx` | Shared fixed privileged-area top bar with notifications and logout. | Used with admin and barangay layouts. |
| `frontend/src/components/layout/layoutConstants.js` | Shared privileged layout dimensions. | Imported by the top bar and layout components. |
| `frontend/src/components/layout/ProtectedRoute.jsx` | Client-side authentication, role, and optional barangay guard. | Backend authorization remains authoritative. |
| `frontend/src/components/layout/PublicLayout.jsx` | Public shell composing CursorGlow, Navbar, page content, and Footer. | Shared public route wrapper. |
| `frontend/src/components/layout/Sidebar.jsx` | Older/general sidebar implementation. | Review usage; not selected by current App layout imports. |
| `frontend/src/components/layout/ThemeToggle.jsx` | Dark/light/system theme selector control. | Uses ThemeContext. |
| `frontend/src/components/settings/MapPreferencesSection.jsx` | Map display preference form. | Uses map preference API/state. |
| `frontend/src/components/settings/SettingsCard.jsx` | Settings panel wrapper. | Shared settings UI. |
| `frontend/src/components/settings/SettingsDashboard.jsx` | Settings composition for supported roles. | Used by nested admin/barangay routes. |
| `frontend/src/components/settings/SettingsSection.jsx` | Settings section layout. | Shared settings UI. |
| `frontend/src/components/settings/SettingsToggle.jsx` | Boolean settings control. | Shared settings UI. |

### 6.13 Frontend contexts, hooks, services, and route pages

| File | Purpose / implementation | Notes |
|---|---|---|
| `frontend/src/context/AuthContext.jsx` | Login/register/verification, OTP/WebAuthn, email/password-change, reset/profile/preferences, and session API; persists bearer token and user. | Includes expiry warning and logout; tokens are persisted in localStorage. |
| `frontend/src/context/ConfirmContext.jsx` | Promise-based confirmation state and modal provider. | Used by shared alerts/dialog workflows. |
| `frontend/src/context/ReportContext.jsx` | Report fetch/submit/update/delete state, public bounds fetch, client bounds guard, and report update events. | Server validation is also implemented. |
| `frontend/src/context/ThemeContext.jsx` | User/guest light/dark/system preference storage and document theme class/data attribute. | Theme defaults to dark. |
| `frontend/src/hooks/useAuth.js` | AuthContext accessor. | Throws when used outside provider. |
| `frontend/src/hooks/useDebounce.js` | Debounced value hook. | Shared filtering/search behavior. |
| `frontend/src/hooks/useTheme.js` | ThemeContext accessor. | Throws when used outside provider. |
| `frontend/src/hooks/useViewportReports.js` | Debounced, abortable report fetch keyed to map viewport bounds and scope. | Cancels stale requests. |
| `frontend/src/services/alerts.js` | Alert/confirmation service wrappers. | Used by UI workflows. |
| `frontend/src/services/api.js` | Axios base URL, bearer injection, FormData handling, 401 session clearing, and API helper objects for analytics, notifications, preferences, 2FA, and system settings. | Default API origin is the deployed Render API. |
| `frontend/src/services/reportOptions.js` | Status/priority colors, Dagupan barangays/coordinates, hazard category groups, and chart styles. | UI category source; backend validation has a separate list. |
| `frontend/src/services/validation.js` | Client email/password patterns and messages. | Server validation remains authoritative. |
| `frontend/src/pages/public/AboutPage.jsx` | About/story content, full-screen map hero, animated tagline, mission, four story milestones, six core pillars, and report CTA. | Uses AOS for local scroll reveals. |
| `frontend/src/pages/public/ContactPage.jsx` | Public contact form. | Posts to `/contact`. |
| `frontend/src/pages/public/EnterResetCodePage.jsx` | Password-reset email code verification. | Uses `/auth/verify-reset-code`. |
| `frontend/src/pages/public/ForgotPasswordPage.jsx` | Password-reset request form. | Uses `/auth/forgot-password`. |
| `frontend/src/pages/public/HazardMapPage.jsx` | Public hazard map with viewport-filtered report pins. | Status legend is top-left; barangay selector is bottom-left. |
| `frontend/src/pages/public/HomePage.jsx` | Public landing page, hazard categories, public report statistics, report/map CTAs, and viewport-centered globe background. | Globe rotates continuously via CSS; Framer Motion scroll transforms use desktop scale 1.15 to 0.5 (mobile 1 to 0.6), opacity 1 to 0, and y 0 to -100. Reduced motion disables the globe animation/transforms. |
| `frontend/src/pages/public/LoginPage.jsx` | Credential and biometric login with role-based post-login navigation. | Privileged accounts require a second factor; email OTP is available as an alternative to biometrics. |
| `frontend/src/pages/public/MyReportsPage.jsx` | Authenticated user's report list/detail navigation. | Uses own-report API. |
| `frontend/src/pages/public/PrivacyPolicyPage.jsx` | Static privacy policy content. | Public route. |
| `frontend/src/pages/public/ProfilePage.jsx` | Profile, password, preferences, and account controls. | Authenticated route. |
| `frontend/src/pages/public/RegisterPage.jsx` | Registration, password validation, availability check, and terms acceptance. | Public registration role escalation is a backend issue. |
| `frontend/src/pages/public/ReportDetailPage.jsx` | Public/citizen report detail presentation. | Route uses report ID. |
| `frontend/src/pages/public/ResetPasswordPage.jsx` | New-password form using verified reset token. | Server enforces password policy. |
| `frontend/src/pages/public/SubmitReport.jsx` | Authenticated multipart hazard report form with map selection, photos, categories, and validation. | Up to three image files. |
| `frontend/src/pages/public/TermsOfServicePage.jsx` | Static terms content. | Public route. |
| `frontend/src/pages/public/TrackReportPage.jsx` | Report tracking screen. | Route `/track`. |
| `frontend/src/pages/public/TwoFactorPage.jsx` | Login OTP verification/resend screen. | Uses temporary login challenge token. |
| `frontend/src/pages/public/VerifyEmailPage.jsx` | Email verification code screen. | Uses `/auth/verify-email`. |
| `frontend/src/pages/admin/AdminActivityPage.jsx` | Admin activity log page. | Tabs: All, Barangay, and User. |
| `frontend/src/pages/admin/AdminArchivedPage.jsx` | Admin/superadmin archived report wrapper. | Uses shared archived page. |
| `frontend/src/pages/admin/AdminDashboard.jsx` | Admin operations dashboard and report charts. | Uses Recharts and statistics APIs. |
| `frontend/src/pages/admin/AdminLayout.jsx` | Alternate page-local admin shell. | No import found; likely legacy/dead implementation. |
| `frontend/src/pages/admin/AdminMapPage.jsx` | Admin report map/list. | Protected admin route. |
| `frontend/src/pages/admin/AdminNotificationsPage.jsx` | Admin notification center wrapper. | Uses shared notification page. |
| `frontend/src/pages/admin/AdminReportDetailPage.jsx` | Admin report detail and management actions. | Protected route. |
| `frontend/src/pages/admin/AdminReportsPage.jsx` | Admin report queue, filters, export, status/priority and deletion actions. | Also wraps resolved-only mode. |
| `frontend/src/pages/admin/AdminResolvedReportsPage.jsx` | Resolved-report configuration of AdminReportsPage. | Wrapper. |
| `frontend/src/pages/admin/AdminSettingsPage.jsx` | Older admin settings page. | App uses shared SettingsDashboard; review whether this is still needed. |
| `frontend/src/pages/admin/AdminUsersPage.jsx` | Admin user management. | Protected route. |
| `frontend/src/pages/barangay/BarangayActivityPage.jsx` | Barangay activity page implementation. | Not registered in current App routes; review. |
| `frontend/src/pages/barangay/BarangayArchivedPage.jsx` | Barangay archived reports. | Protected route. |
| `frontend/src/pages/barangay/BarangayDashboard.jsx` | Barangay dashboard and scoped report summary. | Protected route. |
| `frontend/src/pages/barangay/BarangayMapPage.jsx` | Barangay-scoped map and report list. | Protected route. |
| `frontend/src/pages/barangay/BarangayNotificationsPage.jsx` | Barangay notification center wrapper. | Protected route. |
| `frontend/src/pages/barangay/BarangayReportDetail.jsx` | Barangay report detail and allowed actions. | Protected route. |
| `frontend/src/pages/barangay/BarangayReportsPage.jsx` | Barangay report queue, filters, updates, and resolved mode. | Protected route. |
| `frontend/src/pages/barangay/BarangaySettingsPage.jsx` | Older standalone barangay settings page. | App uses shared SettingsDashboard; review usage. |
| `frontend/src/pages/barangay/bonuan/BonuanDashboard.jsx` | Bonuan-specific dashboard implementation. | No import found; likely legacy/unrouted. |
| `frontend/src/pages/barangay/bonuan/BonuanReportDetail.jsx` | Bonuan-specific detail implementation. | No import found; likely legacy/unrouted. |
| `frontend/src/pages/barangay/bonuan/BonuanReportsPage.jsx` | Bonuan-specific report list implementation. | No import found; likely legacy/unrouted. |
| `frontend/src/pages/barangay/lucao/LucaoDashboard.jsx` | Lucao-specific dashboard implementation. | No import found; likely legacy/unrouted. |
| `frontend/src/pages/barangay/lucao/LucaoReportDetail.jsx` | Lucao-specific detail implementation. | No import found; likely legacy/unrouted. |
| `frontend/src/pages/barangay/lucao/LucaoReportsPage.jsx` | Lucao-specific report list implementation. | No import found; likely legacy/unrouted. |
| `frontend/src/pages/barangay/tapuac/TapuacDashboard.jsx` | Tapuac-specific dashboard implementation. | No import found; likely legacy/unrouted. |
| `frontend/src/pages/barangay/tapuac/TapuacReportDetail.jsx` | Tapuac-specific detail implementation. | No import found; likely legacy/unrouted. |
| `frontend/src/pages/barangay/tapuac/TapuacReportsPage.jsx` | Tapuac-specific report list implementation. | No import found; likely legacy/unrouted. |
| `frontend/src/pages/superadmin/SuperAdminActivityPage.jsx` | Superadmin activity log screen. | Tabs: All, Admin, Barangay, User, and SuperAdmin. |
| `frontend/src/pages/superadmin/SuperAdminDashboard.jsx` | Superadmin operations dashboard. | Protected route. |
| `frontend/src/pages/superadmin/SuperAdminNotificationsPage.jsx` | Superadmin notification center wrapper. | Protected route. |
| `frontend/src/pages/superadmin/SuperAdminReportDetailPage.jsx` | Superadmin report detail/actions. | Protected route. |
| `frontend/src/pages/superadmin/SuperAdminReportsPage.jsx` | Superadmin report queue and actions. | Protected route. |
| `frontend/src/pages/superadmin/SuperAdminSettings.jsx` | Older standalone superadmin settings page. | Current App uses shared SettingsDashboard; review usage. |
| `frontend/src/pages/superadmin/SuperAdminUsers.jsx` | Superadmin user-management screen. | Protected route. |

## 7. Environment Variables

Only variable names are documented. Do not copy values from local `.env` files. `backend/.env.example` is names-only and does not currently include every optional variable consumed by scripts or Spark.

| Name | Purpose | Required | Default / behavior |
|---|---|---|---|
| `MONGO_URI` | Backend and Spark MongoDB connection. | Backend required; Spark has local fallback. | Spark falls back to local `hazardwatch` database if unset. |
| `JWT_SECRET` | Signs/verifies access and temporary challenge JWTs. | Required for auth. | No safe production default. |
| `JWT_EXPIRES_IN` | Legacy `generateToken.js` expiry only. | No for active auth issuer. | Legacy helper defaults to seven days; active controller sets role-based expiry. |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account. | Required for uploads. | None. |
| `CLOUDINARY_API_KEY` | Cloudinary authentication. | Required for uploads. | None. |
| `CLOUDINARY_API_SECRET` | Cloudinary authentication. | Required for uploads. | None. |
| `BREVO_API_KEY` | Transactional email API. | Required for email delivery. | None. |
| `EMAIL_FROM` | Verified email sender. | Required for email delivery. | None. |
| `EMAIL_FROM_NAME` | Sender display name. | No. | `HazardWatch`. |
| `CLIENT_URL` | Comma-separated additional CORS origins. | No. | Built-in local and deployed origins remain allowed. |
| `WEBAUTHN_RP_ID` | WebAuthn relying-party ID, normally the frontend hostname. | No. | Defaults to the request origin hostname; must match the frontend domain or its parent domain. |
| `WEBAUTHN_RP_NAME` | WebAuthn relying-party display name. | No. | `HazardWatch Dagupan`. |
| `ADMIN_NOTIFICATION_EMAIL` | Recipient for automatic-ban notifications. | No. | Falls back to `EMAIL_FROM`, then a source-coded legacy value; see Section 12. |
| `NODE_ENV` | Production/development behavior and script guards. | Recommended. | No manifest default. |
| `PORT` | Express listen port. | No. | `5000`. |
| `B2_KEY_ID` | Backblaze B2 API authentication. | Required for backup. | None. |
| `B2_APP_KEY` | Backblaze B2 API authentication. | Required for backup. | None. |
| `B2_BUCKET_ID` | Target private backup bucket. | Required for backup. | None. |
| `BACKUP_CRON_ENABLED` | Enables API-process backup scheduling. | No. | Disabled unless exactly `true`. |
| `BACKUP_CRON_SCHEDULE` | node-cron schedule. | No. | `0 2 * * *`. |
| `BACKUP_TIMEZONE` | node-cron timezone. | No. | `UTC`. |
| `BACKUP_ALERT_EMAIL` | Backup-failure alert recipient. | No. | No email alert if absent. |
| `MONGODUMP_PATH` | Override mongodump executable. | No. | Windows uses configured Tools `100` path; other platforms use `mongodump` from PATH. |
| `VITE_API_URL` | Frontend API base URL. | No. | Deployed Render `/api` origin. |
| `MONGO_DB_NAME` | Spark database override. | No. | Takes precedence over `DB_NAME` and URI database. |
| `DB_NAME` | Alternate Spark database override. | No. | URI database or `hazardwatch`. |
| `REPORTS_COLLECTION` | Spark input collection. | No. | `reports`. |
| `HADOOP_HOME` | Optional Windows Hadoop tools location for Spark `winutils.exe`. | Environment-dependent. | Not read by application code; Spark setup documentation only. |
| `MAX_USERS` | Citizen seed target. | No. | 25,000 in script. |
| `SEED_CITIZEN_PASSWORD` | Citizen seeder password override. | Set for safe development seeding. | Script contains a source fallback; do not rely on it. |
| `MAX_REPORTS` | Report seed target. | No. | 45,000 in script. |
| `EMAIL_TEST_TO` | Optional destination for manual email test. | No. | Falls back to `EMAIL_FROM`. |

`backend/.env.example` specifically lists `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, Cloudinary values, Brevo/email values, WebAuthn relying-party settings, `CLIENT_URL`, `NODE_ENV`, B2 values, and backup schedule settings. `ADMIN_NOTIFICATION_EMAIL`, `MONGODUMP_PATH`, `PORT`, Spark overrides, and seed/test values are code/documentation-only optional variables.

## 8. Data Models / Schema

- **User (`users`):** Name/email, hidden password hash, role (`superadmin`, `admin`, `barangay`, `user`), barangay/phone, active/status and suspension/ban/deletion lifecycle, `suspensionCount` and `suspensionHistory`, profile image, nested theme/map/notification preferences, email verification/change state, login OTP and WebAuthn credentials/challenges, known devices, password-change/reset state, `authVersion`, and timestamps. Passwords hash through bcryptjs cost 12. Legacy Google identity fields remain in schema.
- **Report (`reports`):** Title, category/custom category, description, GeoJSON Point `[longitude, latitude]`, address/barangay, photo/image URLs, status (`Pending`, `In Progress`, `Resolved`, `Closed`), priority (`Low`, `Medium`, `High`, `Urgent`), reporter snapshot, assignee/assigned barangay, resolution, views, archive/duplicate/active/seeded/deleted fields, timestamps. Includes 2dsphere, text, and compound status/category/priority indexes. Although `deletedAt` exists in the schema, current report DELETE handlers physically delete documents and stored images.
- **ActivityLog (`activitylogs`):** User/actor references, actor name/role/barangay, scope, action/message/details, entity/target type and IDs, timestamps.
- **Notification (`notifications`):** Recipient ID/role, event type, title/message, optional referenced model/ID, read/readAt, creation date; indexes by recipient/read/time.
- **ContactMessage (`contactmessages`):** Name, email, subject, message, status, timestamps.
- **SystemSettings (`systemsettings`):** Singleton `global` key, system identity/logo, hazard categories, report statuses, priorities, roles, maintenance and notifications flags, default role, role hierarchy, permission matrix, timestamps.
- **TokenBlacklist (`tokenblacklists`):** SHA-256 token hash, user ID, token expiry, creation timestamp; TTL index expires old entries.
- **Category (`categories`):** Unique name, icon, color, active flag. Schema exists but no active route/import was found.
- **Spark analytics collections:** `analytics_reports_per_barangay`, `analytics_reports_per_category`, `analytics_reports_per_priority`, `analytics_reports_per_status`, `analytics_reports_per_day`, `analytics_tumbling_hourly`, `analytics_tumbling_daily`, `analytics_sliding_1h_10m`, `analytics_session_30m`, `streaming_reports_per_barangay`, `streaming_reports_per_category`, and `streaming_reports_per_priority`. These are written/read directly by Spark and `analyticsController`, not Mongoose models.

## 9. API Endpoints

Base path: `/api`. Protected routes require `Authorization: Bearer <JWT>` plus the role shown. `/api-docs` serves Swagger UI. Report-management guards allow `superadmin`, `admin`, and `barangay`; user-management `isAdmin` allows `superadmin` or `admin`.

### Health and authentication

| Method | Path | Access | Handler behavior |
|---|---|---|---|
| GET | `/health` | Public | API health response. |
| GET | `/auth/check-email` | Public | Check normalized email existence. |
| POST | `/auth/verify-email` | Public | Verify six-digit account code. |
| POST | `/auth/register` | Public | Create pending account and send verification code. Current role escalation risk is documented in Section 12. |
| POST | `/auth/login` | Public, auth limiter + lockout | Authenticate and either issue JWT or start privileged OTP/WebAuthn challenge. |
| POST | `/auth/2fa/verify` | Public temporary challenge | Verify login OTP and issue access JWT. |
| POST | `/auth/2fa/resend` | Public temporary challenge | Resend login OTP. |
| POST | `/auth/biometric/register-challenge` | Authenticated | Start WebAuthn credential registration. |
| POST | `/auth/biometric/register-verify` | Authenticated | Verify and store a WebAuthn credential. |
| GET | `/auth/biometric/devices` | Authenticated | List registered biometric credentials/devices. |
| PATCH | `/auth/biometric/toggle` | Authenticated | Toggle biometric login availability; does not disable mandatory privileged login 2FA. |
| POST | `/auth/biometric/login-challenge` | Public temporary challenge | Start WebAuthn authentication for a privileged login. |
| POST | `/auth/biometric/login-verify` | Public temporary challenge | Verify WebAuthn assertion and complete privileged login. |
| POST | `/auth/biometric/remove` | Authenticated | Remove a registered credential. |
| POST | `/auth/refresh` | Authenticated | Revoke current token and issue replacement. |
| POST | `/auth/logout` | Authenticated | Revoke current token and log logout. |
| GET | `/auth/me` | Authenticated | Return public current-user projection. |
| POST | `/auth/request-email-change` | Authenticated | Request email update; send separate verification codes to the current and new addresses. |
| POST | `/auth/verify-email-change-old` | Authenticated | Verify ownership of the current address before allowing the second step. |
| POST | `/auth/verify-email-change-new` | Authenticated | Verify the new address, update the email, invalidate existing sessions, and send confirmations. |
| POST | `/auth/request-password-change` | Authenticated | Verify current password, store a pending password hash, and send a verification code. |
| POST | `/auth/verify-password-change` | Authenticated | Verify the code and update the password; privileged users must also re-enter the current password. |
| PUT | `/auth/profile` | Authenticated | Update the user's name; email changes must use the verification flow above. |
| DELETE | `/auth/account` | Authenticated | Soft-delete current account. |
| POST | `/auth/forgot-password` | Public, dedicated limiter | Send reset code with generic account-existence response. |
| POST | `/auth/verify-reset-code` | Public | Verify code and return short-lived reset token. |
| POST | `/auth/reset-password` | Public, dedicated limiter | Consume reset token and update password. |

Privileged roles (`superadmin`, `admin`, and `barangay`) require a second factor at login; `user` accounts do not. The second factor is email OTP or a registered biometric credential, with email OTP available as the alternative. Registration and managed-user creation set the 2FA flag for privileged roles; `backend/scripts/enforce2FAPrivileged.js` migrates existing privileged users. The API has no 2FA enable/disable routes; `/auth/biometric/toggle` controls biometric availability only.

### Reports

| Method | Path | Access | Handler behavior |
|---|---|---|---|
| GET | `/reports/public` | Public | Reduced report listing with filters, viewport bounds, and pagination. |
| GET | `/reports/export` | Admin/superadmin | Export filtered report list as CSV. |
| GET | `/reports/search` | Superadmin/admin/barangay | Report query/search. |
| GET | `/reports` | Superadmin/admin/barangay | Paginated/filterable report queue. |
| GET | `/reports/mine` | Authenticated | Reports whose reporter snapshot matches the current email. |
| GET | `/reports/archived` | Superadmin/admin/barangay | Archived reports, barangay-scoped for barangay users. |
| GET | `/reports/:id` | Superadmin/admin/barangay | Retrieve report and increment view count. |
| POST | `/reports` | Authenticated, submission limiter | Multipart report with up to three images; route validates location/category/photo. |
| PUT | `/reports/:id` | Superadmin/admin/barangay | Update permitted report fields within barangay scope. |
| PATCH | `/reports/:id/status` | Superadmin/admin/barangay | Update status; `Closed` archives. |
| PATCH | `/reports/:id/priority` | Superadmin/admin/barangay | Update priority. |
| PATCH | `/reports/:id/assign` | Admin/superadmin | Assign user and/or barangay. |
| DELETE | `/reports/bulk` | Admin/superadmin/barangay | Delete selected reports; IDs are validated and barangay scope enforced. |
| DELETE | `/reports/:id` | Admin/superadmin/barangay | Delete report and clean related images/notifications. |

### Users and preferences

| Method | Path | Access | Handler behavior |
|---|---|---|---|
| GET | `/users/me/preferences` | Authenticated | Get own preferences. |
| PATCH | `/users/me/preferences` | Authenticated | Update own theme/map/notification preferences. |
| GET | `/users/stats` | Admin/superadmin | User counts by role. |
| GET | `/users/search` | Admin/superadmin | Search/list users. |
| GET | `/users` | Admin/superadmin | Paginated user list. |
| GET | `/users/:id` | Admin/superadmin | Get managed user. |
| POST | `/users` | Admin/superadmin | Create managed user under role restrictions. |
| PUT or PATCH | `/users/:id` | Admin/superadmin | Update allowed user fields; role changes are denied. |
| PATCH | `/users/:id/status` | Admin/superadmin | Toggle active/suspended state. |
| PATCH | `/users/:id/password` | Admin/superadmin | Set managed user's password after policy/target checks. |
| POST or PATCH | `/users/:id/suspend` | Admin/superadmin | Suspend for supported duration/custom date; the third recorded suspension auto-bans the account and sends notifications. |
| PATCH | `/users/:id/ban` | Admin/superadmin | Permanently ban eligible user. |
| POST | `/users/:id/unsuspend` | Admin/superadmin | Restore eligible suspended account. |
| DELETE | `/users/bulk` | Admin/superadmin | Soft-delete eligible users with hierarchy checks. |
| DELETE | `/users/:id` | Admin/superadmin | Soft-delete eligible user. |

No `/users/:id/preferences` route is currently declared; older API documentation claiming one is stale.

### Statistics and analytics

| Method | Path | Access | Handler behavior |
|---|---|---|---|
| GET | `/statistics/public` | Public | Public report totals, active/resolved counts, covered areas, top categories. |
| GET | `/statistics/overview` | Superadmin/admin/barangay | Scoped totals/status/priority. |
| GET | `/statistics/categories` | Superadmin/admin/barangay | Scoped category counts. |
| GET | `/statistics/status` | Superadmin/admin/barangay | Scoped status counts. |
| GET | `/statistics/timeline` | Superadmin/admin/barangay | Daily report counts. |
| GET | `/statistics/barangay` | Superadmin/admin/barangay | Reports grouped by barangay. |
| GET | `/statistics/barangay/:barangay` | Superadmin/admin/barangay | Barangay overview; barangay caller may only request own barangay. |
| GET | `/statistics/barangay/:barangay/status` | Superadmin/admin/barangay | Barangay status counts. |
| GET | `/statistics/barangay/:barangay/priority` | Superadmin/admin/barangay | Barangay priority counts. |
| GET | `/statistics/barangay/:barangay/timeline` | Superadmin/admin/barangay | Barangay daily counts, optional month/year filters. |
| GET | `/analytics/reports-per-barangay` | Superadmin/admin/barangay | Spark batch barangay aggregate. |
| GET | `/analytics/reports-per-category` | Superadmin/admin/barangay | Spark batch category aggregate. |
| GET | `/analytics/reports-per-priority` | Superadmin/admin/barangay | Spark batch priority aggregate. |
| GET | `/analytics/reports-per-day` | Superadmin/admin/barangay | Spark batch daily aggregate. |
| GET | `/analytics/tumbling-hourly` | Superadmin/admin/barangay | Spark tumbling hourly windows. |
| GET | `/analytics/sliding` | Superadmin/admin/barangay | Spark sliding windows. |
| GET | `/analytics/sessions` | Superadmin/admin/barangay | Spark reporter session windows. |

### Activity, notifications, contact, and system settings

| Method | Path | Access | Handler behavior |
|---|---|---|---|
| GET | `/activity/all` | Superadmin | Full searchable/date-filtered activity. |
| GET | `/activity/public` | Admin/superadmin | User/barangay activity view. |
| GET | `/activity/barangay/:barangay` | Barangay/admin/superadmin | Barangay activity; barangay caller restricted to own. |
| GET | `/activity/me` | Authenticated | Current user's activity. |
| GET | `/activity` | Authenticated | Dispatch activity scope by caller role. |
| GET | `/notifications` | Superadmin/admin/barangay | Caller-owned notifications, filter, pagination, unread count. |
| PATCH | `/notifications/read-all` | Superadmin/admin/barangay | Mark caller's notifications read. |
| PATCH | `/notifications/:id/read` | Superadmin/admin/barangay | Mark owned notification read. |
| PATCH | `/notifications/:id/unread` | Superadmin/admin/barangay | Mark owned notification unread. |
| POST | `/contact` | Public, contact limiter | Validate and store contact message; notify admins. |
| GET | `/contact` | Admin/superadmin | List messages. |
| PATCH | `/contact/:id/status` | Admin/superadmin | Set `new`, `read`, or `resolved`. |
| GET | `/system/settings` | Superadmin | Load/create singleton settings. |
| PATCH | `/system/settings` | Superadmin | Update validated settings. |
| PATCH | `/system/settings/logo` | Superadmin | Upload logo to Cloudinary. |

## 10. Background Jobs / Cron / Workers

- **Node backup cron:** Enabled only when `BACKUP_CRON_ENABLED=true` and B2 keys are configured. Defaults to 02:00 UTC daily (`BACKUP_CRON_SCHEDULE`, `BACKUP_TIMEZONE`). Runs inside each API process; deploy only one scheduler instance or use a platform cron. Archives are temporary locally, stored under B2 `backups/`, and older versions are deleted after 30 days.
- **Manual backup:** `npm run backup` from `backend/`; requires MongoDB Database Tools and B2 configuration. The Windows executable default is the observed MongoDB Tools `100` path; `MONGODUMP_PATH` can override it. Linux resolves `mongodump` from PATH.
- **Spark scheduler:** `python backend/spark/scheduler.py` runs batch analytics at startup and hourly, and window analytics daily at 00:00. It is a separate long-running process.
- **Spark streaming:** `python backend/spark/jobs/streaming_analytics.py` watches MongoDB change streams, retries once, then falls back to newline-delimited JSON files in ignored `backend/spark/stream_input/`. Streaming uses a one-minute watermark/window and checkpoint state.
- **No worker queue:** No BullMQ, RabbitMQ, Kafka, or Redis-backed job queue is configured.
- **Maintenance/seed scripts:** See Section 6.7; several directly mutate data and must be reviewed against the target database before use.

## 11. Auth & Security

- **Access tokens:** JWT bearer tokens signed with `JWT_SECRET`; privileged admin/superadmin/barangay roles receive one-day tokens, other roles seven-day tokens. Protected middleware validates signature, denies temporary 2FA challenge tokens, checks blacklist and `authVersion`, loads the active user, then applies role guards.
- **Refresh/logout revocation:** Refresh and logout store the SHA-256 of the current token in `TokenBlacklist`; MongoDB TTL removes expired entries. These paths do revoke the presented token (contrary to older documentation).
- **Passwords and one-time codes:** Passwords and email OTP/reset codes are bcrypt-hashed; reset completion tokens are SHA-256 hashed and short-lived. Password policy requires at least eight characters with upper/lower/digit/special and no spaces.
- **Email verification and 2FA:** New/pending accounts require email verification. Citizen accounts (`user`) sign in with email and password only. Privileged roles (`superadmin`, `admin`, `barangay`) have mandatory login 2FA using email OTP or a registered biometric credential; email codes expire, failed attempts are bounded, and temporary blocking is applied. Biometric credentials are per-device and an account may register multiple devices. There is no 2FA enable/disable UI or HTTP route; the biometric toggle does not turn off mandatory 2FA.
- **Email and password changes:** Email updates require verification codes sent separately to the old and new addresses, in that order; the old address is notified of the request and both addresses receive completion notices. Password updates require the current password and a code; privileged users re-enter the current password at verification. Both changes increment `authVersion`, invalidating previously issued sessions.
- **Suspension and auto-ban:** Each suspension increments `suspensionCount` and appends a date to `suspensionHistory`; the third suspension results in a permanent ban, with user/admin email and activity notifications. The UI's five-second option is a test duration, not a 20-second option.
- **Authorization:** Backend route guards are authoritative. Report, statistics, and activity operations include barangay scope checks. User-management handlers apply target role hierarchy and protect the last superadmin in covered operations.
- **Rate limits:** Global 200 requests/15 min; auth 100/15 min; contact 5/hour; forgot-password 3/hour; reset-password 5/hour; report submissions 10/hour. Login lockout is three failures for five minutes per IP/email. Default limiter and lockout stores are process-local.
- **Request and transport controls:** Helmet CSP/HSTS/frame/referrer/MIME options, explicit CORS origins, 2 MB JSON body cap, Express validators, maximum three 5 MB image uploads, and controlled common error responses. TLS termination is delegated to hosting infrastructure.
- **Data and audit controls:** User accounts use soft-delete lifecycle fields; report updates and account changes write activity logs where implemented; report DELETE handlers physically delete records and images; notifications check recipient ownership; report location/barangay validation is performed server-side.
- **Secrets:** `backend/.env` and local `ACCOUNTS.md` are ignored. Never place their values in this reference, commits, logs, screenshots, or support material. Use provider secret stores and rotate any values that have been exposed.

## 12. Known Issues / TODOs

1. **Critical — public role escalation:** `validateRegister` permits the full role enum, and `authController.register` preserves a valid submitted role. A public caller can request privileged roles and, after email verification, obtain that role. Registration must force `user`; elevated accounts must be provisioned only through an authorized flow. This source-level issue needs immediate remediation and authorization tests.
2. **Bearer tokens in localStorage:** An XSS can read persistent access tokens. Consider secure HttpOnly SameSite cookies with CSRF controls or another token-storage design.
3. **Process-local throttling:** Express rate-limit defaults and login lockout maps do not coordinate across multiple Render instances or survive restarts. Use a shared store when horizontally scaled.
4. **Hard-coded development credentials/notification target:** Demo/seed scripts contain source-coded initial credentials or fallback values, and privileged notification email assignment includes a source-coded target/fallback. `ADMIN_NOTIFICATION_EMAIL` provides configuration but does not remove that fallback. Replace it with safe provisioning/configuration; do not copy literal values into documentation.
5. **Sensitive logging:** Development paths log verification/reset codes; email/reset error logging includes addresses, responses, or stacks. Redact sensitive values and restrict production log access.
6. **Upload signature validation:** The Cloudinary upload filter trusts multipart MIME type. Add content-signature/type verification and review upload abuse controls.
7. **Maintenance scripts and report deletion:** `clearReports.js`, `reset-db-state.mjs`, `backfillVerified.js`, `enable2FA.js`, `removeBackupCodes.js`, and `setNotificationEmails.js` lack a consistent production guard. `enforce2FAPrivileged.js` requires `--confirm` in production. No `backfillSuspensionCounts.js` exists, so legacy users' historical suspensions are not automatically reflected in the new counter. Report DELETE endpoints also physically remove records and images, unlike user soft deletion. Require explicit target checks, retention decisions, and safe operational runbooks.
8. **Stale API documentation:** `docs/API-Reference.md` and `backend/swagger.js` do not fully describe current email verification, biometric login, email/password changes, 2FA/reset-code paths, or all user-management routes. Postman filename references also differ from the tracked collection name.
9. **Security documents require refresh:** OWASP/VAPT dates/statuses predate current token blacklist, email/2FA changes, and server-side geographic validation. Runtime evidence is still marked pending; rerun authorized tests and reconcile findings.
10. **Limited automated tests and no CI:** Two standalone Node `node:test` files cover device/email helpers and barangay resolution/report creation, but there is no npm test script, broad authorization/security test suite, or CI workflow. Expand coverage for registration roles, token revocation, upload validation, and backup safety.
11. **Unused/legacy modules:** No imports found for `backend/models/Category.js`, `backend/utils/generateToken.js`, `frontend/src/pages/admin/AdminLayout.jsx`, the Bonuan/Lucao/Tapuac page wrappers, or `frontend/src/assets/*`; verify and remove or reconnect. Additional standalone settings/activity pages appear unregistered and need route review.
12. **Generated artifacts tracked:** Spark checkpoint metadata, checksum sidecars, and CPython 3.14 `.pyc` files are tracked despite ignore rules. Remove runtime-generated state from source control unless intentionally needed for recovery.
13. **Frontend bundle advisory:** Production Vite builds report a minified JavaScript chunk over the default 500 kB warning threshold. Consider route-level code splitting if bundle load performance requires it.
14. **Data provenance:** Seed CSV files are tracked although ignore rules exclude newly added CSVs. Confirm datasets contain no unintended personal data and that redistribution is permitted.
15. **Documentation scope:** `README.md` files referenced by the previous reference are absent from the tracked tree; Spark and backup setup live in `backend/spark/README.md` and `backend/BACKUPS.md`.

## 13. Change Log (of this reference)

| Date | Change | Author |
|---|---|---|
| 2026-09-28 | Replaced stale inventory with a verified tracked-file breakdown, lockfile versions, current route/model/environment/job references, secret-handling notes, and reconciled security findings. | HazardWatch project maintainers |
| 2026-10-16 | Updated the inventory, auth/WebAuthn/email-change/suspension behavior, environment variables, UI details, MapLibre worker configuration, direct Node test inventory, known issues, and production map smoke-check results. | HazardWatch project maintainers |
| 2026-10-18 | Removed the retired account role and report discussion feature; documented the data migration and URL-backed, refreshed report queues. | HazardWatch project maintainers |