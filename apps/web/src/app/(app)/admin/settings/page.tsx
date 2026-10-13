import type { Metadata } from 'next';
import { AdminGate } from '@/features/admin/admin-gate';
import { SettingsView } from '@/features/admin/email-and-settings';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <AdminGate allow={['admin']}>
      <SettingsView />
    </AdminGate>
  );
}
