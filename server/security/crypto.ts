import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface PasswordValidationResult {
  valid: boolean;
  score: number;
  strengthLabel: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  errors: string[];
  suggestions: string[];
}

const COMMON_COMPROMISED_PASSWORDS = new Set([
  '123456',
  '12345678',
  '123456789',
  '1234567890',
  '123456789012',
  'password',
  'password123',
  'password1234',
  'admin123',
  'admin1234',
  'admin@123',
  'qwerty',
  'qwerty123',
  'qwertyuiop',
  'letmein',
  'welcome123',
  'iloveyou',
  'bangladesh',
  'bangladesh123',
  'dhaka1234',
  'superadmin',
  'superadmin123',
  'thesteps123',
  'thesteps@123',
  'abc12345',
  '111111111111',
  '000000000000',
  'pass@word1',
  'p@ssw0rd',
  'changeme123'
]);

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

let cachedRuntimeSecret: string | null = null;

export function getRuntimeSecret(): string {
  if (process.env.AUTH_TOKEN_SECRET && process.env.AUTH_TOKEN_SECRET.trim().length >= 16) {
    return process.env.AUTH_TOKEN_SECRET.trim();
  }
  if (cachedRuntimeSecret) return cachedRuntimeSecret;

  const secretDir = path.resolve(process.cwd(), '.data');
  const secretFile = path.join(secretDir, '.runtime-secret');
  try {
    if (fs.existsSync(secretFile)) {
      const existing = fs.readFileSync(secretFile, 'utf8').trim();
      if (existing.length >= 32) {
        cachedRuntimeSecret = existing;
        return existing;
      }
    }
    fs.mkdirSync(secretDir, { recursive: true });
    const generated = crypto.randomBytes(48).toString('hex');
    fs.writeFileSync(secretFile, generated, { mode: 0o600 });
    cachedRuntimeSecret = generated;
    return generated;
  } catch {
    cachedRuntimeSecret = crypto.randomBytes(48).toString('hex');
    return cachedRuntimeSecret;
  }
}

function getMfaAesKey(): Buffer {
  const raw =
    process.env.MFA_ENCRYPTION_KEY && process.env.MFA_ENCRYPTION_KEY.trim().length >= 16
      ? process.env.MFA_ENCRYPTION_KEY.trim()
      : `${getRuntimeSecret()}:mfa-encryption`;
  return crypto.createHash('sha256').update(raw).digest();
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${derived.toString('hex')}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!storedHash || !password) return false;
  const parts = storedHash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = parts[4];
  const expectedHex = parts[5];
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p) || !salt || !expectedHex) {
    return false;
  }
  try {
    const derived = crypto.scryptSync(password, salt, 64, { N, r, p });
    const expectedBuf = Buffer.from(expectedHex, 'hex');
    if (derived.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(derived, expectedBuf);
  } catch {
    return false;
  }
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function generateOpaqueToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function generateOtpCode(digits = 6): string {
  const max = 10 ** digits;
  const num = crypto.randomInt(0, max);
  return String(num).padStart(digits, '0');
}

export function generateRecoveryCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const partA = crypto.randomBytes(2).toString('hex').toUpperCase();
    const partB = crypto.randomBytes(2).toString('hex').toUpperCase();
    codes.push(`${partA}-${partB}`);
  }
  return codes;
}

