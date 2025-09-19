import request from 'supertest';
import app from '../../../src/app.js';
import { describe, it, expect } from 'vitest';

async function register() {
  return request(app).post('/auth/register').send({ email: 'rot@example.com', password: 'Password123!' });
}

describe('Refresh rotation', () => {
  it('rotates refresh token', async () => {
    const reg = await register();
    const cookie = reg.headers['set-cookie'].find(c => c.startsWith('refresh_token'));
    const res = await request(app).post('/auth/refresh').set('Cookie', cookie);
    expect(res.status).toBe(200);
  });
});
