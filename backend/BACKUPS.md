# Database Backups

HazardWatch creates a gzip-compressed `mongodump` archive and uploads it to a Backblaze B2 bucket using the B2 Native API. The daily scheduler runs at 02:00 UTC when explicitly enabled.

## Configure

1. Create a private B2 bucket and an application key that can list, upload, and delete files in that bucket.
2. Install MongoDB Database Tools on the API host so `mongodump` and `mongorestore` are available on `PATH`.
3. Set `B2_KEY_ID`, `B2_APP_KEY`, `B2_BUCKET_ID`, `BACKUP_ALERT_EMAIL`, and `BACKUP_CRON_ENABLED=true` in the deployment environment. Set `BACKUP_CRON_SCHEDULE` and `BACKUP_TIMEZONE` only if changing the default schedule.
4. Keep these secrets in the hosting provider’s secret store; do not commit them.

Run a backup manually from `backend/` with `npm run backup`. The scheduler is disabled by default and will not run until `BACKUP_CRON_ENABLED=true` and all B2 credentials are present. Use one API replica for in-process cron scheduling; for multiple replicas, run the manual command as a single-instance platform cron job instead.

Archives are stored under `backups/` and every file version older than 30 days is deleted. Failures are logged and emailed to `BACKUP_ALERT_EMAIL` when configured. Local temporary archives are removed after each run.

## Restore

Download an archive from the private bucket to a trusted host, then restore it into the intended MongoDB database:

```powershell
mongorestore --uri="$env:MONGO_URI" --archive="hazardwatch-YYYY-MM-DD.archive.gz" --gzip
```

Test restores against a separate database before relying on a backup for recovery.