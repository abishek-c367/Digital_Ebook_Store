import { useState } from 'react';
import { Loader2, User as UserIcon, Mail, Shield } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { showToast } from '@/components/Toast';

export function AccountPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ name })
      .eq('id', user!.id);
    if (error) {
      showToast('error', 'Failed to update profile.');
    } else {
      await refreshProfile();
      showToast('success', 'Profile updated.');
    }
    setSaving(false);
  };

  return (
    <>
      <SEO title="Account — Folio" />

      <section className="border-b border-ink-200/60 bg-ink-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="font-serif text-4xl font-light text-ink-900">Account Settings</h1>
          <p className="mt-1 text-sm text-ink-600">Manage your profile and preferences.</p>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-ink-200 bg-white p-8 shadow-elegant">
          <div className="flex items-center gap-4 border-b border-ink-100 pb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-100">
              <UserIcon className="h-7 w-7 text-ink-500" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-serif text-xl text-ink-900">{profile?.name || 'Reader'}</h2>
              <p className="text-sm text-ink-500">{profile?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="mt-6 space-y-5">
            <div>
              <label className="label-field" htmlFor="name">Display Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="label-field">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" strokeWidth={1.5} />
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="input-field pl-10 opacity-60"
                />
              </div>
              <p className="mt-1.5 text-xs text-ink-500">Email cannot be changed.</p>
            </div>
            <div>
              <label className="label-field">Role</label>
              <div className="flex items-center gap-2 rounded-lg bg-ink-50 px-4 py-3">
                <Shield className="h-4 w-4 text-ink-500" strokeWidth={1.5} />
                <span className="text-sm capitalize text-ink-700">{profile?.role || 'customer'}</span>
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <>Save Changes</>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
