import { describe, it, expect } from 'vitest';
import { ApiError } from '../../../src/core/apiError.js';

describe('ApiError', () => {
  it('creates a bad request', () => {
    const e = ApiError.badRequest('oops');
    expect(e.status).toBe(400);
    expect(e.code).toBe('BAD_REQUEST');
    expect(e.message).toBe('oops');
  });
});
