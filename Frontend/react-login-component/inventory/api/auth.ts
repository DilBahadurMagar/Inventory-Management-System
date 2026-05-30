import { api, setToken, clearToken } from './helpers';
import type { User } from '../types';

interface BackendUser {
  user_id: number;
  username: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  role: { role_name: string } | null;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: BackendUser;
}

function adaptUser(u: BackendUser): User {
  const roleMap: Record<string, 'admin' | 'manager' | 'viewer'> = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    VIEWER: 'viewer',
  };
  const roleName = u.role?.role_name ?? 'VIEWER';
  return {
    id: String(u.user_id),
    name: u.full_name ?? u.username,
    email: u.email,
    role: roleMap[roleName] ?? 'viewer',
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name ?? u.username)}&background=3b82f6&color=fff`,
    department: '',
  };
}

export async function login(email: string, password: string): Promise<User> {
  const response = await api.post<LoginResponse>('/users/login', { email, password });
  setToken(response.access_token);
  return adaptUser(response.user);
}

export async function logout(): Promise<{ success: boolean }> {
  clearToken();
  return { success: true };
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const user = await api.get<BackendUser>('/users/me');
    return adaptUser(user);
  } catch {
    clearToken();
    return null;
  }
}