export function validatePasswordPolicy(
  password: string,
  options: {
    minLength?: number;
    isPrivileged?: boolean;
    personalTerms?: string[];
  } = {}
): PasswordValidationResult {
  const minLength = options.isPrivileged
    ? Math.max(options.minLength ?? 12, 12)
    : Math.max(options.minLength ?? 8, 8);
  const errors: string[] = [];
  const suggestions: string[] = [];

  if (!password || password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long.`);
  }
  if (password.length > 128) {
    errors.push('Password cannot exceed 128 characters.');
  }

  const normalized = password.trim().toLowerCase().replace(/\s+/g, '');
  if (COMMON_COMPROMISED_PASSWORDS.has(normalized)) {
    errors.push('This password appears in common breach lists. Choose a unique passphrase.');
  }
  if (/^(.)\1+$/.test(password)) {
    errors.push('Password cannot consist of a single repeated character.');
  }

  for (const term of options.personalTerms || []) {
    const clean = (term || '').trim().toLowerCase();
    if (clean.length >= 4 && normalized.includes(clean)) {
      errors.push('Avoid including your name, username, or email inside your password.');
      break;
    }
  }

  // NIST SP 800-63B friendly scoring (rewards length & passphrases without frustrating forced symbols)
  let score = 0;
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 25;
  if (password.length >= 16) score += 20;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 10;
  if (/\d/.test(password)) score += 10;
  if (/[^a-zA-Z0-9\s]/.test(password) || /\s+/.test(password.trim())) score += 15;
  if (errors.length > 0) score = Math.min(score, 35);
  score = Math.max(0, Math.min(100, score));

  if (password.length < 14) {
    suggestions.push('Consider using a 3+ word memorable passphrase for maximum security.');
  }

  let strengthLabel: PasswordValidationResult['strengthLabel'] = 'Very Weak';
  if (score >= 85) strengthLabel = 'Very Strong';
  else if (score >= 65) strengthLabel = 'Strong';
  else if (score >= 45) strengthLabel = 'Fair';
  else if (score >= 25) strengthLabel = 'Weak';

  return {
    valid: errors.length === 0,
    score,
    strengthLabel,
    errors,
    suggestions
  };
}

export function encryptSecret(plaintext: string): string {
  const key = getMfaAesKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSecret(payload: string): string {
  const parts = payload.split(':');
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new Error('Malformed encrypted secret payload');
  }
  const key = getMfaAesKey();
  const iv = Buffer.from(parts[1], 'hex');
  const tag = Buffer.from(parts[2], 'hex');
  const encrypted = Buffer.from(parts[3], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export interface JwtClaims {
  sub: string;
  sid: string;
  type: 'access' | 'mfa_pending';
  isAdminSession: boolean;
  mfaVerified: boolean;
  iat: number;
  exp: number;
  jti: string;
}

export function signJwt(
  claims: Omit<JwtClaims, 'iat' | 'exp' | 'jti'>,
  expiresInSeconds: number
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtClaims = {
    ...claims,
    iat: now,
    exp: now + Math.max(10, expiresInSeconds),
    jti: crypto.randomUUID()
  };
  const headerB64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signingInput = `${headerB64}.${payloadB64}`;
  const sig = crypto.createHmac('sha256', getRuntimeSecret()).update(signingInput).digest('base64url');
  return `${signingInput}.${sig}`;
}

export function verifyJwt(token: string | undefined | null): JwtClaims | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;
  const signingInput = `${headerB64}.${payloadB64}`;
  try {
    const expectedSig = crypto
      .createHmac('sha256', getRuntimeSecret())
      .update(signingInput)
      .digest('base64url');
    const a = Buffer.from(sigB64);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as JwtClaims;
    const now = Math.floor(Date.now() / 1000);
    if (!decoded.exp || decoded.exp < now) return null;
    if (!decoded.sub || !decoded.sid) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function encodeBase32(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export function decodeBase32(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function generateTotpSecret(): string {
  return encodeBase32(crypto.randomBytes(20));
}

export function buildOtpAuthUri(accountName: string, issuer: string, secret: string): string {
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const iss = encodeURIComponent(issuer);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${iss}&algorithm=SHA1&digits=6&period=30`;
}

export function generateTotpCodeForTimestamp(base32Secret: string, timestampMs = Date.now(), stepSeconds = 30): string {
  const counter = Math.floor(timestampMs / 1000 / stepSeconds);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  counterBuf.writeUInt32BE(counter >>> 0, 4);

  const key = decodeBase32(base32Secret);
  const hmac = crypto.createHmac('sha1', key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, '0');
}

export function verifyTotpCode(base32Secret: string, submittedCode: string, windowSteps = 1): boolean {
  const cleanCode = (submittedCode || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleanCode)) return false;
  const now = Date.now();
  for (let delta = -windowSteps; delta <= windowSteps; delta++) {
    const expected = generateTotpCodeForTimestamp(base32Secret, now + delta * 30_000);
    if (expected.length === cleanCode.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(cleanCode))) {
      return true;
    }
  }
  return false;
}
