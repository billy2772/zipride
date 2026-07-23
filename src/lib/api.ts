// src/lib/api.ts
// Central fetch wrapper for all ZipRide backend API calls.
//
// WHY THIS EXISTS:
//   The frontend is hosted on Vercel (https://zipride-khaki.vercel.app) and the
//   backend is on Render (https://zipride-1.onrender.com). They are different origins,
//   so relative paths like fetch('/api/...') only work in local dev (via the Vite proxy).
//   In production every request must use the full absolute backend URL.
//
// USAGE:
//   import { apiFetch, API_BASE } from '@/lib/api';
//   const res = await apiFetch('/api/v1/auth/login', { method: 'POST', ... });

export const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ??
  '';

/**
 * Drop-in replacement for `fetch()` that prepends the backend base URL
 * to any path that starts with `/api` or `/uploads`.
 * Absolute URLs (already starting with http) are passed through unchanged.
 */
export function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const url =
    input.startsWith('http://') || input.startsWith('https://')
      ? input
      : `${API_BASE}${input}`;
  return fetch(url, init);
}

export default apiFetch;
