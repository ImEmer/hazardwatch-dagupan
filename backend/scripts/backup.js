import 'dotenv/config';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sendEmail } from '../utils/sendEmail.js';

const B2_API_VERSION = 'v3';
const RETENTION_DAYS = 30;

const requireBackupConfig = () => {
  const required = ['MONGO_URI', 'B2_KEY_ID', 'B2_APP_KEY', 'B2_BUCKET_ID'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing backup configuration: ${missing.join(', ')}`);
};

const requestJson = async (url, options) => {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `Backblaze request failed (${response.status}).`);
  return body;
};

const authorizeB2 = () => requestJson('https://api.backblazeb2.com/b2api/v3/b2_authorize_account', {
  headers: { Authorization: `Basic ${Buffer.from(`${process.env.B2_KEY_ID}:${process.env.B2_APP_KEY}`).toString('base64')}` },
});

const b2Post = (auth, action, body) => requestJson(`${auth.apiUrl}/b2api/${B2_API_VERSION}/${action}`, {
  method: 'POST',
  headers: { Authorization: auth.authorizationToken, 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const createArchive = async (filePath) => new Promise((resolve, reject) => {
  const child = spawn('mongodump', ['--uri', process.env.MONGO_URI, '--archive', filePath, '--gzip'], { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr = `${stderr}${chunk}`.slice(-4096); });
  child.once('error', reject);
  child.once('close', (code) => {
    if (code === 0) return resolve();
    const safeError = process.env.MONGO_URI ? stderr.replaceAll(process.env.MONGO_URI, '[redacted MongoDB URI]').trim() : stderr.trim();
    reject(new Error(`mongodump exited with code ${code}.${safeError ? ` ${safeError}` : ''}`));
  });
});

const sha1File = async (filePath) => {
  const hash = createHash('sha1');
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest('hex');
};

const uploadArchive = async (auth, filePath, fileName) => {
  const upload = await b2Post(auth, 'b2_get_upload_url', { bucketId: process.env.B2_BUCKET_ID });
  const fileStats = await stat(filePath);
  const response = await fetch(upload.uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: upload.authorizationToken,
      'X-Bz-File-Name': encodeURIComponent(fileName),
      'Content-Type': 'application/gzip',
      'Content-Length': String(fileStats.size),
      'X-Bz-Content-Sha1': await sha1File(filePath),
    },
    body: createReadStream(filePath),
    duplex: 'half',
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `B2 upload failed (${response.status}).`);
  return body;
};

const deleteExpiredVersions = async (auth) => {
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  let startFileName;
  let startFileId;
  do {
    const page = await b2Post(auth, 'b2_list_file_versions', {
      bucketId: process.env.B2_BUCKET_ID,
      prefix: 'backups/',
      maxFileCount: 1000,
      ...(startFileName ? { startFileName } : {}),
      ...(startFileId ? { startFileId } : {}),
    });
    for (const file of page.files || []) {
      if (Number(file.uploadTimestamp) >= cutoff) continue;
      await b2Post(auth, 'b2_delete_file_version', { fileName: file.fileName, fileId: file.fileId });
    }
    startFileName = page.nextFileName;
    startFileId = page.nextFileId;
  } while (startFileName && startFileId);
};

const reportFailure = async (error) => {
  const safeMessage = String(error.message || 'Unknown backup failure').replaceAll(process.env.MONGO_URI || '\0', '[redacted MongoDB URI]');
  console.error('[backup] Failed:', safeMessage);
  if (!process.env.BACKUP_ALERT_EMAIL) return;
  try {
    await sendEmail({
      to: process.env.BACKUP_ALERT_EMAIL,
      subject: 'HazardWatch backup failed',
      text: `The scheduled HazardWatch database backup failed.\n\n${safeMessage}`,
      html: `<p>The scheduled HazardWatch database backup failed.</p><pre>${safeMessage.replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</pre>`,
    });
  } catch (emailError) {
    console.error('[backup] Failure alert could not be delivered:', emailError.message);
  }
};

export const runBackup = async () => {
  let temporaryDirectory;
  try {
    requireBackupConfig();
    temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'hazardwatch-backup-'));
    const date = new Date().toISOString().slice(0, 10);
    const filename = `hazardwatch-${date}.archive.gz`;
    const filePath = path.join(temporaryDirectory, filename);
    await createArchive(filePath);
    const auth = await authorizeB2();
    await uploadArchive(auth, filePath, `backups/${filename}`);
    await deleteExpiredVersions(auth);
    console.log(`[backup] Uploaded and retained backups for ${RETENTION_DAYS} days: ${filename}`);
  } catch (error) {
    await reportFailure(error);
    throw error;
  } finally {
    if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
  }
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runBackup().catch(() => { process.exitCode = 1; });
}