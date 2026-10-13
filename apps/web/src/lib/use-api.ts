'use client';

import useSWR, { mutate, type SWRConfiguration, type SWRResponse } from 'swr';
import { api, type ApiError } from './api';

const PROGRESS_PATHS = ['/catalog', '/courses', '/exams', '/me/'];

/**
 * Marks everything derived from a learner's progress as out of date: the
 * catalog, level pages, exam overviews, the dashboard and the skill tree.
 *
 * Call it after a lesson is read, an exam is graded or a lab is passed.
 * Without it, a page reopened within SWR's two-second de-duplication window
 * would keep showing the numbers from before.
 */
export function refreshProgress(): Promise<unknown> {
  return mutate((key) => typeof key === 'string' && PROGRESS_PATHS.some((prefix) => key.startsWith(prefix)));
}

/** Reads an API path with caching and revalidation. Pass null to skip the request. */
export function useApi<T>(path: string | null, options?: SWRConfiguration<T, ApiError>): SWRResponse<T, ApiError> {
  return useSWR<T, ApiError>(path, (key: string) => api.get<T>(key), {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    ...options,
  });
}
