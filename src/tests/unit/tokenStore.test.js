import { describe, it, expect } from 'vitest';
import { generateRefreshToken, hashToken } from '../../../src/models/tokenStore.js';

describe('tokenStore utils', () => {
  it('generates unique refresh tokens', () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(a).not.toBe(b);
  });
  it('hashes tokens deterministically', () => {
    const t = generateRefreshToken();
    expect(hashToken(t)).toBe(hashToken(t));
  });
});
