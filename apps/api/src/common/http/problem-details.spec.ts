import { describe, it, expect } from 'vitest';
import { toProblemDetails } from './problem-details';

describe('toProblemDetails', () => {
  it('builds a minimal problem+json document', () => {
    expect(toProblemDetails({ status: 404, title: 'Not Found' })).toEqual({
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
    });
  });

  it('includes optional fields when provided', () => {
    const p = toProblemDetails({
      status: 400,
      title: 'Bad Request',
      detail: 'invalid email',
      code: 'E_VALIDATION',
      instance: '/api/v1/users',
      errors: [{ field: 'email' }],
    });
    expect(p.detail).toBe('invalid email');
    expect(p.code).toBe('E_VALIDATION');
    expect(p.instance).toBe('/api/v1/users');
    expect(p.errors).toEqual([{ field: 'email' }]);
  });
});
