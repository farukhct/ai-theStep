import 'dotenv/config';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { SecurityStore } from '../data/securityStore.ts';
import { hashPassword, validatePasswordPolicy } from '../security/crypto.ts';

async function main() {
  const store = new SecurityStore();
  const rl = readline.createInterface({ input, output });

  try {
    const defaultEmail = process.env.SUPERADMIN_BOOTSTRAP_EMAIL || 'faruk017@gmail.com';
    const emailArg = process.argv[2] || (await rl.question(`Super Administrator Email [${defaultEmail}]: `)) || defaultEmail;
    const cleanEmail = emailArg.trim().toLowerCase();

    const envPassword = process.env.SUPERADMIN_BOOTSTRAP_PASSWORD || '';
    const password =
      envPassword ||
      (await rl.question('Enter strong Super Administrator password (min 12 chars): '));

    const pwCheck = validatePasswordPolicy(password, {
      minLength: 12,
      isPrivileged: true,
      personalTerms: [cleanEmail.split('@')[0]]
    });
    if (!pwCheck.valid) {
      console.error('Password policy check failed:', pwCheck.errors.join(' '));
      process.exit(1);
    }

    const superRole = store.findRoleBySlug('superadmin');
    if (!superRole) {
      console.error('System superadmin role missing.');
      process.exit(1);
    }

    let user = store.findUserByIdentifier(cleanEmail);
    if (user) {
      store.recordPasswordChange(user.id, hashPassword(password));
      store.updateUser(user.id, { status: 'active', emailVerified: true, failedLoginAttempts: 0, lockedUntil: null });
      const existingRoles = store.getUserRoles(user.id).map((r) => r.id);
      if (!existingRoles.includes(superRole.id)) {
        store.setUserRoles(user.id, [superRole.id, ...existingRoles], 'cli_seed');
      }
      store.recordAuditLog({
        userId: user.id,
        action: 'SUPERADMIN_PROVISIONED_CLI',
        module: 'Provisioning',
        targetRecordId: user.id,
        result: 'success',
        additionalContext: 'Super Administrator credentials configured via one-time provisioning CLI'
      });
      console.log(`Updated verified Super Administrator account: ${cleanEmail}`);
    } else {
      const username = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '') || 'superadmin';
      user = store.createUser(
        {
          username,
          email: cleanEmail,
          fullName: 'Store Owner (Super Admin)',
          phoneNumber: '',
          designation: 'Super Administrator',
          photoURL: '',
          status: 'active',
          emailVerified: true,
          phoneVerified: false,
          passwordHash: hashPassword(password),
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: null,
          lastLoginIp: null,
          lastLoginDevice: null,
          addresses: [],
          savedWishlist: [],
          collectedVouchers: ['SMART10'],
          createdBy: 'cli_seed',
          deactivatedAt: null
        },
        [superRole.id]
      );
      store.recordAuditLog({
        userId: user.id,
        action: 'SUPERADMIN_CREATED_CLI',
        module: 'Provisioning',
        targetRecordId: user.id,
        result: 'success'
      });
      console.log(`Created verified Super Administrator account: ${cleanEmail}`);
    }
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error('Provisioning failed:', err);
  process.exit(1);
});
