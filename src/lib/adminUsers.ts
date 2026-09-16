import { supabase } from './supabase';

const EDGE_FUNCTION_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export interface AdminUserRow {
  id: string;
  email: string | undefined;
  name: string | null;
  role: 'admin' | 'customer';
  created_at: string;
  last_sign_in_at: string | null;
  is_paying_customer: boolean;
}

async function callAdminUsers<T>(body: Record<string, unknown>): Promise<T> {
  const { data: session } = await supabase.auth.getSession();
  const accessToken = session.session?.access_token;
  if (!accessToken) throw new Error('Not authenticated');

  const response = await fetch(`${EDGE_FUNCTION_BASE}/admin-users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data as T;
}

export async function listAllUsers(): Promise<AdminUserRow[]> {
  const data = await callAdminUsers<{ users: AdminUserRow[] }>({ action: 'list' });
  return data.users;
}

export async function createUserAccount(
  email: string,
  password: string,
  name: string,
  role: 'admin' | 'customer'
): Promise<{ success: boolean; userId: string }> {
  return callAdminUsers({ action: 'create', email, password, name, role });
}

export async function deleteUserAccount(userId: string): Promise<{ success: boolean }> {
  return callAdminUsers({ action: 'delete', userId });
}

export async function setUserRole(userId: string, role: 'admin' | 'customer'): Promise<{ success: boolean }> {
  return callAdminUsers({ action: 'setRole', userId, role });
}
