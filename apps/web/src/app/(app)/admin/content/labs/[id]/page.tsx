import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminGate } from '@/features/admin/admin-gate';
import { LabEditor } from '@/features/admin/content/labs/lab-editor';

export const metadata: Metadata = { title: 'Edit lab' };

export default async function EditLabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AdminGate allow={['instructor', 'admin']}>
      <Suspense>
        <LabEditor labId={id} />
      </Suspense>
    </AdminGate>
  );
}
