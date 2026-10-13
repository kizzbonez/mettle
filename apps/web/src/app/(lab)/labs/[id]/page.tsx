import type { Metadata } from 'next';
import { LabWorkspace } from '@/features/labs/lab-workspace';

export const metadata: Metadata = { title: 'Lab' };

export default async function LabPage({ params }: { params: Promise<{ id: string }> }) {
  return <LabWorkspace labId={(await params).id} />;
}
