import bcrypt from 'bcryptjs';

/// 12 rounds: ~250ms per hash on typical hardware. Raise it, not lower it.
const ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/// Burns roughly the same time as a real comparison. Called when the email
/// doesn't exist, so that "no such user" and "wrong password" take the same
/// wall-clock time and the login endpoint can't be used to enumerate accounts.
export async function fakeVerify(): Promise<void> {
  await bcrypt.compare(
    'timing-equaliser',
    '$2a$12$C6UzMDM.H6dfI/f/IKcEe.eFqDCDHLnBLu.Ub7cP4x3lUYBjxYCJq',
  );
}
