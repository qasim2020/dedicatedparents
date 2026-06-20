import {
  normalizeEmail,
  hashPassword,
  verifyPassword,
  createToken,
  hashToken,
  tokenExpiry,
} from '../services/memberAuthService.js';

describe('memberAuthService', () => {
  it('normalizes email', () => {
    expect(normalizeEmail('  USER@Example.COM ')).toBe('user@example.com');
  });

  it('hashes and verifies passwords', async () => {
    const { salt, hash } = await hashPassword('Str0ng!Pass');
    expect(salt).toBeTruthy();
    expect(hash).toBeTruthy();

    await expect(verifyPassword('Str0ng!Pass', salt, hash)).resolves.toBe(true);
    await expect(verifyPassword('WrongPass1!', salt, hash)).resolves.toBe(false);
  });

  it('creates hashed tokens with expiry', () => {
    const token = createToken(24);
    const hashed = hashToken(token);
    const expiry = tokenExpiry(2);

    expect(token).toHaveLength(48);
    expect(hashed).toMatch(/^[a-f0-9]{64}$/);
    expect(expiry.getTime()).toBeGreaterThan(Date.now() + (60 * 60 * 1000));
  });
});
