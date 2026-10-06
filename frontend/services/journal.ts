import type { Project } from './api';
const BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api';
export interface Campaign extends Project { system: string }
export interface Participant { user_id: number; name: string; role: 'MASTER' | 'PLAYER' }
export interface Session { id: number; title: string; played_on: string; summary: string; project_id: number }
export interface Entry { id: number; title: string; content: string; session_id: number | null; author_id: number; author_name: string; created_at: string; updated_at: string }
export interface CurrentUser { id: number; name: string }
export async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('forgehub_token') : null;
  if (!token) throw new Error('Entre na sua conta para acessar as campanhas.');
  const response = await fetch(`${BASE}${path}`, {
    method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(typeof error.detail === 'string' ? error.detail : response.status === 401 ? 'Sua sessão expirou. Entre novamente.' : 'Confira os dados e tente novamente.');
  }
  return response.status === 204 ? undefined as T : response.json();
}
