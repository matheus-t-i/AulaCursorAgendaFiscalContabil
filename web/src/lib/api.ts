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
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!headers.has('Content-Type') && options.body && !isFormData) {
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

/** Baixa a evidência autenticada e devolve blob + nome sugerido. */
export async function fetchEvidenciaArquivo(tarefaId: string): Promise<{
  blob: Blob;
  filename: string;
  mimeType: string;
}> {
  const headers = new Headers();
  const token = getToken();
  const colaboradorId = getColaboradorId();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (colaboradorId) headers.set('x-colaborador-id', colaboradorId);

  const res = await fetch(`${API_URL}/tarefas/${tarefaId}/evidencia`, { headers });
  if (!res.ok) {
    let message = `Erro ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const disposition = res.headers.get('Content-Disposition') ?? '';
  const match = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(disposition);
  const filename = match
    ? decodeURIComponent(match[1].replace(/"/g, '').trim())
    : 'evidencia';
  const mimeType = res.headers.get('Content-Type') ?? 'application/octet-stream';
  const blob = await res.blob();
  return { blob, filename, mimeType };
}

export function openOrDownloadBlob(blob: Blob, filename: string, mimeType: string) {
  const url = URL.createObjectURL(blob);
  const canPreview =
    mimeType.startsWith('image/') ||
    mimeType === 'application/pdf' ||
    mimeType.startsWith('text/');

  if (canPreview) {
    window.open(url, '_blank', 'noopener,noreferrer');
    // libera depois de um tempo (aba nova já carregou o blob)
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const money = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};
