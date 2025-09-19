import request from 'supertest';
import app from '../../../src/app.js';
import { describe, it, expect } from 'vitest';

async function registerAndLogin(email='test@example.com') {
  const res = await request(app).post('/auth/register').send({ email, password: 'Password123!' });
  expect(res.status).toBe(201);
  return res;
}

describe('Auth flow', () => {
  it('register then duplicate conflict', async () => {
    const r1 = await registerAndLogin();
    const r2 = await request(app).post('/auth/register').send({ email: 'test@example.com', password: 'Password123!' });
    expect(r2.status).toBe(409);
  });
});
