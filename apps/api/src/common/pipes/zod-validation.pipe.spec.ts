import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

const meta = {} as never;

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(z.object({ email: z.string().email(), n: z.number().min(0) }));

  it('returns parsed value for valid input', () => {
    expect(pipe.transform({ email: 'a@b.com', n: 3 }, meta)).toEqual({ email: 'a@b.com', n: 3 });
  });

  it('throws on invalid input', () => {
    expect(() => pipe.transform({ email: 'nope', n: -1 }, meta)).toThrow();
  });

  it('reports the failing field path in the message', () => {
    let captured: any;
    try {
      pipe.transform({ email: 'nope', n: 1 }, meta);
    } catch (e) {
      captured = e;
    }
    expect(captured).toBeDefined();
    const res = captured.getResponse?.() ?? {};
    expect(JSON.stringify(res)).toContain('email');
  });
});
