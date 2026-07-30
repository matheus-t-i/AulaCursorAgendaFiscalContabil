import type { User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

function getColaboradorId(): string | null {
  return localStorage.getItem('colaboradorId');
}

export function setSession(token: string | null, user: User | null) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');

  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('colaboradorId', user.id);
  } else {
    localStorage.removeItem('user');
    localStorage.removeItem('colaboradorId');
  }
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getToken();
  const colaboradorId = getColaboradorId();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (colaboradorId) headers.set('x-colaborador-id', colaboradorId);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(data?.error || `Erro ${res.status}`);
  }

  return data as T;
}

export const money = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};
