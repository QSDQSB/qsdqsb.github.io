/**
 * Object-store adapters with one small interface, so the processor runs
 * unchanged against R2 in CI and against a directory on a laptop or in a
 * test. Keys are always `/`-separated and relative to the bucket root.
 *
 *   list(prefix)          → [{ key, size, etag, lastModified }]
 *   get(key)              → Buffer | null
 *   getJson(key)          → object | null
 *   put(key, body, type)  → void
 *   putJson(key, obj)     → void
 *   del(keys)             → void
 *   copy(from, to)        → void (server-side on R2)
 *   exists(key)           → boolean
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const CONTENT_TYPES = {
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.avif': 'image/avif',
  '.png': 'image/png', '.json': 'application/json', '.tif': 'image/tiff', '.tiff': 'image/tiff', '.heic': 'image/heic',
};
export const contentTypeFor = (key) => CONTENT_TYPES[path.extname(key).toLowerCase()] || 'application/octet-stream';

// ── filesystem ───────────────────────────────────────────────────────────────

export class FsStore {
  constructor(root) { this.root = root; } // created lazily on first write, so a dry run leaves no trace
  _abs(key) { return path.join(this.root, ...key.split('/')); }

  async list(prefix = '') {
    const out = [];
    const walk = (dir) => {
      if (!fs.existsSync(dir)) return;
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, e.name);
        if (e.isDirectory()) { walk(abs); continue; }
        const key = path.relative(this.root, abs).split(path.sep).join('/');
        if (!key.startsWith(prefix)) continue;
        const st = fs.statSync(abs);
        const etag = crypto.createHash('md5').update(fs.readFileSync(abs)).digest('hex');
        out.push({ key, size: st.size, etag, lastModified: st.mtime.toISOString() });
      }
    };
    walk(this.root);
    return out.sort((a, b) => a.key.localeCompare(b.key));
  }
  async get(key) { const p = this._abs(key); return fs.existsSync(p) ? fs.readFileSync(p) : null; }
  async getJson(key) { const b = await this.get(key); return b ? JSON.parse(b.toString('utf8')) : null; }
  async put(key, body) { const p = this._abs(key); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, body); }
  async putJson(key, obj) { await this.put(key, JSON.stringify(obj, null, 2) + '\n'); }
  async del(keys) {
    for (const k of keys) {
      const p = this._abs(k);
      if (fs.existsSync(p)) fs.unlinkSync(p);
      // Buckets have no folders; drop the empty parents so the tree reads like one.
      for (let d = path.dirname(p); d !== this.root && d.startsWith(this.root); d = path.dirname(d)) {
        if (!fs.existsSync(d) || fs.readdirSync(d).length) break;
        fs.rmdirSync(d);
      }
    }
  }
  async copy(from, to) { const d = this._abs(to); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(this._abs(from), d); }
  async exists(key) { return fs.existsSync(this._abs(key)); }
}

// ── Cloudflare R2 through the S3 protocol ───────────────────────────────────

export class R2Store {
  /**
   * @param {string} bucket
   * @param {{accountId:string, accessKeyId:string, secretAccessKey:string}} creds
   */
  constructor(bucket, creds) {
    for (const k of ['accountId', 'accessKeyId', 'secretAccessKey']) {
      if (!creds[k]) throw new Error(`R2Store: missing credential ${k} (set R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)`);
    }
    this.bucket = bucket;
    this._creds = creds;
    this._client = null;
    this._sdk = null;
  }
  async _c() {
    if (this._client) return this._client;
    this._sdk = await import('@aws-sdk/client-s3');
    this._client = new this._sdk.S3Client({
      region: 'auto',
      endpoint: `https://${this._creds.accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: this._creds.accessKeyId, secretAccessKey: this._creds.secretAccessKey },
    });
    return this._client;
  }
  async list(prefix = '') {
    const c = await this._c(); const out = []; let token;
    do {
      const r = await c.send(new this._sdk.ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix, ContinuationToken: token }));
      for (const o of r.Contents || []) {
        out.push({ key: o.Key, size: o.Size, etag: (o.ETag || '').replace(/"/g, ''), lastModified: o.LastModified?.toISOString() });
      }
      token = r.IsTruncated ? r.NextContinuationToken : undefined;
    } while (token);
    return out;
  }
  async get(key) {
    const c = await this._c();
    try {
      const r = await c.send(new this._sdk.GetObjectCommand({ Bucket: this.bucket, Key: key }));
      return Buffer.from(await r.Body.transformToByteArray());
    } catch (e) { if (e.name === 'NoSuchKey' || e.$metadata?.httpStatusCode === 404) return null; throw e; }
  }
  async getJson(key) { const b = await this.get(key); return b ? JSON.parse(b.toString('utf8')) : null; }
  async put(key, body, contentType = contentTypeFor(key)) {
    const c = await this._c();
    const cache = key.endsWith('.json') ? 'public, max-age=300' : 'public, max-age=31536000, immutable';
    await c.send(new this._sdk.PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType, CacheControl: cache }));
  }
  async putJson(key, obj) { await this.put(key, JSON.stringify(obj, null, 2) + '\n', 'application/json'); }
  async del(keys) {
    const c = await this._c();
    for (let i = 0; i < keys.length; i += 1000) {
      const chunk = keys.slice(i, i + 1000);
      await c.send(new this._sdk.DeleteObjectsCommand({ Bucket: this.bucket, Delete: { Objects: chunk.map(Key => ({ Key })), Quiet: true } }));
    }
  }
  async copy(from, to) {
    const c = await this._c();
    await c.send(new this._sdk.CopyObjectCommand({ Bucket: this.bucket, CopySource: `/${this.bucket}/${encodeURI(from)}`, Key: to }));
  }
  async exists(key) {
    const c = await this._c();
    try { await c.send(new this._sdk.HeadObjectCommand({ Bucket: this.bucket, Key: key })); return true; }
    catch (e) { if (e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404) return false; throw e; }
  }
}

/**
 * Pick stores from CLI flags: `--local <dir>` gives two directories under
 * <dir>, otherwise real R2 buckets from the environment.
 */
export function storesFrom(args, env) {
  if (args.local) {
    const root = typeof args.local === 'string' ? args.local : env.localStoreDefault;
    return { originals: new FsStore(path.join(root, 'originals')), pub: new FsStore(path.join(root, 'public')), local: root };
  }
  const creds = { accountId: env.accountId, accessKeyId: env.accessKeyId, secretAccessKey: env.secretAccessKey };
  return { originals: new R2Store(env.originalsBucket, creds), pub: new R2Store(env.publicBucket, creds), local: null };
}
