# HazardWatch Security Tests

Import `HazardWatch-Security-Tests.json` into Postman. Create an environment with:

- `baseUrl`: API origin including `/api`, for example `http://localhost:5000/api`
- `adminEmail`, `adminPassword`
- `superadminEmail`, `superadminPassword`
- `barangayEmail`, `barangayPassword`
- `citizenEmail`, `citizenPassword`
- `adminToken`, `superadminToken`, `barangayToken`, `citizenToken`
- `reportId`, `userId`, `otherBarangay`
- `validImagePath` (a local image path for upload tests)

The collection-level pre-request script logs in automatically when a request declares `loginAs` in its request variables and stores the resulting token in the matching token variable. Replace seed credentials with isolated test accounts before execution.

Run folders individually first, then run the full collection with the Collection Runner. Tests assert the expected response status and response time under 500 ms where practical. Some abuse tests intentionally trigger 400/401/403/413/429 responses and should not be interpreted as application failures.

## Evidence collection

1. Export the Postman run result as JSON.
2. Capture the request, response status, and response body for each finding.
3. Store screenshots and exports under `docs/vapt-screenshots/`.
4. Do not include passwords, JWTs, reset tokens, or API keys in exported evidence.

The collection tests the current API contract. Update `baseUrl` and test IDs for the environment under assessment.
