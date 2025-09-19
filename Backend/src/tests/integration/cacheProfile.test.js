import request from 'supertest';
import app from '../../../src/app.js';
import { describe, it, expect } from 'vitest';

async function register() {
  return request(app).post('/auth/register').send({ email: 'cache@example.com', password: 'Password123!' });
}

describe('Cache test placeholder', () => {
  it('register and fetch status', async () => {
    const reg = await register();
    const cookies = reg.headers['set-cookie'];
    const status = await request(app).get('/auth/status').set('Cookie', cookies);
    expect(status.status).toBe(200);
  });
});
