import request from 'supertest';
import app from '../../../src/app.js';
import { describe, it, expect } from 'vitest';

const baseUser = {
  password: 'Password123!',
  first_name: 'Test',
  last_name: 'User',
  phone: '123456789',
  city: 'TestCity',
  country: 'TC',
  additional_info: 'Info',
  photo_url: 'https://example.com/p.png'
};

async function register(email='test@example.com') {
  return request(app).post('/auth/register').send({ email, ...baseUser });
}

describe('Auth flow', () => {
  it('register -> duplicate conflict -> login -> status -> logout', async () => {
    const r1 = await register('test@example.com');
    expect(r1.status).toBe(201);
    const duplicate = await register('test@example.com');
    expect(duplicate.status).toBe(409);

    const login = await request(app).post('/auth/login').send({ email: 'test@example.com', password: baseUser.password });
    expect(login.status).toBe(200);
    const cookies = login.headers['set-cookie'];
    expect(cookies).toBeTruthy();

    const status = await request(app).get('/auth/status').set('Cookie', cookies);
    expect(status.status).toBe(200);
    expect(status.body.authenticated).toBe(true);

    const logout = await request(app).post('/auth/logout').set('Cookie', cookies);
    expect(logout.status).toBe(200);
  });
});
