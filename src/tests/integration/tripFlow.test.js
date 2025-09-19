import request from 'supertest';
import app from '../../../src/app.js';
import { describe, it, expect } from 'vitest';

async function authCookies() {
  const email = `tripflow_${Date.now()}@example.com`;
  const reg = await request(app).post('/auth/register').send({ email, password: 'Password123!' });
  return reg.headers['set-cookie'];
}

describe('Trip flow', () => {
  it('creates trip -> stop -> activity -> assign -> budget', async () => {
    const cookies = await authCookies();
    const tripRes = await request(app).post('/trips').set('Cookie', cookies).send({
      name: 'Europe Adventure',
      start_date: '2025-01-01',
      end_date: '2025-01-10',
      start_location: 'New York, USA',
      end_location: 'Rome, Italy'
    });
    expect(tripRes.status).toBe(201);
    const tripId = tripRes.body.id;

    const stop = await request(app).post(`/trips/${tripId}/stops`).set('Cookie', cookies).send({ position: 1, city: 'Paris', country: 'FR', start_date: '2025-01-01', end_date: '2025-01-03' });
    expect(stop.status).toBe(201);
    const stopId = stop.body.id;

    const act = await request(app).post('/trips/activities').set('Cookie', cookies).send({ title: 'Louvre Visit', base_cost: 50 });
    expect(act.status).toBe(201);
    const activityId = act.body.id;

    const assign = await request(app).post(`/trips/stops/${stopId}/activities`).set('Cookie', cookies).send({ activity_id: activityId, day_offset: 0, cost_override: 60 });
    expect(assign.status).toBe(201);

    const budget = await request(app).get(`/trips/${tripId}/budget`).set('Cookie', cookies);
    expect(budget.status).toBe(200);
    expect(budget.body.total).toBe(60);
  });
});
