import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminGate } from '@/features/admin/admin-gate';
import { LabEditor } from '@/features/admin/content/labs/lab-editor';

export const metadata: Metadata = { title: 'New lab' };

export default function NewLabPage() {
  return (
    <AdminGate allow={['instructor', 'admin']}>
      <Suspense>
        <LabEditor />
      </Suspense>
    </AdminGate>
  );
}
