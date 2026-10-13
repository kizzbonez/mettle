'use client';

import { useApi } from '@/lib/use-api';
import type { AdminCourse, AdminTrack, Category } from '@/types/content-admin';

/** The lists the forms and filters choose from. Each is small and is read once per page. */

export function useTracks() {
  const { data, error, mutate } = useApi<{ tracks: AdminTrack[] }>('/admin/tracks');
  return { tracks: data?.tracks, error, mutate };
}

export function useCourses() {
  const { data, error, mutate } = useApi<{ courses: AdminCourse[] }>('/admin/courses');
  return { courses: data?.courses, error, mutate };
}

export function useCategories() {
  const { data, error, mutate } = useApi<{ categories: Category[] }>('/admin/categories');
  return { categories: data?.categories, error, mutate };
}
