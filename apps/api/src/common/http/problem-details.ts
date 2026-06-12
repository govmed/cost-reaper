/** RFC 7807 problem+json document (NFR-9). */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  code?: string;
  errors?: unknown;
}

export function toProblemDetails(params: {
  status: number;
  title: string;
  detail?: string;
  instance?: string;
  code?: string;
  type?: string;
  errors?: unknown;
}): ProblemDetails {
  return {
    type: params.type ?? 'about:blank',
    title: params.title,
    status: params.status,
    ...(params.detail ? { detail: params.detail } : {}),
    ...(params.instance ? { instance: params.instance } : {}),
    ...(params.code ? { code: params.code } : {}),
    ...(params.errors !== undefined ? { errors: params.errors } : {}),
  };
}
