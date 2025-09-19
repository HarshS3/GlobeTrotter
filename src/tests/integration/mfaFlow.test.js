import request from 'supertest';
import app from '../../../src/app.js';
import { describe, it, expect } from 'vitest';
import speakeasy from 'speakeasy';

async function register() {
  return request(app).post('/auth/register').send({ email: 'mfa@example.com', password: 'Password123!' });
}

describe('MFA setup & verify', () => {
  it('sets up and verifies 2FA', async () => {
    const reg = await register();
    const cookies = reg.headers['set-cookie'];
    const setup = await request(app).post('/auth/2fa/setup').set('Cookie', cookies).send();
    expect(setup.status).toBe(200);
    const token = speakeasy.totp({ secret: setup.body.secret, encoding: 'base32' });
    const verify = await request(app).post('/auth/2fa/verify').set('Cookie', cookies).send({ token });
    expect(verify.status).toBe(200);
  });
});
